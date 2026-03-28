import { IpcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { IpcChannel, ConversionOptions, MediaInfo } from '../../shared/types';
import { getFFmpegPath, getFFprobePath } from '../utils/binaries';

const activeProcesses = new Map<string, ChildProcess>();

export function registerConversionHandlers(
  ipcMain: IpcMain,
  getWindow: () => BrowserWindow | null
) {
  // Probe file with ffprobe
  ipcMain.handle(IpcChannel.PROBE_FILE, async (_event, filePath: string) => {
    const ffprobePath = getFFprobePath();
    return new Promise<MediaInfo>((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ];

      const proc = spawn(ffprobePath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error('Failed to parse ffprobe output'));
          }
        } else {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to run ffprobe: ${err.message}. Is ffmpeg installed?`));
      });
    });
  });

  // Start conversion job
  ipcMain.handle(
    IpcChannel.START_CONVERSION,
    async (_event, jobId: string, inputPath: string, outputPath: string, options: ConversionOptions) => {
      const ffmpegPath = getFFmpegPath();
      const args = buildFFmpegArgs(inputPath, outputPath, options);
      const win = getWindow();

      return new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpegPath, args);
        activeProcesses.set(jobId, proc);

        let duration = 0;

        proc.stderr.on('data', (data: Buffer) => {
          const line = data.toString();

          // Send log line
          win?.webContents.send(IpcChannel.JOB_LOG, { jobId, line });

          // Parse duration from input
          const durMatch = line.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
          if (durMatch) {
            duration =
              parseInt(durMatch[1]) * 3600 +
              parseInt(durMatch[2]) * 60 +
              parseInt(durMatch[3]) +
              parseInt(durMatch[4]) / 100;
          }

          // Parse progress
          const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
          const speedMatch = line.match(/speed=\s*([\d.]+)x/);
          if (timeMatch && duration > 0) {
            const currentTime =
              parseInt(timeMatch[1]) * 3600 +
              parseInt(timeMatch[2]) * 60 +
              parseInt(timeMatch[3]) +
              parseInt(timeMatch[4]) / 100;
            const progress = Math.min(100, (currentTime / duration) * 100);
            const speed = speedMatch ? `${speedMatch[1]}x` : undefined;

            win?.webContents.send(IpcChannel.JOB_PROGRESS, {
              jobId,
              progress: Math.round(progress * 10) / 10,
              speed,
            });
          }
        });

        proc.on('close', (code) => {
          activeProcesses.delete(jobId);
          if (code === 0) {
            win?.webContents.send(IpcChannel.JOB_COMPLETED, { jobId });
            resolve();
          } else {
            const error = `ffmpeg exited with code ${code}`;
            win?.webContents.send(IpcChannel.JOB_FAILED, { jobId, error });
            reject(new Error(error));
          }
        });

        proc.on('error', (err) => {
          activeProcesses.delete(jobId);
          const error = `Failed to start ffmpeg: ${err.message}`;
          win?.webContents.send(IpcChannel.JOB_FAILED, { jobId, error });
          reject(new Error(error));
        });
      });
    }
  );

  // Cancel job
  ipcMain.handle(IpcChannel.CANCEL_JOB, async (_event, jobId: string) => {
    const proc = activeProcesses.get(jobId);
    if (proc) {
      proc.kill('SIGTERM');
      activeProcesses.delete(jobId);
      return true;
    }
    return false;
  });
}

function buildFFmpegArgs(
  inputPath: string,
  outputPath: string,
  options: ConversionOptions
): string[] {
  const args: string[] = ['-y']; // Overwrite output

  // Hardware acceleration
  if (options.hwAccel && options.hwAccel !== 'none') {
    args.push('-hwaccel', options.hwAccel);
  }

  // Input
  if (options.trimStart) {
    args.push('-ss', options.trimStart);
  }
  args.push('-i', inputPath);
  if (options.trimEnd) {
    args.push('-to', options.trimEnd);
  }

  // Video codec
  if (options.videoCodec === 'copy') {
    args.push('-vn'); // No video for audio-only
  } else {
    args.push('-c:v', options.videoCodec);

    // CRF mode
    if (options.crf !== undefined) {
      if (options.videoCodec === 'libx265') {
        args.push('-crf', options.crf.toString());
      } else if (options.videoCodec === 'libx264') {
        args.push('-crf', options.crf.toString());
      }
    }

    // Bitrate mode
    if (options.videoBitrate) {
      args.push('-b:v', options.videoBitrate);
    }

    // ProRes profile
    if (options.videoCodec === 'prores_ks' && options.proresProfile) {
      args.push('-profile:v', options.proresProfile);
    }

    // Resolution
    if (options.width && options.height) {
      args.push('-vf', `scale=${options.width}:${options.height}`);
    }
  }

  // Audio codec
  args.push('-c:a', options.audioCodec);
  if (options.audioBitrate) {
    args.push('-b:a', options.audioBitrate);
  }

  // Extra args
  if (options.extraArgs) {
    args.push(...options.extraArgs);
  }

  args.push(outputPath);
  return args;
}
