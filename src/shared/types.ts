// ── Media Info (from ffprobe) ──

export interface MediaStream {
  index: number;
  codec_type: 'video' | 'audio' | 'subtitle' | 'data';
  codec_name: string;
  codec_long_name?: string;
  width?: number;
  height?: number;
  display_aspect_ratio?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  pix_fmt?: string;
  sample_rate?: string;
  channels?: number;
  channel_layout?: string;
  bit_rate?: string;
  duration?: string;
}

export interface MediaFormat {
  filename: string;
  format_name: string;
  format_long_name: string;
  duration: string;
  size: string;
  bit_rate: string;
  nb_streams: number;
}

export interface MediaInfo {
  streams: MediaStream[];
  format: MediaFormat;
}

// ── Conversion / Transcoding ──

export type VideoCodec = 'libx264' | 'libx265' | 'prores_ks' | 'dnxhd' | 'libaom-av1' | 'copy';
export type AudioCodec = 'aac' | 'libmp3lame' | 'pcm_s16le' | 'pcm_s24le' | 'flac' | 'copy';
export type Container = 'mp4' | 'mkv' | 'mov' | 'mxf' | 'wav' | 'mp3' | 'flac' | 'aiff';

export type ProResProfile = '0' | '1' | '2' | '3' | '4' | '5'; // proxy, lt, standard, hq, 4444, 4444xq

export interface ConversionOptions {
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  container: Container;
  // Quality
  crf?: number;
  videoBitrate?: string; // e.g. "10M"
  audioBitrate?: string; // e.g. "320k"
  // ProRes specific
  proresProfile?: ProResProfile;
  // Resolution
  width?: number;
  height?: number;
  // Trim
  trimStart?: string; // HH:MM:SS.ss
  trimEnd?: string;
  // Hardware acceleration
  hwAccel?: 'videotoolbox' | 'cuda' | 'nvenc' | 'amf' | 'none';
  // Extra ffmpeg args
  extraArgs?: string[];
}

// ── Presets ──

export interface Preset {
  id: string;
  name: string;
  description: string;
  options: ConversionOptions;
  createdAt: string;
  isBuiltIn: boolean;
}

// ── Download (yt-dlp) ──

export interface DownloadFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesize_approx?: number;
  format_note?: string;
  quality?: number;
}

export interface DownloadMetadata {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  upload_date?: string;
  formats: DownloadFormat[];
  url: string;
}

export type AudioFormat = 'best' | 'mp3' | 'aac' | 'flac' | 'wav' | 'opus' | 'vorbis' | 'm4a';
export type RecodeFormat = 'mp4' | 'mkv' | 'webm' | 'avi' | 'flv';
export type SubtitleFormat = 'srt' | 'ass' | 'vtt' | 'lrc';

export interface DownloadOptions {
  url: string;
  outputDir: string;

  // Format
  formatId?: string;
  formatSort?: string;             // --format-sort (e.g. "res:720,ext:mp4:m4a")
  mergeOutputFormat?: string;      // --merge-output-format

  // Audio extraction
  audioOnly?: boolean;
  audioFormat?: AudioFormat;       // --audio-format
  audioQuality?: string;           // --audio-quality (0-10 or bitrate like 320K)

  // Video recode / remux
  recodeVideo?: RecodeFormat;      // --recode-video
  remuxVideo?: string;             // --remux-video

  // Subtitles
  writeSubs?: boolean;             // --write-subs
  writeAutoSubs?: boolean;         // --write-auto-subs
  embedSubs?: boolean;             // --embed-subs
  subLangs?: string;               // --sub-langs (comma-separated)
  subFormat?: SubtitleFormat;      // --sub-format

  // Thumbnails & Metadata
  writeThumbnail?: boolean;        // --write-thumbnail
  embedThumbnail?: boolean;        // --embed-thumbnail
  embedMetadata?: boolean;         // --embed-metadata
  embedChapters?: boolean;         // --embed-chapters

  // Filename & output
  filenameTemplate?: string;       // -o template
  restrictFilenames?: boolean;     // --restrict-filenames
  windowsFilenames?: boolean;      // --windows-filenames

  // Network
  limitRate?: string;              // --limit-rate (e.g. "5M")
  proxy?: string;                  // --proxy
  socketTimeout?: number;          // --socket-timeout
  retries?: number;                // --retries
  concurrentFragments?: number;    // --concurrent-fragments

  // Playlist
  noPlaylist?: boolean;            // --no-playlist (single video from playlist URL)
  playlistItems?: string;          // --playlist-items (e.g. "1-3,5")

  // SponsorBlock
  sponsorblockRemove?: string;     // --sponsorblock-remove (e.g. "sponsor,intro")

  // Sections
  downloadSections?: string;       // --download-sections (e.g. "*10:00-15:00")

  // Post-processing
  splitChapters?: boolean;         // --split-chapters
  keepVideo?: boolean;             // --keep-video (keep original after post-processing)

  // Authentication & access
  videoPassword?: string;          // --video-password
  cookiesFromBrowser?: string;     // --cookies-from-browser (e.g. "chrome")

  // Extra raw args
  extraArgs?: string;              // Additional raw yt-dlp arguments
}

export interface DownloadPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  options: Partial<DownloadOptions>;
}

// ── Job Queue ──

export type JobType = 'convert' | 'download';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  name: string;
  inputPath?: string;
  outputPath?: string;
  progress: number; // 0-100
  speed?: string;
  eta?: string;
  error?: string;
  logs: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  // Type-specific options
  conversionOptions?: ConversionOptions;
  downloadOptions?: DownloadOptions;
}

// ── IPC Channels ──

export enum IpcChannel {
  // Conversion
  PROBE_FILE = 'probe-file',
  START_CONVERSION = 'start-conversion',
  CANCEL_JOB = 'cancel-job',
  PAUSE_JOB = 'pause-job',
  RESUME_JOB = 'resume-job',
  // Download
  FETCH_METADATA = 'fetch-metadata',
  START_DOWNLOAD = 'start-download',
  // Job events (main → renderer)
  JOB_PROGRESS = 'job-progress',
  JOB_COMPLETED = 'job-completed',
  JOB_FAILED = 'job-failed',
  JOB_LOG = 'job-log',
  // Presets
  GET_PRESETS = 'get-presets',
  SAVE_PRESET = 'save-preset',
  DELETE_PRESET = 'delete-preset',
  // System
  DETECT_HARDWARE = 'detect-hardware',
  SELECT_DIRECTORY = 'select-directory',
  SELECT_FILES = 'select-files',
  GET_APP_INFO = 'get-app-info',
}

// ── Hardware Info ──

export interface HardwareInfo {
  encoders: string[];
  decoders: string[];
  hwAccelMethods: string[];
  platform: string;
}
