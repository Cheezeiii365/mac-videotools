import { IpcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { IpcChannel, DownloadOptions, DownloadMetadata } from '../../shared/types';
import { getYtDlpPath } from '../utils/binaries';

const activeProcesses = new Map<string, ChildProcess>();

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

        proc.stdout.on('data', (data: Buffer) => {
          const line = data.toString().trim();
          win?.webContents.send(IpcChannel.JOB_LOG, { jobId, line });

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
        });

        proc.stderr.on('data', (data: Buffer) => {
          win?.webContents.send(IpcChannel.JOB_LOG, { jobId, line: data.toString() });
        });

        proc.on('close', (code) => {
          activeProcesses.delete(jobId);
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
          const error = `Failed to start yt-dlp: ${err.message}`;
          win?.webContents.send(IpcChannel.JOB_FAILED, { jobId, error });
          reject(new Error(error));
        });
      });
    }
  );
}
