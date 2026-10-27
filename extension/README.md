# Brainnote AI — Chrome / Edge Manifest V3 Extension

This directory contains the production-ready Manifest V3 extension with native Side Panel support for Chrome and Microsoft Edge.

## Features

1. **Native Side Panel:** Accessible while browsing any supported website or YouTube video.
2. **1-Click Quick Capture:** Ingests the active page title, URL, and metadata directly into your Brainnote library.
3. **YouTube Timestamped Transcripts:** Detects YouTube videos and imports speaker transcripts with timestamps.
4. **Instant AI Insights:** Triggers executive summaries, action item checklists, and interactive quizzes directly from the side panel.
5. **Grounded Q&A:** Answers user queries with direct citation anchors linked to the source.
6. **Library Search:** Search your Brainnote knowledge base without switching browser tabs.
7. **Context Menu:** Right-click any selected text and choose *"Save selection to Brainnote"*.

## How to Install in Chrome / Edge

1. Open **Google Chrome** or **Microsoft Edge**.
2. Navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Toggle on **Developer mode** (top-right corner).
4. Click **Load unpacked** (top-left).
5. Select this folder:
   ```text
   C:\Users\HP\.gemini\antigravity-ide\scratch\brainnote\extension
   ```
6. The Brainnote AI icon will appear in your browser toolbar.
7. Click the toolbar icon or press `Ctrl+Shift+B` (or `Cmd+Shift+B` on macOS) to open the side panel on any website!

## Backend Connectivity

The extension connects to the Brainnote shared backend running at `http://localhost:3000`. Ensure the Next.js development or production server is active (`npm run dev`).
