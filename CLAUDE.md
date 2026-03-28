# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VideoTools is a macOS desktop media transcoding app built with Electron 30 + React 18 + TypeScript. It wraps ffmpeg, ffprobe, and yt-dlp in a native GUI for file conversion, downloading, and job queue management.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Full dev environment (main + renderer + Electron, with HMR)
npm run dev:main     # Watch-compile main process only
npm run dev:renderer # Vite dev server only (port 5173)
npm run build        # Production build (main + renderer)
npm start            # Launch built Electron app
```

**Dev workflow**: `npm run dev` runs three concurrent processes — TypeScript watcher for main, Vite dev server for renderer, and Electron. Main process changes require app restart; renderer changes hot-reload via Vite.

**No test or lint commands are configured.**

## Architecture

### Three-layer structure

- **`src/main/`** — Electron main process (Node.js/CommonJS). Spawns ffmpeg/ffprobe/yt-dlp as child processes, manages job lifecycle, handles file dialogs and hardware detection. Compiled with `tsconfig.main.json` to `dist/main/`.
- **`src/renderer/`** — React SPA (Vite/ESNext). Four pages: Convert, Download, Queue, Presets. State managed via a single `useStore` hook (React hooks, no external state library). Compiled with `vite.config.ts` to `dist/renderer/`.
- **`src/shared/`** — TypeScript interfaces (`types.ts`) and built-in preset definitions (`presets.ts`). Imported by both main and renderer via `@shared/*` path alias.

### IPC boundary

Communication between main and renderer goes through a context bridge (`preload.ts`). The renderer calls `window.api.*` methods which map to `ipcMain.handle` handlers. Job progress/completion/failure events stream from main to renderer via IPC event listeners. All IPC channel names are defined in `IpcChannel` enum in `src/shared/types.ts`.

### Key patterns

- **Binary resolution** (`src/main/utils/binaries.ts`): Checks bundled `resources/bin/` first, falls back to system PATH
- **Job tracking**: Active ffmpeg/yt-dlp processes tracked in a Map for cancellation support
- **Progress parsing**: ffmpeg stderr is parsed for duration/time to compute progress percentage
- **Preset storage**: Built-in presets (hardcoded) merged with user presets from `userData/presets.json`
- **Styling**: Tailwind CSS with custom dark theme (surface-0 through surface-4, accent indigo)

### TypeScript configuration

Two separate tsconfig files: `tsconfig.json` for renderer (ESNext modules) and `tsconfig.main.json` for main process (CommonJS). The `@shared/*` path alias resolves to `src/shared/*` in both.

## Prerequisites

Node.js ≥18, and ffmpeg, ffprobe, yt-dlp available on PATH (or bundled in `resources/bin/`).
