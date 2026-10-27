// ==============================================================================
// Brainnote AI Mobile — Native Share-Sheet Integration (iOS & Android)
// Receives URLs, PDFs, and Voice Memos shared from external apps
// ==============================================================================

import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

export interface SharedFileItem {
  filePath?: string;
  text?: string;
  weblink?: string;
  mimeType?: string;
  contentUri?: string;
  fileName?: string;
  extension?: string;
}

export function initializeMobileShareListener(
  apiBaseUrl: string,
  tenantId: string,
  onIngestSuccess: (title: string) => void,
  onError: (error: string) => void
) {
  // Listen for items shared into Brainnote via OS share-sheet
  ReceiveSharingIntent.getReceivedFiles(
    async (files: SharedFileItem[]) => {
      if (!files || files.length === 0) return;

      const item = files[0];
      const sharedUrl = item.weblink || (item.text?.startsWith('http') ? item.text : undefined);
      const isYouTube = sharedUrl?.includes('youtube.com') || sharedUrl?.includes('youtu.be');

      try {
        const res = await fetch(`${apiBaseUrl}/api/sources/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            sourceType: isYouTube ? 'youtube' : sharedUrl ? 'web' : 'document',
            url: sharedUrl,
            title: item.fileName || (sharedUrl ? 'Shared Link' : 'Shared Note'),
            rawText: item.text,
            fileMimeType: item.mimeType,
          }),
        });

        const data = await res.json();
        if (data.success) {
          onIngestSuccess(data.source.title);
        } else {
          onError(data.error || 'Failed to ingest shared content');
        }
      } catch (err: unknown) {
        const error = err as Error;
        onError(error.message || 'Network error sharing to Brainnote');
      }
    },
    (err: unknown) => {
      console.warn('Share intent error:', err);
    },
    'BrainnoteShare'
  );
}

export function clearShareListeners() {
  ReceiveSharingIntent.clearReceivedFiles();
}
