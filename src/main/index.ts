import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { registerConversionHandlers } from './handlers/conversion';
import { registerDownloadHandlers } from './handlers/download';
import { registerJobHandlers } from './handlers/jobs';
import { registerPresetHandlers } from './handlers/presets';
import { registerSystemHandlers } from './handlers/system';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register IPC handlers
  registerJobHandlers(ipcMain);
  registerConversionHandlers(ipcMain, () => mainWindow);
  registerDownloadHandlers(ipcMain, () => mainWindow);
  registerPresetHandlers(ipcMain);
  registerSystemHandlers(ipcMain);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
