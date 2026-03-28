interface Window {
  api: {
    probeFile: (filePath: string) => Promise<import('../shared/types').MediaInfo>;
    startConversion: (jobId: string, inputPath: string, outputPath: string, options: any) => Promise<void>;
    cancelJob: (jobId: string) => Promise<boolean>;
    fetchMetadata: (url: string) => Promise<import('../shared/types').DownloadMetadata>;
    startDownload: (jobId: string, options: any) => Promise<void>;
    getPresets: () => Promise<import('../shared/types').Preset[]>;
    savePreset: (preset: any) => Promise<import('../shared/types').Preset[]>;
    deletePreset: (presetId: string) => Promise<import('../shared/types').Preset[]>;
    detectHardware: () => Promise<import('../shared/types').HardwareInfo>;
    selectDirectory: () => Promise<string | null>;
    selectFiles: () => Promise<string[] | null>;
    getAppInfo: () => Promise<any>;
    onJobProgress: (callback: (data: any) => void) => () => void;
    onJobCompleted: (callback: (data: any) => void) => () => void;
    onJobFailed: (callback: (data: any) => void) => () => void;
    onJobLog: (callback: (data: any) => void) => () => void;
  };
}
