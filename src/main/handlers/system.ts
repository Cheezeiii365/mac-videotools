import { IpcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import { IpcChannel, HardwareInfo } from '../../shared/types';
import { getFFmpegPath } from '../utils/binaries';

export function registerSystemHandlers(ipcMain: IpcMain) {
  ipcMain.handle(IpcChannel.DETECT_HARDWARE, async (): Promise<HardwareInfo> => {
    const ffmpegPath = getFFmpegPath();
    const info: HardwareInfo = {
      encoders: [],
      decoders: [],
      hwAccelMethods: [],
      platform: process.platform,
    };

    // Detect encoders
    try {
      const encoders = await runCommand(ffmpegPath, ['-encoders', '-hide_banner']);
      const relevantEncoders = ['h264_nvenc', 'hevc_nvenc', 'h264_videotoolbox', 'hevc_videotoolbox', 'h264_amf', 'hevc_amf', 'prores_ks', 'dnxhd', 'libx264', 'libx265', 'libaom-av1'];
      for (const enc of relevantEncoders) {
        if (encoders.includes(enc)) {
          info.encoders.push(enc);
        }
      }
    } catch {
      // ffmpeg not available
    }

    // Detect hw accel methods
    try {
      const hwaccels = await runCommand(ffmpegPath, ['-hwaccels', '-hide_banner']);
      const methods = ['videotoolbox', 'cuda', 'nvdec', 'vaapi', 'qsv', 'dxva2', 'd3d11va'];
      for (const method of methods) {
        if (hwaccels.includes(method)) {
          info.hwAccelMethods.push(method);
        }
      }
    } catch {
      // ffmpeg not available
    }

    return info;
  });

  ipcMain.handle(IpcChannel.SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IpcChannel.SELECT_FILES, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Media Files',
          extensions: [
            'mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mxf', 'ts',
            'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'aiff', 'wma',
          ],
        },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle(IpcChannel.GET_APP_INFO, async () => {
    return {
      version: '0.1.0',
      platform: process.platform,
      arch: process.arch,
      electron: process.versions.electron,
      node: process.versions.node,
    };
  });
}

function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Command exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}
