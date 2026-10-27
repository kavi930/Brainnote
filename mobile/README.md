# Brainnote AI Mobile App (iOS & Android)

This directory contains the mobile application blueprint for Brainnote AI built using **React Native & Expo**.

## Native Capabilities
- **Native Share-Sheet Integration:** Users can tap "Share" in Safari, YouTube, Twitter/X, Voice Memos, or Files, select "Brainnote", and immediately ingest the content into their knowledge library without switching apps.
- **Offline Note Editing:** Offline notes are queued and reconciled with the server using the shared `OfflineSyncEngine`.
- **Audio Recording:** Dedicated microphone recording with affirmative consent modals and prominent recording indicators.

## Running Locally
1. Run `npm install` inside the `mobile` directory.
2. Start Expo: `npx expo start`
3. Scan the QR code using Expo Go on iOS or Android.
