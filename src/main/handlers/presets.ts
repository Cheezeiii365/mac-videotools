import { IpcMain } from 'electron';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { IpcChannel, Preset } from '../../shared/types';
import { builtInPresets } from '../../shared/presets';

function getPresetsPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'presets.json');
}

function loadUserPresets(): Preset[] {
  const presetsPath = getPresetsPath();
  try {
    if (fs.existsSync(presetsPath)) {
      return JSON.parse(fs.readFileSync(presetsPath, 'utf-8'));
    }
  } catch {
    // Ignore corrupt file
  }
  return [];
}

function saveUserPresets(presets: Preset[]): void {
  const presetsPath = getPresetsPath();
  const dir = path.dirname(presetsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(presetsPath, JSON.stringify(presets, null, 2));
}

export function registerPresetHandlers(ipcMain: IpcMain) {
  ipcMain.handle(IpcChannel.GET_PRESETS, async () => {
    const userPresets = loadUserPresets();
    return [...builtInPresets, ...userPresets];
  });

  ipcMain.handle(IpcChannel.SAVE_PRESET, async (_event, preset: Preset) => {
    const userPresets = loadUserPresets();
    const existing = userPresets.findIndex((p) => p.id === preset.id);
    if (existing >= 0) {
      userPresets[existing] = preset;
    } else {
      userPresets.push(preset);
    }
    saveUserPresets(userPresets);
    return [...builtInPresets, ...userPresets];
  });

  ipcMain.handle(IpcChannel.DELETE_PRESET, async (_event, presetId: string) => {
    const userPresets = loadUserPresets().filter((p) => p.id !== presetId);
    saveUserPresets(userPresets);
    return [...builtInPresets, ...userPresets];
  });
}
