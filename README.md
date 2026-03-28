# VideoTools

A desktop media management and transcoding app for macOS, wrapping **ffmpeg** and **yt-dlp** in a modern Electron + React GUI.

Built by [Studio 60 Records](https://github.com/Cheezeiii365).

## Features

- **Video/Audio Conversion** -- Transcode media files using ffmpeg with full control over codecs, containers, quality, resolution, and trimming
- **Media Downloads** -- Download video and audio from URLs via yt-dlp with format selection
- **Job Queue** -- Queue, monitor, pause, cancel, and review transcoding and download jobs with real-time progress
- **Presets** -- Built-in and custom presets for common workflows (H.264 web, H.265, ProRes 422 HQ, ProRes 4444, DNxHD, audio extraction, and more)
- **Hardware Acceleration** -- Optional VideoToolbox / CUDA / NVENC / AMF support
- **Native macOS Look** -- Hidden-inset title bar, dark theme, Tailwind CSS styling

## Prerequisites

- **Node.js** >= 18
- **npm**
- **ffmpeg** and **ffprobe** installed and available on your `PATH` (e.g. `brew install ffmpeg`)
- **yt-dlp** installed and available on your `PATH` (e.g. `brew install yt-dlp`)

> In a packaged build, binaries can be bundled in the app's `resources/bin/` directory instead.

## Getting Started

```bash
# Install dependencies
npm install

# Start the app in development mode
npm run dev
```

This runs the Electron main process, the Vite dev server for the renderer, and launches the app window concurrently.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the full Electron + Vite dev environment |
| `npm run build` | Build both main and renderer for production |
| `npm start` | Launch the built app (run `build` first) |
| `npm run dev:main` | Watch-compile the main process TypeScript |
| `npm run dev:renderer` | Start the Vite dev server only |

## Tech Stack

- **Electron 30** -- desktop shell
- **React 18** + **TypeScript** -- renderer UI
- **Vite 5** -- renderer bundling and HMR
- **Tailwind CSS 3** -- styling
- **ffmpeg / ffprobe** -- media transcoding and probing
- **yt-dlp** -- media downloads

## Project Structure

```
src/
  main/             # Electron main process
    index.ts        # App entry, window creation, IPC registration
    preload.ts      # Context bridge for renderer
    handlers/       # IPC handlers (conversion, download, jobs, presets, system)
    utils/          # Binary path resolution
  renderer/         # React frontend (Vite)
    App.tsx          # Root component with page routing
    pages/           # Convert, Download, Queue, Presets pages
    components/      # Sidebar and shared UI
    hooks/           # Global state (useStore)
  shared/           # Types and preset definitions shared between processes
```

## Built-in Presets

| Preset | Codec | Container | Use Case |
|--------|-------|-----------|----------|
| H.264 -- Web Delivery | libx264, CRF 18 | MP4 | Web uploads, client delivery |
| H.264 -- Fast / Draft | libx264, CRF 23 | MP4 | Previews, rough cuts |
| H.265 (HEVC) -- High Quality | libx265, CRF 20 | MP4 | Smaller files, high quality |
| ProRes 422 HQ | prores_ks | MOV | DaVinci Resolve, FCP, Premiere |
| ProRes 4444 | prores_ks | MOV | Compositing, VFX |
| DNxHD 1080p | dnxhd | MXF | Broadcast, Avid workflows |
| Extract Audio -- WAV | pcm_s24le | WAV | Uncompressed audio |
| Extract Audio -- MP3 320k | libmp3lame | MP3 | High-quality compressed audio |
| Extract Audio -- AAC 256k | aac | MP4 | AAC audio |

You can also create and save your own custom presets from the app.

## License

MIT
