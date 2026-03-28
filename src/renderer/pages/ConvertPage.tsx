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

      // Probe each file
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

      // Start the conversion (non-blocking — fires and updates via IPC events)
      window.api.startConversion(jobId, inputPath, outputPath, options).catch(() => {});
    }

    store.setPage('queue');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Convert & Transcode</h2>

      {!hasDesktopApi && (
        <div className="card border border-yellow-500/30 bg-yellow-500/10 text-yellow-200">
          Native file selection, probing, and transcoding are unavailable in browser-only mode. Run the app through Electron with `npm run dev` or `npm start`.
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`card border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[160px] gap-3 ${
          isDragOver ? 'border-accent bg-accent/5' : 'border-surface-4 hover:border-gray-500'
        }`}
        onClick={hasDesktopApi ? handleSelectFiles : undefined}
      >
        <div className="text-3xl text-gray-500">+</div>
        <p className="text-sm text-gray-400">
          Drop media files here or <span className="text-accent">browse</span>
        </p>
        {probing && <p className="text-xs text-gray-500">Analyzing files...</p>}
      </div>

      {/* Selected files */}
      {store.selectedFiles.length > 0 && (
        <div className="card space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300">
              {store.selectedFiles.length} file{store.selectedFiles.length > 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={() => store.setSelectedFiles([])}
              className="text-xs text-gray-500 hover:text-gray-300"
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
                className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.split('/').pop()}</p>
                  {info && (
                    <p className="text-xs text-gray-500">
                      {video ? `${video.codec_name} ${video.width}x${video.height}` : ''}
                      {video && audio ? ' • ' : ''}
                      {audio ? `${audio.codec_name} ${audio.channels}ch` : ''}
                      {info.format.duration
                        ? ` • ${formatDuration(parseFloat(info.format.duration))}`
                        : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFile(file)}
                  className="text-gray-500 hover:text-red-400 text-sm"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset selector */}
      <div className="card space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Output Preset</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {store.presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => store.setSelectedPresetId(preset.id)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                store.selectedPresetId === preset.id
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-surface-4 bg-surface-2 text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              <p className="font-medium text-xs">{preset.name}</p>
            </button>
          ))}
        </div>
        {selectedPreset && (
          <p className="text-xs text-gray-500">{selectedPreset.description}</p>
        )}
      </div>

      {/* Quality overrides */}
      <div className="card space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Quality Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">CRF (Quality)</label>
            <input
              type="range"
              min={0}
              max={51}
              value={customOptions.crf ?? selectedPreset?.options.crf ?? 18}
              onChange={(e) => setCustomOptions({ ...customOptions, crf: parseInt(e.target.value) })}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Lossless</span>
              <span className="text-accent font-medium">
                {customOptions.crf ?? selectedPreset?.options.crf ?? 18}
              </span>
              <span>Smallest</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Audio Bitrate</label>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trim Start (HH:MM:SS)</label>
            <input
              className="input"
              placeholder="00:00:00"
              value={customOptions.trimStart ?? ''}
              onChange={(e) => setCustomOptions({ ...customOptions, trimStart: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trim End (HH:MM:SS)</label>
            <input
              className="input"
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
          <label className="block text-xs text-gray-500 mb-1">Output Directory</label>
          <div className="flex gap-2">
            <input
              className="input"
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
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed px-8"
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
