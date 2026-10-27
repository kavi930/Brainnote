// ==============================================================================
// Brainnote AI — Unified Source Ingestion Router (Phase 3)
// Dispatches to appropriate adapters with error isolation and security checks
// ==============================================================================

import { IngestionRequest, IngestionResult } from './types';
import { ingestYouTubeSource } from './youtube-adapter';
import { ingestDocumentSource } from './document-adapter';
import { ingestAudioMeetingSource } from './audio-meeting-adapter';
import { ingestWebSource } from './web-adapter';

export * from './types';
export * from './sanitizer';
export * from './youtube-adapter';
export * from './document-adapter';
export * from './audio-meeting-adapter';
export * from './web-adapter';

export async function processSourceIngestion(req: IngestionRequest): Promise<IngestionResult> {
  if (!req.tenantId) {
    throw new Error('Tenant ID is required for data isolation.');
  }

  switch (req.sourceType) {
    case 'youtube':
      return ingestYouTubeSource(req);

    case 'pdf':
    case 'document':
    case 'presentation':
      return ingestDocumentSource(req);

    case 'audio':
    case 'video':
    case 'meeting':
      return ingestAudioMeetingSource(req);

    case 'web':
      return ingestWebSource(req);

    default:
      return {
        success: false,
        sourceId: `src-unknown-${Date.now()}`,
        noteId: `note-${Date.now()}`,
        sourceType: req.sourceType,
        title: req.title || 'Unknown Source',
        processingStatus: 'failed',
        isAsync: false,
        extractedText: '',
        structuredMarkdown: '',
        citations: [],
        metadata: {},
        error: {
          code: 'UNSUPPORTED_MIME_TYPE',
          message: `Source type "${req.sourceType}" is not supported.`,
          suggestedAlternative: 'Supported types: youtube, pdf, presentation, document, audio, video, meeting, web.',
        },
      };
  }
}
