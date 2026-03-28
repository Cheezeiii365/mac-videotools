import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolves paths to bundled binaries (ffmpeg, ffprobe, yt-dlp).
 * In development, falls back to system-installed binaries.
 * In production, looks inside the app bundle's resources directory.
 */

function findBinary(name: string): string {
  // 1. Check bundled path (for packaged app)
  const bundledPath = path.join(process.resourcesPath || '', 'bin', name);
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }

  // 2. Fall back to system PATH
  return name;
}

export function getFFmpegPath(): string {
  return findBinary('ffmpeg');
}

export function getFFprobePath(): string {
  return findBinary('ffprobe');
}

export function getYtDlpPath(): string {
  return findBinary('yt-dlp');
}
