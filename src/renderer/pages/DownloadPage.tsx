import React, { useState } from 'react';
import { AppState } from '../hooks/useStore';
import { DownloadFormat, Job } from '../../shared/types';

interface Props {
  store: AppState;
}

export default function DownloadPage({ store }: Props) {
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [audioOnly, setAudioOnly] = useState(false);

  const meta = store.downloadMetadata;

  const handleFetchMetadata = async () => {
    if (!window.api || !url.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const metadata = await window.api.fetchMetadata(url.trim());
      store.setDownloadMetadata(metadata);
      // Auto-select best format
      if (metadata.formats.length > 0) {
        const best = metadata.formats[metadata.formats.length - 1];
        setSelectedFormatId(best.format_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metadata');
      store.setDownloadMetadata(null);
    }
    setFetching(false);
  };

  const handleStartDownload = async () => {
    if (!window.api || !meta) return;

    const jobId = crypto.randomUUID();
    const job: Job = {
      id: jobId,
      type: 'download',
      status: 'queued',
      name: `Download: ${meta.title}`,
      progress: 0,
      logs: [],
      createdAt: new Date().toISOString(),
      downloadOptions: {
        url: meta.url,
        formatId: selectedFormatId || undefined,
        audioOnly,
        outputDir: store.outputDir || '/tmp',
      },
    };

    store.addJob(job);
    window.api.startDownload(jobId, job.downloadOptions).catch(() => {});
    store.setPage('queue');
  };

  // Group formats into video+audio, video-only, audio-only
  const videoFormats = meta?.formats.filter(
    (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none'
  ) || [];
  const audioFormats = meta?.formats.filter(
    (f) => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none'
  ) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Download Media</h2>
      <p className="text-sm text-gray-500">
        Paste a URL from YouTube, Vimeo, Twitter/X, TikTok, and 1,000+ other sites.
      </p>

      {/* URL Input */}
      <div className="card space-y-3">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchMetadata()}
          />
          <button
            onClick={handleFetchMetadata}
            disabled={!url.trim() || fetching}
            className="btn-primary whitespace-nowrap disabled:opacity-40"
          >
            {fetching ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Metadata preview */}
      {meta && (
        <div className="card space-y-4">
          <div className="flex gap-4">
            {meta.thumbnail && (
              <img
                src={meta.thumbnail}
                alt=""
                className="w-40 h-24 object-cover rounded-lg bg-surface-3"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{meta.title}</h3>
              {meta.uploader && (
                <p className="text-xs text-gray-500 mt-0.5">{meta.uploader}</p>
              )}
              {meta.duration && (
                <p className="text-xs text-gray-500">
                  Duration: {formatDuration(meta.duration)}
                </p>
              )}
            </div>
          </div>

          {/* Audio only toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => setAudioOnly(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-sm text-gray-300">Audio only (extract as MP3)</span>
          </label>

          {/* Format selector */}
          {!audioOnly && videoFormats.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-2">Video + Audio Formats</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {videoFormats.map((f) => (
                  <FormatOption
                    key={f.format_id}
                    format={f}
                    selected={selectedFormatId === f.format_id}
                    onSelect={() => setSelectedFormatId(f.format_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {audioOnly && audioFormats.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-2">Audio Formats</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {audioFormats.map((f) => (
                  <FormatOption
                    key={f.format_id}
                    format={f}
                    selected={selectedFormatId === f.format_id}
                    onSelect={() => setSelectedFormatId(f.format_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Output directory */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Output Directory</label>
            <div className="flex gap-2">
              <input
                className="input"
                readOnly
                value={store.outputDir || 'Select output folder...'}
              />
              <button
                onClick={async () => {
                  if (!window.api) return;
                  const dir = await window.api.selectDirectory();
                  if (dir) store.setOutputDir(dir);
                }}
                className="btn-secondary whitespace-nowrap"
              >
                Browse
              </button>
            </div>
          </div>

          <button onClick={handleStartDownload} className="btn-primary w-full">
            Download
          </button>
        </div>
      )}
    </div>
  );
}

function FormatOption({
  format,
  selected,
  onSelect,
}: {
  format: DownloadFormat;
  selected: boolean;
  onSelect: () => void;
}) {
  const size = format.filesize || format.filesize_approx;
  return (
    <button
      onClick={onSelect}
      className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
        selected
          ? 'border-accent bg-accent/10 text-white'
          : 'border-surface-4 bg-surface-2 text-gray-400 hover:border-gray-500'
      }`}
    >
      <span className="font-medium">
        {format.resolution || format.format_note || format.format_id}
      </span>
      <span className="text-gray-500 ml-1.5">
        {format.ext} {format.fps ? `${format.fps}fps` : ''}
        {size ? ` · ${(size / 1024 / 1024).toFixed(1)}MB` : ''}
      </span>
    </button>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
