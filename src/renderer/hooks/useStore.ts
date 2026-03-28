import { useState, useCallback, useEffect, useRef } from 'react';
import { Job, Preset, MediaInfo, DownloadMetadata, HardwareInfo } from '../../shared/types';

export type Page = 'convert' | 'download' | 'queue' | 'presets';

export interface AppState {
  // Navigation
  currentPage: Page;
  setPage: (page: Page) => void;

  // Jobs
  jobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;

  // Convert page
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  mediaInfo: Map<string, MediaInfo>;
  setMediaInfo: (path: string, info: MediaInfo) => void;
  outputDir: string;
  setOutputDir: (dir: string) => void;

  // Download page
  downloadMetadata: DownloadMetadata | null;
  setDownloadMetadata: (meta: DownloadMetadata | null) => void;

  // Presets
  presets: Preset[];
  setPresets: (presets: Preset[]) => void;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string | null) => void;

  // Hardware
  hardware: HardwareInfo | null;
  setHardware: (info: HardwareInfo) => void;
}

export function useStore(): AppState {
  const [currentPage, setPage] = useState<Page>('convert');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [mediaInfoMap, setMediaInfoMap] = useState<Map<string, MediaInfo>>(new Map());
  const [outputDir, setOutputDir] = useState<string>('');
  const [downloadMetadata, setDownloadMetadata] = useState<DownloadMetadata | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('h264-web');
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const addJob = useCallback((job: Job) => {
    setJobs((prev) => [...prev, job]);
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j))
    );
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const setMediaInfo = useCallback((path: string, info: MediaInfo) => {
    setMediaInfoMap((prev) => {
      const next = new Map(prev);
      next.set(path, info);
      return next;
    });
  }, []);

  // Listen for IPC events from main process
  useEffect(() => {
    if (!window.api) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      window.api.onJobProgress((data: { jobId: string; progress: number; speed?: string; eta?: string }) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === data.jobId
              ? { ...j, status: 'running', progress: data.progress, speed: data.speed, eta: data.eta }
              : j
          )
        );
      })
    );

    unsubs.push(
      window.api.onJobCompleted((data: { jobId: string }) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === data.jobId
              ? { ...j, status: 'completed', progress: 100, completedAt: new Date().toISOString() }
              : j
          )
        );
      })
    );

    unsubs.push(
      window.api.onJobFailed((data: { jobId: string; error: string }) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === data.jobId
              ? { ...j, status: 'failed', error: data.error }
              : j
          )
        );
      })
    );

    unsubs.push(
      window.api.onJobLog((data: { jobId: string; line: string }) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === data.jobId
              ? { ...j, logs: [...j.logs.slice(-500), data.line] }
              : j
          )
        );
      })
    );

    // Load presets and hardware info
    window.api.getPresets().then(setPresets).catch(() => {});
    window.api.detectHardware().then(setHardware).catch(() => {});

    return () => unsubs.forEach((fn) => fn());
  }, []);

  return {
    currentPage,
    setPage,
    jobs,
    addJob,
    updateJob,
    removeJob,
    selectedFiles,
    setSelectedFiles,
    mediaInfo: mediaInfoMap,
    setMediaInfo,
    outputDir,
    setOutputDir,
    downloadMetadata,
    setDownloadMetadata,
    presets,
    setPresets,
    selectedPresetId,
    setSelectedPresetId,
    hardware,
    setHardware,
  };
}
