import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannel } from '../shared/types';

const api = {
  // Conversion
  probeFile: (filePath: string) => ipcRenderer.invoke(IpcChannel.PROBE_FILE, filePath),
  startConversion: (jobId: string, inputPath: string, outputPath: string, options: any) =>
    ipcRenderer.invoke(IpcChannel.START_CONVERSION, jobId, inputPath, outputPath, options),
  cancelJob: (jobId: string) => ipcRenderer.invoke(IpcChannel.CANCEL_JOB, jobId),

  // Download
  fetchMetadata: (url: string) => ipcRenderer.invoke(IpcChannel.FETCH_METADATA, url),
  startDownload: (jobId: string, options: any) =>
    ipcRenderer.invoke(IpcChannel.START_DOWNLOAD, jobId, options),

  // Presets
  getPresets: () => ipcRenderer.invoke(IpcChannel.GET_PRESETS),
  savePreset: (preset: any) => ipcRenderer.invoke(IpcChannel.SAVE_PRESET, preset),
  deletePreset: (presetId: string) => ipcRenderer.invoke(IpcChannel.DELETE_PRESET, presetId),

  // System
  detectHardware: () => ipcRenderer.invoke(IpcChannel.DETECT_HARDWARE),
  selectDirectory: () => ipcRenderer.invoke(IpcChannel.SELECT_DIRECTORY),
  selectFiles: () => ipcRenderer.invoke(IpcChannel.SELECT_FILES),
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.GET_APP_INFO),

  // Events from main process
  onJobProgress: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IpcChannel.JOB_PROGRESS, listener);
    return () => ipcRenderer.removeListener(IpcChannel.JOB_PROGRESS, listener);
  },
  onJobCompleted: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IpcChannel.JOB_COMPLETED, listener);
    return () => ipcRenderer.removeListener(IpcChannel.JOB_COMPLETED, listener);
  },
  onJobFailed: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IpcChannel.JOB_FAILED, listener);
    return () => ipcRenderer.removeListener(IpcChannel.JOB_FAILED, listener);
  },
  onJobLog: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IpcChannel.JOB_LOG, listener);
    return () => ipcRenderer.removeListener(IpcChannel.JOB_LOG, listener);
  },
};

contextBridge.exposeInMainWorld('api', api);
