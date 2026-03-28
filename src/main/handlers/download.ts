import { IpcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { IpcChannel, DownloadOptions, DownloadMetadata } from '../../shared/types';
import { getYtDlpPath } from '../utils/binaries';
import { registerJobCancellation, unregisterJobCancellation } from './jobs';

const activeProcesses = new Map<string, ChildProcess>();
const cancelledJobs = new Set<string>();

export function registerDownloadHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
) {
  // Fetch metadata from URL
  ipcMain.handle(IpcChannel.FETCH_METADATA, async (_event, url: string) => {
    const ytdlpPath = getYtDlpPath();
    return new Promise<DownloadMetadata>((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-download',
        '--no-warnings',
        url,
      ];

      const proc = spawn(ytdlpPath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            resolve({
              id: data.id,
              title: data.title,
              description: data.description,
              thumbnail: data.thumbnail,
              duration: data.duration,
              uploader: data.uploader || data.channel,
              upload_date: data.upload_date,
              formats: (data.formats || []).map((f: any) => ({
                format_id: f.format_id,
                ext: f.ext,
                resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : undefined),
                fps: f.fps,
                vcodec: f.vcodec,
                acodec: f.acodec,
                filesize: f.filesize,
                filesize_approx: f.filesize_approx,
                format_note: f.format_note,
                quality: f.quality,
              })),
              url,
            });
          } catch {
            reject(new Error('Failed to parse yt-dlp output'));
          }
        } else {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to run yt-dlp: ${err.message}. Is yt-dlp installed?`));
      });
    });
  });

  // Start download
  ipcMain.handle(
    IpcChannel.START_DOWNLOAD,
    async (_event, jobId: string, options: DownloadOptions) => {
      const ytdlpPath = getYtDlpPath();
      const win = getWindow();
      const existingTempFiles = await snapshotPartialFiles(options.outputDir);

      const args: string[] = [
        '--newline', // Progress on separate lines
        '--no-warnings',
        '-o', `${options.outputDir}/${options.filenameTemplate || '%(title)s.%(ext)s'}`,
      ];

      if (options.formatId) {
        args.push('-f', options.formatId);
      }
      if (options.audioOnly) {
        args.push('-x', '--audio-format', 'mp3');
      }

      args.push(options.url);

      return new Promise<void>((resolve, reject) => {
        const proc = spawn(ytdlpPath, args);
        activeProcesses.set(jobId, proc);
        const trackedOutputPaths = new Set<string>();

        registerJobCancellation(jobId, () => {
          cancelledJobs.add(jobId);
          proc.kill('SIGTERM');
        });

        proc.stdout.on('data', (data: Buffer) => {
          for (const line of splitLines(data.toString())) {
            win?.webContents.send(IpcChannel.JOB_LOG, { jobId, line });

            const destinationPath = extractDestinationPath(line);
            if (destinationPath) {
              trackedOutputPaths.add(path.resolve(destinationPath));
            }

            // Parse download progress: [download]  45.2% of ~50.00MiB at 10.00MiB/s ETA 00:03
            const progressMatch = line.match(/\[download\]\s+([\d.]+)%/);
            if (progressMatch) {
              const progress = parseFloat(progressMatch[1]);
              const speedMatch = line.match(/at\s+([\d.]+\w+\/s)/);
              const etaMatch = line.match(/ETA\s+([\d:]+)/);

              win?.webContents.send(IpcChannel.JOB_PROGRESS, {
                jobId,
                progress: Math.round(progress * 10) / 10,
                speed: speedMatch ? speedMatch[1] : undefined,
                eta: etaMatch ? etaMatch[1] : undefined,
              });
            }
          }
        });

        proc.stderr.on('data', (data: Buffer) => {
          for (const line of splitLines(data.toString())) {
            win?.webContents.send(IpcChannel.JOB_LOG, { jobId, line });
          }
        });

        proc.on('close', async (code) => {
          activeProcesses.delete(jobId);
          unregisterJobCancellation(jobId);
          if (cancelledJobs.delete(jobId)) {
            await cleanupPartialFiles(jobId, options.outputDir, existingTempFiles, trackedOutputPaths, win);
            resolve();
            return;
          }
          if (code === 0) {
            win?.webContents.send(IpcChannel.JOB_COMPLETED, { jobId });
            resolve();
          } else {
            const error = `yt-dlp exited with code ${code}`;
            win?.webContents.send(IpcChannel.JOB_FAILED, { jobId, error });
            reject(new Error(error));
          }
        });

        proc.on('error', (err) => {
          activeProcesses.delete(jobId);
          unregisterJobCancellation(jobId);
          const error = `Failed to start yt-dlp: ${err.message}`;
          win?.webContents.send(IpcChannel.JOB_FAILED, { jobId, error });
          reject(new Error(error));
        });
      });
    }
  );
}

function splitLines(chunk: string): string[] {
  return chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractDestinationPath(line: string): string | null {
  const matchers = [
    /\[download\]\s+Destination:\s+(.+)$/,
    /\[ExtractAudio\]\s+Destination:\s+(.+)$/,
    /\[Merger\]\s+Merging formats into\s+"(.+)"$/,
  ];

  for (const matcher of matchers) {
    const match = line.match(matcher);
    if (!match) {
      continue;
    }

    return match[1].replace(/^"(.*)"$/, '$1');
  }

  return null;
}

function isPartialDownloadFile(fileName: string): boolean {
  return /\.part($|-)/i.test(fileName) || /\.ytdl$/i.test(fileName) || /\.temp$/i.test(fileName);
}

async function snapshotPartialFiles(outputDir: string): Promise<Set<string>> {
  try {
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    return new Set(
      entries
        .filter((entry) => entry.isFile() && isPartialDownloadFile(entry.name))
        .map((entry) => entry.name)
    );
  } catch {
    return new Set<string>();
  }
}

function matchesTrackedOutput(fileName: string, trackedOutputPaths: Set<string>, outputDir: string): boolean {
  if (trackedOutputPaths.size === 0) {
    return true;
  }

  for (const trackedPath of trackedOutputPaths) {
    if (path.dirname(trackedPath) !== path.resolve(outputDir)) {
      continue;
    }

    const trackedName = path.basename(trackedPath);
    if (fileName === `${trackedName}.ytdl` || fileName.startsWith(`${trackedName}.part`)) {
      return true;
    }
  }

  return false;
}

async function cleanupPartialFiles(
  jobId: string,
  outputDir: string,
  existingTempFiles: Set<string>,
  trackedOutputPaths: Set<string>,
  win: BrowserWindow | null
) {
  try {
    const resolvedOutputDir = path.resolve(outputDir);
    const entries = await fs.readdir(resolvedOutputDir, { withFileTypes: true });
    const filesToDelete = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => isPartialDownloadFile(fileName))
      .filter((fileName) => !existingTempFiles.has(fileName))
      .filter((fileName) => matchesTrackedOutput(fileName, trackedOutputPaths, resolvedOutputDir));

    await Promise.all(
      filesToDelete.map((fileName) => fs.rm(path.join(resolvedOutputDir, fileName), { force: true }))
    );

    if (filesToDelete.length > 0) {
      win?.webContents.send(IpcChannel.JOB_LOG, {
        jobId,
        line: `Removed partial files: ${filesToDelete.join(', ')}`,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    win?.webContents.send(IpcChannel.JOB_LOG, {
      jobId,
      line: `Failed to clean partial files: ${message}`,
    });
  }
}
