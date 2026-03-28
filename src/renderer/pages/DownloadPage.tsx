import React, { useState } from 'react';
import { AppState } from '../hooks/useStore';
import {
  DownloadFormat,
  DownloadOptions,
  DownloadPreset,
  Job,
} from '../../shared/types';

interface Props {
  store: AppState;
}

// ── Quick Presets ──

const DOWNLOAD_PRESETS: DownloadPreset[] = [
  {
    id: 'best',
    name: 'Best Quality',
    icon: '\u2728',
    description: 'Best video + audio, merged',
    options: { formatId: 'bv*+ba/b', mergeOutputFormat: 'mkv', embedMetadata: true },
  },
  {
    id: 'mp4-1080',
    name: '1080p MP4',
    icon: 'HD',
    description: '1080p video in MP4 container',
    options: { formatSort: 'res:1080,ext:mp4:m4a', mergeOutputFormat: 'mp4' },
  },
  {
    id: 'mp4-720',
    name: '720p MP4',
    icon: '720',
    description: '720p video, smaller file',
    options: { formatSort: 'res:720,ext:mp4:m4a', mergeOutputFormat: 'mp4' },
  },
  {
    id: 'audio-mp3',
    name: 'MP3 Audio',
    icon: '\u266B',
    description: 'Extract audio as MP3 320k',
    options: { audioOnly: true, audioFormat: 'mp3', audioQuality: '0', embedThumbnail: true, embedMetadata: true },
  },
  {
    id: 'audio-flac',
    name: 'FLAC Audio',
    icon: '\u266B',
    description: 'Lossless audio extraction',
    options: { audioOnly: true, audioFormat: 'flac', embedMetadata: true },
  },
  {
    id: 'smallest',
    name: 'Smallest',
    icon: '\u2193',
    description: 'Lowest quality, fastest download',
    options: { formatSort: '+size,+res', mergeOutputFormat: 'mp4' },
  },
];

// ── Collapsible Section ──

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-surface-3/40 pt-3.5 mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-all duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="section-label group-hover:text-gray-400 transition-colors">{title}</span>
      </button>
      {open && <div className="mt-3.5 space-y-3 animate-fade-in">{children}</div>}
    </div>
  );
}

// ── Field helpers ──

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <label className="text-[12px] text-gray-500 pt-2 text-right select-none font-medium">
        {label}
        {hint && <span className="block text-[10px] text-gray-700 font-normal mt-0.5">{hint}</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-[18px] rounded-full transition-all duration-200 ${
          checked ? 'bg-accent shadow-glow-sm' : 'bg-surface-4'
        }`}
      >
        <div
          className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all duration-200 shadow-sm ${
            checked ? 'left-[15px]' : 'left-[2px]'
          }`}
        />
      </div>
      <span className="text-[12px] text-gray-500 group-hover:text-gray-300 transition-colors select-none font-medium">
        {label}
      </span>
    </label>
  );
}

function SmallInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      className={`bg-surface-2 border border-surface-4 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-200 placeholder-gray-700 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200 shadow-inset-top ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function SmallSelect({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      className={`bg-surface-2 border border-surface-4 rounded-lg px-2.5 py-1.5 text-[12px] text-gray-200 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200 appearance-none cursor-pointer shadow-inset-top ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Main Component ──

export default function DownloadPage({ store }: Props) {
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const hasDesktopApi = typeof window !== 'undefined' && !!window.api;

  // Download options state
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [formatSort, setFormatSort] = useState('');
  const [mergeOutputFormat, setMergeOutputFormat] = useState('');
  const [audioOnly, setAudioOnly] = useState(false);
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [audioQuality, setAudioQuality] = useState('0');
  const [recodeVideo, setRecodeVideo] = useState('');
  const [writeSubs, setWriteSubs] = useState(false);
  const [writeAutoSubs, setWriteAutoSubs] = useState(false);
  const [embedSubs, setEmbedSubs] = useState(false);
  const [subLangs, setSubLangs] = useState('en');
  const [subFormat, setSubFormat] = useState('srt');
  const [writeThumbnail, setWriteThumbnail] = useState(false);
  const [embedThumbnail, setEmbedThumbnail] = useState(false);
  const [embedMetadata, setEmbedMetadata] = useState(false);
  const [embedChapters, setEmbedChapters] = useState(false);
  const [filenameTemplate, setFilenameTemplate] = useState('%(title)s.%(ext)s');
  const [restrictFilenames, setRestrictFilenames] = useState(false);
  const [limitRate, setLimitRate] = useState('');
  const [proxy, setProxy] = useState('');
  const [retries, setRetries] = useState('10');
  const [concurrentFragments, setConcurrentFragments] = useState('1');
  const [noPlaylist, setNoPlaylist] = useState(true);
  const [playlistItems, setPlaylistItems] = useState('');
  const [sponsorblockRemove, setSponsorblockRemove] = useState('');
  const [downloadSections, setDownloadSections] = useState('');
  const [splitChapters, setSplitChapters] = useState(false);
  const [keepVideo, setKeepVideo] = useState(false);
  const [videoPassword, setVideoPassword] = useState('');
  const [cookiesFromBrowser, setCookiesFromBrowser] = useState('');
  const [extraArgs, setExtraArgs] = useState('');

  const meta = store.downloadMetadata;

  const applyPreset = (preset: DownloadPreset) => {
    setSelectedFormatId('');
    setFormatSort('');
    setMergeOutputFormat('');
    setAudioOnly(false);
    setAudioFormat('mp3');
    setAudioQuality('0');
    setRecodeVideo('');
    setEmbedThumbnail(false);
    setEmbedMetadata(false);

    const o = preset.options;
    if (o.formatId) setSelectedFormatId(o.formatId);
    if (o.formatSort) setFormatSort(o.formatSort);
    if (o.mergeOutputFormat) setMergeOutputFormat(o.mergeOutputFormat);
    if (o.audioOnly) setAudioOnly(true);
    if (o.audioFormat) setAudioFormat(o.audioFormat);
    if (o.audioQuality) setAudioQuality(o.audioQuality);
    if (o.recodeVideo) setRecodeVideo(o.recodeVideo);
    if (o.embedThumbnail) setEmbedThumbnail(true);
    if (o.embedMetadata) setEmbedMetadata(true);
    setActivePreset(preset.id);
  };

  const handleFetchMetadata = async () => {
    if (!hasDesktopApi) {
      setError('Desktop bridge unavailable. Launch via `npm run dev` or `npm start`.');
      return;
    }
    if (!url.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const metadata = await window.api.fetchMetadata(url.trim());
      store.setDownloadMetadata(metadata);
      if (metadata.formats.length > 0) {
        const best = metadata.formats[metadata.formats.length - 1];
        if (!activePreset) setSelectedFormatId(best.format_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metadata');
      store.setDownloadMetadata(null);
    }
    setFetching(false);
  };

  const buildOptions = (): DownloadOptions => ({
    url: meta?.url || url.trim(),
    outputDir: store.outputDir || '/tmp',
    formatId: selectedFormatId || undefined,
    formatSort: formatSort || undefined,
    mergeOutputFormat: mergeOutputFormat || undefined,
    audioOnly,
    audioFormat: audioOnly ? (audioFormat as any) : undefined,
    audioQuality: audioOnly ? audioQuality : undefined,
    recodeVideo: recodeVideo ? (recodeVideo as any) : undefined,
    writeSubs,
    writeAutoSubs: writeSubs ? writeAutoSubs : undefined,
    embedSubs: writeSubs ? embedSubs : undefined,
    subLangs: writeSubs ? subLangs : undefined,
    subFormat: writeSubs ? (subFormat as any) : undefined,
    writeThumbnail,
    embedThumbnail,
    embedMetadata,
    embedChapters,
    filenameTemplate: filenameTemplate !== '%(title)s.%(ext)s' ? filenameTemplate : undefined,
    restrictFilenames: restrictFilenames || undefined,
    limitRate: limitRate || undefined,
    proxy: proxy || undefined,
    retries: retries !== '10' ? parseInt(retries) || undefined : undefined,
    concurrentFragments: parseInt(concurrentFragments) > 1 ? parseInt(concurrentFragments) : undefined,
    noPlaylist: noPlaylist || undefined,
    playlistItems: !noPlaylist && playlistItems ? playlistItems : undefined,
    sponsorblockRemove: sponsorblockRemove || undefined,
    downloadSections: downloadSections || undefined,
    splitChapters: splitChapters || undefined,
    keepVideo: keepVideo || undefined,
    videoPassword: videoPassword || undefined,
    cookiesFromBrowser: cookiesFromBrowser || undefined,
    extraArgs: extraArgs || undefined,
  });

  const handleStartDownload = async () => {
    if (!hasDesktopApi || !meta) return;
    const options = buildOptions();
    const jobId = crypto.randomUUID();
    const job: Job = {
      id: jobId,
      type: 'download',
      status: 'queued',
      name: `Download: ${meta.title}`,
      progress: 0,
      logs: [],
      createdAt: new Date().toISOString(),
      downloadOptions: options,
    };
    store.addJob(job);
    window.api.startDownload(jobId, job.downloadOptions).catch(() => {});
    store.setPage('queue');
  };

  const videoFormats =
    meta?.formats.filter(
      (f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none'
    ) || [];
  const audioFormats =
    meta?.formats.filter(
      (f) => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none'
    ) || [];

  return (
    <div className="px-8 pb-8 -mt-2 max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="page-title">Download Media</h2>
        <p className="page-subtitle">
          YouTube, Vimeo, Twitter/X, TikTok, and 1,000+ other sites
        </p>
      </div>

      {!hasDesktopApi && (
        <div className="card border-warning/20 bg-warning/5 text-yellow-200 text-[13px]">
          Native download actions are unavailable in browser-only mode. Run the app through Electron.
        </div>
      )}

      {/* URL Input */}
      <div className="card space-y-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Paste a URL to get started..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchMetadata()}
          />
          <button
            onClick={handleFetchMetadata}
            disabled={!url.trim() || fetching || !hasDesktopApi}
            className="btn-primary whitespace-nowrap disabled:opacity-30 disabled:shadow-none min-w-[80px]"
          >
            {fetching ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Fetching
              </span>
            ) : (
              'Fetch'
            )}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-[12px] text-red-400">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 7v3M10 13h.01" />
            </svg>
            {error}
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="section-label">Quick Presets</span>
            {activePreset && (
              <button
                onClick={() => setActivePreset(null)}
                className="text-[10px] font-medium text-gray-700 hover:text-gray-400 transition-colors"
              >
                clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DOWNLOAD_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                title={p.description}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 border ${
                  activePreset === p.id
                    ? 'border-accent/50 bg-accent/10 text-accent-hover shadow-glow-sm'
                    : 'border-surface-4/60 bg-surface-2/40 text-gray-500 hover:border-surface-5 hover:text-gray-300 hover:bg-surface-2'
                }`}
              >
                <span className="text-[10px] opacity-50">{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metadata preview + options */}
      {meta && (
        <div className="card space-y-5 animate-fade-in">
          {/* Video info */}
          <div className="flex gap-4">
            {meta.thumbnail && (
              <img
                src={meta.thumbnail}
                alt=""
                className="w-44 h-[100px] object-cover rounded-lg bg-surface-3 flex-shrink-0 border border-surface-3"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[14px] text-gray-200 leading-snug line-clamp-2">{meta.title}</h3>
              {meta.uploader && (
                <p className="text-[12px] text-gray-500 mt-1 font-medium">{meta.uploader}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {meta.duration && (
                  <span className="badge bg-surface-3/80 text-gray-400 border border-surface-4/50 font-mono text-[10px]">
                    {formatDuration(meta.duration)}
                  </span>
                )}
                <span className="text-[11px] text-gray-600">
                  {meta.formats.length} formats available
                </span>
              </div>
            </div>
          </div>

          {/* Audio only toggle */}
          <div className="flex items-center gap-5">
            <Toggle
              checked={audioOnly}
              onChange={(v) => {
                setAudioOnly(v);
                setActivePreset(null);
              }}
              label="Audio only"
            />
            {audioOnly && (
              <div className="flex items-center gap-2">
                <SmallSelect
                  value={audioFormat}
                  onChange={setAudioFormat}
                  options={[
                    { value: 'best', label: 'Best' },
                    { value: 'mp3', label: 'MP3' },
                    { value: 'aac', label: 'AAC' },
                    { value: 'flac', label: 'FLAC' },
                    { value: 'wav', label: 'WAV' },
                    { value: 'opus', label: 'Opus' },
                    { value: 'vorbis', label: 'Vorbis' },
                    { value: 'm4a', label: 'M4A' },
                  ]}
                  className="w-20"
                />
                <SmallSelect
                  value={audioQuality}
                  onChange={setAudioQuality}
                  options={[
                    { value: '0', label: 'Best' },
                    { value: '2', label: 'High' },
                    { value: '5', label: 'Medium' },
                    { value: '8', label: 'Low' },
                  ]}
                  className="w-20"
                />
              </div>
            )}
          </div>

          {/* Format selector */}
          {!audioOnly && videoFormats.length > 0 && (
            <div>
              <h4 className="section-label mb-2.5">Video + Audio Formats</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {videoFormats.map((f) => (
                  <FormatOption
                    key={f.format_id}
                    format={f}
                    selected={selectedFormatId === f.format_id}
                    onSelect={() => {
                      setSelectedFormatId(f.format_id);
                      setActivePreset(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {audioOnly && audioFormats.length > 0 && (
            <div>
              <h4 className="section-label mb-2.5">Audio Formats</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {audioFormats.map((f) => (
                  <FormatOption
                    key={f.format_id}
                    format={f}
                    selected={selectedFormatId === f.format_id}
                    onSelect={() => {
                      setSelectedFormatId(f.format_id);
                      setActivePreset(null);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Advanced Options ── */}
          <Section title="Format & Output">
            <FieldRow label="Format sort" hint="--format-sort">
              <SmallInput
                value={formatSort}
                onChange={setFormatSort}
                placeholder="e.g. res:1080,ext:mp4:m4a"
                className="w-full"
              />
            </FieldRow>
            <FieldRow label="Merge format" hint="--merge-output-format">
              <SmallSelect
                value={mergeOutputFormat}
                onChange={setMergeOutputFormat}
                options={[
                  { value: '', label: 'Auto' },
                  { value: 'mp4', label: 'MP4' },
                  { value: 'mkv', label: 'MKV' },
                  { value: 'webm', label: 'WebM' },
                ]}
                className="w-24"
              />
            </FieldRow>
            <FieldRow label="Recode video" hint="--recode-video">
              <SmallSelect
                value={recodeVideo}
                onChange={setRecodeVideo}
                options={[
                  { value: '', label: 'None' },
                  { value: 'mp4', label: 'MP4' },
                  { value: 'mkv', label: 'MKV' },
                  { value: 'webm', label: 'WebM' },
                  { value: 'avi', label: 'AVI' },
                  { value: 'flv', label: 'FLV' },
                ]}
                className="w-24"
              />
            </FieldRow>
            <FieldRow label="Filename" hint="-o template">
              <SmallInput
                value={filenameTemplate}
                onChange={setFilenameTemplate}
                placeholder="%(title)s.%(ext)s"
                className="w-full font-mono"
              />
            </FieldRow>
            <FieldRow label="Filenames">
              <div className="flex gap-4">
                <Toggle
                  checked={restrictFilenames}
                  onChange={setRestrictFilenames}
                  label="Restrict (ASCII)"
                />
              </div>
            </FieldRow>
          </Section>

          <Section title="Subtitles">
            <FieldRow label="Subtitles">
              <div className="space-y-2.5">
                <Toggle checked={writeSubs} onChange={setWriteSubs} label="Write subtitles" />
                {writeSubs && (
                  <div className="animate-fade-in space-y-2.5">
                    <Toggle checked={writeAutoSubs} onChange={setWriteAutoSubs} label="Auto-generated subs" />
                    <Toggle checked={embedSubs} onChange={setEmbedSubs} label="Embed in video" />
                    <div className="flex gap-2 mt-1">
                      <SmallInput
                        value={subLangs}
                        onChange={setSubLangs}
                        placeholder="en,es,fr"
                        className="w-32"
                      />
                      <SmallSelect
                        value={subFormat}
                        onChange={setSubFormat}
                        options={[
                          { value: 'srt', label: 'SRT' },
                          { value: 'ass', label: 'ASS' },
                          { value: 'vtt', label: 'VTT' },
                          { value: 'lrc', label: 'LRC' },
                        ]}
                        className="w-20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </FieldRow>
          </Section>

          <Section title="Thumbnails & Metadata">
            <FieldRow label="Thumbnails">
              <div className="flex gap-4">
                <Toggle checked={writeThumbnail} onChange={setWriteThumbnail} label="Save thumbnail" />
                <Toggle checked={embedThumbnail} onChange={setEmbedThumbnail} label="Embed in file" />
              </div>
            </FieldRow>
            <FieldRow label="Metadata">
              <div className="flex gap-4">
                <Toggle checked={embedMetadata} onChange={setEmbedMetadata} label="Embed metadata" />
                <Toggle checked={embedChapters} onChange={setEmbedChapters} label="Embed chapters" />
              </div>
            </FieldRow>
          </Section>

          <Section title="Network & Performance">
            <FieldRow label="Rate limit" hint="--limit-rate">
              <SmallInput
                value={limitRate}
                onChange={setLimitRate}
                placeholder="e.g. 5M, 500K"
                className="w-32"
              />
            </FieldRow>
            <FieldRow label="Proxy" hint="--proxy">
              <SmallInput
                value={proxy}
                onChange={setProxy}
                placeholder="socks5://127.0.0.1:1080"
                className="w-full font-mono"
              />
            </FieldRow>
            <FieldRow label="Retries" hint="--retries">
              <SmallInput
                value={retries}
                onChange={setRetries}
                placeholder="10"
                className="w-20"
              />
            </FieldRow>
            <FieldRow label="Fragments" hint="--concurrent-fragments">
              <SmallInput
                value={concurrentFragments}
                onChange={setConcurrentFragments}
                placeholder="1"
                className="w-20"
              />
            </FieldRow>
          </Section>

          <Section title="Playlist">
            <FieldRow label="Playlist">
              <div className="space-y-2.5">
                <Toggle
                  checked={noPlaylist}
                  onChange={setNoPlaylist}
                  label="Single video only (--no-playlist)"
                />
                {!noPlaylist && (
                  <SmallInput
                    value={playlistItems}
                    onChange={setPlaylistItems}
                    placeholder="e.g. 1-3,5,7-10"
                    className="w-48"
                  />
                )}
              </div>
            </FieldRow>
          </Section>

          <Section title="Post-Processing">
            <FieldRow label="SponsorBlock" hint="--sponsorblock-remove">
              <SmallInput
                value={sponsorblockRemove}
                onChange={setSponsorblockRemove}
                placeholder="sponsor,intro,outro"
                className="w-full"
              />
            </FieldRow>
            <FieldRow label="Sections" hint="--download-sections">
              <SmallInput
                value={downloadSections}
                onChange={setDownloadSections}
                placeholder="*10:00-15:00"
                className="w-48 font-mono"
              />
            </FieldRow>
            <FieldRow label="Chapters">
              <div className="flex gap-4">
                <Toggle checked={splitChapters} onChange={setSplitChapters} label="Split by chapters" />
                <Toggle checked={keepVideo} onChange={setKeepVideo} label="Keep original" />
              </div>
            </FieldRow>
          </Section>

          <Section title="Authentication">
            <FieldRow label="Video password" hint="--video-password">
              <SmallInput
                value={videoPassword}
                onChange={setVideoPassword}
                placeholder="Password"
                className="w-48"
              />
            </FieldRow>
            <FieldRow label="Cookies" hint="--cookies-from-browser">
              <SmallSelect
                value={cookiesFromBrowser}
                onChange={setCookiesFromBrowser}
                options={[
                  { value: '', label: 'None' },
                  { value: 'chrome', label: 'Chrome' },
                  { value: 'firefox', label: 'Firefox' },
                  { value: 'safari', label: 'Safari' },
                  { value: 'edge', label: 'Edge' },
                  { value: 'brave', label: 'Brave' },
                ]}
                className="w-28"
              />
            </FieldRow>
          </Section>

          <Section title="Extra Arguments">
            <FieldRow label="Raw args" hint="Appended to command">
              <SmallInput
                value={extraArgs}
                onChange={setExtraArgs}
                placeholder='e.g. --geo-bypass --age-limit 21'
                className="w-full font-mono"
              />
            </FieldRow>
          </Section>

          {/* Output directory */}
          <div className="border-t border-surface-3/40 pt-5 mt-2">
            <label className="block text-[12px] font-medium text-gray-400 mb-2">Output Directory</label>
            <div className="flex gap-2">
              <input
                className="input font-mono text-[12px]"
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

          <button onClick={handleStartDownload} className="btn-primary w-full mt-3 py-2.5">
            Download
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

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
      className={`text-left px-3.5 py-2.5 rounded-lg border text-[12px] transition-all duration-200 ${
        selected
          ? 'border-accent/50 bg-accent/8 text-white shadow-glow-sm'
          : 'border-surface-4/60 bg-surface-2/40 text-gray-500 hover:border-surface-5 hover:text-gray-300'
      }`}
    >
      <span className="font-semibold text-[12px]">
        {format.resolution || format.format_note || format.format_id}
      </span>
      <span className="text-gray-600 ml-2">
        {format.ext} {format.fps ? `${format.fps}fps` : ''}
        {size ? ` \u2022 ${(size / 1024 / 1024).toFixed(1)}MB` : ''}
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
