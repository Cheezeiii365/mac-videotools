import React, { useState, useCallback, DragEvent } from 'react';
import { AppState } from '../hooks/useStore';
import { ConversionOptions, Job, Preset } from '../../shared/types';

interface Props {
  store: AppState;
}

export default function ConvertPage({ store }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [probing, setProbing] = useState(false);
  const [customOptions, setCustomOptions] = useState<Partial<ConversionOptions>>({});
  const hasDesktopApi = typeof window !== 'undefined' && !!window.api;

  const selectedPreset = store.presets.find((p) => p.id === store.selectedPresetId);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files).map((f) => f.path);
      if (files.length === 0) return;
      store.setSelectedFiles([...store.selectedFiles, ...files]);

      if (window.api) {
        setProbing(true);
        for (const file of files) {
          try {
            const info = await window.api.probeFile(file);
            store.setMediaInfo(file, info);
          } catch {
            // Probe failed, continue
          }
        }
        setProbing(false);
      }
    },
    [store]
  );

  const handleSelectFiles = async () => {
    if (!hasDesktopApi) return;
    const files = await window.api.selectFiles();
    if (!files) return;
    store.setSelectedFiles([...store.selectedFiles, ...files]);
    setProbing(true);
    for (const file of files) {
      try {
        const info = await window.api.probeFile(file);
        store.setMediaInfo(file, info);
      } catch {}
    }
    setProbing(false);
  };

  const handleSelectOutputDir = async () => {
    if (!hasDesktopApi) return;
    const dir = await window.api.selectDirectory();
    if (dir) store.setOutputDir(dir);
  };

  const handleRemoveFile = (path: string) => {
    store.setSelectedFiles(store.selectedFiles.filter((f) => f !== path));
  };

  const handleStartConversion = async () => {
    if (!hasDesktopApi || store.selectedFiles.length === 0 || !selectedPreset) return;

    const options: ConversionOptions = {
      ...selectedPreset.options,
      ...customOptions,
    };

    for (const inputPath of store.selectedFiles) {
      const jobId = crypto.randomUUID();
      const ext = options.container;
      const basename = inputPath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'output';
      const outputPath = `${store.outputDir || '/tmp'}/${basename}_converted.${ext}`;

      const job: Job = {
        id: jobId,
        type: 'convert',
        status: 'queued',
        name: `Convert: ${basename}`,
        inputPath,
        outputPath,
        progress: 0,
        logs: [],
        createdAt: new Date().toISOString(),
        conversionOptions: options,
      };

      store.addJob(job);
      window.api.startConversion(jobId, inputPath, outputPath, options).catch(() => {});
    }

    store.setPage('queue');
  };

  return (
    <div className="px-8 pb-8 -mt-2 max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="page-title">Convert & Transcode</h2>
        <p className="page-subtitle">Drag files to convert with ffmpeg presets</p>
      </div>

      {!hasDesktopApi && (
        <div className="card border-warning/20 bg-warning/5 text-yellow-200 text-[13px]">
          Native file selection, probing, and transcoding are unavailable in browser-only mode. Run the app through Electron with <code className="font-mono text-[11px] bg-surface-3 px-1.5 py-0.5 rounded">npm run dev</code>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[180px] gap-3 group ${
          isDragOver
            ? 'border-accent bg-accent/5 shadow-glow scale-[1.01]'
            : 'border-surface-4 hover:border-surface-5 hover:bg-surface-1/50'
        }`}
        onClick={hasDesktopApi ? handleSelectFiles : undefined}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isDragOver ? 'bg-accent/15 text-accent-hover scale-110' : 'bg-surface-2 text-gray-600 group-hover:text-gray-400 group-hover:bg-surface-3'
        }`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[13px] text-gray-400 group-hover:text-gray-300 transition-colors">
            Drop media files here or <span className="text-accent font-medium">browse</span>
          </p>
          <p className="text-[11px] text-gray-600 mt-1">MP4, MOV, MKV, AVI, WAV, FLAC, MP3...</p>
        </div>
        {probing && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
            <p className="text-[11px] text-gray-500">Analyzing files...</p>
          </div>
        )}
      </div>

      {/* Selected files */}
      {store.selectedFiles.length > 0 && (
        <div className="card space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="section-label">
              {store.selectedFiles.length} file{store.selectedFiles.length > 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={() => store.setSelectedFiles([])}
              className="text-[11px] font-medium text-gray-600 hover:text-gray-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          {store.selectedFiles.map((file) => {
            const info = store.mediaInfo.get(file);
            const video = info?.streams.find((s) => s.codec_type === 'video');
            const audio = info?.streams.find((s) => s.codec_type === 'audio');
            return (
              <div
                key={file}
                className="flex items-center gap-3 bg-surface-2/60 rounded-lg px-3.5 py-2.5 group/file hover:bg-surface-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-500">
                    <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                    <path d="M12 3v4h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate text-gray-200">{file.split('/').pop()}</p>
                  {info && (
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {video ? `${video.codec_name?.toUpperCase()} ${video.width}x${video.height}` : ''}
                      {video && audio ? ' \u2022 ' : ''}
                      {audio ? `${audio.codec_name?.toUpperCase()} ${audio.channels}ch` : ''}
                      {info.format.duration
                        ? ` \u2022 ${formatDuration(parseFloat(info.format.duration))}`
                        : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFile(file)}
                  className="opacity-0 group-hover/file:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded-md hover:bg-red-500/10"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset selector */}
      <div className="card space-y-4">
        <h3 className="section-label">Output Preset</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {store.presets.map((preset) => {
            const isSelected = store.selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => store.setSelectedPresetId(preset.id)}
                className={`text-left px-3.5 py-3 rounded-lg border text-[13px] transition-all duration-200 ${
                  isSelected
                    ? 'border-accent/50 bg-accent/8 text-white shadow-glow-sm'
                    : 'border-surface-4/60 bg-surface-2/40 text-gray-500 hover:text-gray-300 hover:border-surface-5 hover:bg-surface-2'
                }`}
              >
                <p className="font-semibold text-[12px]">{preset.name}</p>
              </button>
            );
          })}
        </div>
        {selectedPreset && (
          <p className="text-[12px] text-gray-500">{selectedPreset.description}</p>
        )}
      </div>

      {/* Quality overrides */}
      <div className="card space-y-5">
        <h3 className="section-label">Quality Settings</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-2.5">CRF (Quality)</label>
            <input
              type="range"
              min={0}
              max={51}
              value={customOptions.crf ?? selectedPreset?.options.crf ?? 18}
              onChange={(e) => setCustomOptions({ ...customOptions, crf: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1.5">
              <span>Lossless</span>
              <span className="text-accent font-bold text-[12px]">
                {customOptions.crf ?? selectedPreset?.options.crf ?? 18}
              </span>
              <span>Smallest</span>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-2.5">Audio Bitrate</label>
            <select
              className="input"
              value={customOptions.audioBitrate ?? selectedPreset?.options.audioBitrate ?? '192k'}
              onChange={(e) => setCustomOptions({ ...customOptions, audioBitrate: e.target.value })}
            >
              <option value="96k">96 kbps</option>
              <option value="128k">128 kbps</option>
              <option value="192k">192 kbps</option>
              <option value="256k">256 kbps</option>
              <option value="320k">320 kbps</option>
            </select>
          </div>
        </div>

        {/* Trim controls */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-2">Trim Start</label>
            <input
              className="input font-mono"
              placeholder="00:00:00"
              value={customOptions.trimStart ?? ''}
              onChange={(e) => setCustomOptions({ ...customOptions, trimStart: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-400 mb-2">Trim End</label>
            <input
              className="input font-mono"
              placeholder="00:00:00"
              value={customOptions.trimEnd ?? ''}
              onChange={(e) => setCustomOptions({ ...customOptions, trimEnd: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>

      {/* Output directory + Go */}
      <div className="card flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Output Directory</label>
          <div className="flex gap-2">
            <input
              className="input font-mono text-[12px]"
              readOnly
              value={store.outputDir || 'Select output folder...'}
              placeholder="Select output folder..."
            />
            <button onClick={handleSelectOutputDir} className="btn-secondary whitespace-nowrap">
              Browse
            </button>
          </div>
        </div>
        <button
          onClick={handleStartConversion}
          disabled={!hasDesktopApi || store.selectedFiles.length === 0 || !selectedPreset}
          className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none px-8"
        >
          Convert {store.selectedFiles.length > 1 ? `(${store.selectedFiles.length})` : ''}
        </button>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
