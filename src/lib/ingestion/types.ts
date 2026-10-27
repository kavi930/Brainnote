// ==============================================================================
// Brainnote AI — Source Ingestion Adapters & Data Types (Phase 3)
// ==============================================================================

import { SourceType, SourceProcessingStatus, CitationAnchor } from '@/types';

export interface IngestionRequest {
  tenantId: string;
  userId: string;
  sourceType: SourceType;
  title?: string;
  sourceUrl?: string;
  rawText?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  // Meeting specific consent verification (Legal & Platform Compliance)
  meetingConsentConfirmed?: boolean;
  meetingPlatform?: 'zoom' | 'google_meet' | 'microsoft_teams' | 'custom_recording';
}

export interface IngestionResult {
  success: boolean;
  sourceId: string;
  noteId: string;
  sourceType: SourceType;
  title: string;
  sourceUrl?: string;
  processingStatus: SourceProcessingStatus;
  jobId?: string; // For async background processing of large files
  isAsync: boolean;
  extractedText: string;
  structuredMarkdown: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  pageCount?: number;
  slideCount?: number;
  citations: CitationAnchor[];
  metadata: Record<string, unknown>;
  error?: {
    code: IngestionErrorCode;
    message: string;
    suggestedAlternative?: string;
  };
}

export type IngestionErrorCode =
  | 'INVALID_URL'
  | 'TRANSCRIPT_UNAVAILABLE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_MIME_TYPE'
  | 'EXTRACTION_FAILED'
  | 'MEETING_CONSENT_REQUIRED'
  | 'RATE_LIMITED'
  | 'PROMPT_INJECTION_DETECTED'
  | 'INTERNAL_ERROR';

export const INGESTION_LIMITS = {
  MAX_DOCUMENT_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_MEDIA_BYTES: 150 * 1024 * 1024,   // 150 MB
  MAX_TEXT_CHARACTERS: 500_000,          // 500k chars
  SUPPORTED_DOCUMENT_MIMES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',   // DOCX
    'text/plain',
    'text/markdown',
  ],
  SUPPORTED_MEDIA_MIMES: [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ],
};
