# Brainnote AI Desktop Companion (Windows & macOS)

This directory contains the desktop wrapper for Brainnote AI built with **Tauri v2**. It packages the shared web workspace into a secure native desktop application with global quick-capture keyboard shortcuts, local offline synchronization, and system tray integration.

## Key Features
- **System-Wide Quick Capture:** Press `Ctrl+Shift+B` (Windows) or `Cmd+Shift+B` (macOS) from any application to bring up the Brainnote capture overlay.
- **Local Offline Cache:** Notes, folders, and tags are persisted locally and reconciled via `src/lib/sync/offline-sync-engine.ts` on reconnect.
- **Native File Drop:** Drag and drop PDFs, PPTX slides, and audio files directly onto the app window.
- **Memory Efficient:** Native WebView2 (Windows) / WebKit (macOS) consumes under 60MB RAM.

## Development & Building
1. Ensure Rust is installed: `rustc --version`
2. Run in development mode: `cargo tauri dev`
3. Package native installers: `cargo tauri build`
   - Produces `.msi` / `.exe` installer on Windows.
   - Produces `.dmg` / `.app` on macOS.
