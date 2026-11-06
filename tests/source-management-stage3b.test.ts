// ==============================================================================
// Brainnote AI — Stage 3B: Source Management & Grounded Retrieval Test Suite
// Rigorous verification of PDF/PPTX chunking, YouTube transcripts, Audio jobs,
// Source library, Selective RAG, BM25/Vector retrieval, and Tenant Isolation
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { ingestDocumentSource, chunkDocumentText } from '../src/lib/ingestion/document-adapter';
import { ingestYouTubeSource, extractYouTubeId } from '../src/lib/ingestion/youtube-adapter';
import { ingestAudioMeetingSource } from '../src/lib/ingestion/audio-meeting-adapter';
import { createIngestionJob, getIngestionJob, listTenantJobs } from '../src/lib/ingestion/jobs';
import { retrieveGroundedContext, extractCandidateChunks } from '../src/lib/search/retrieval';
import { searchAndAnswerGrounded } from '../src/lib/ai-provider';
import { getTenantStore, saveNoteToStore } from '../src/lib/server-store';
import { Note, NoteSource } from '../src/types';

describe('1. PDF & PPTX Extraction, Chunking & Reference Anchors', () => {
  it('correctly extracts and chunks PDF content with verifiable page references', async () => {
    const rawPdfText = `[Page 1]
Chapter 1: Foundational Database Engineering.
Multi-tenant architectures require cryptographic or row-level tenant boundary isolation.

[Page 2]
Chapter 2: Retrieval Augmented Generation.
Language models must cite verifiable evidence sources to eliminate hallucinations.

[Page 3]
Chapter 3: Subscription Quota Enforcement.
Pre-flight metering halts unauthorized API consumption before execution.`;

    const res = await ingestDocumentSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'pdf',
      fileName: 'Architecture_Handbook.pdf',
      rawText: rawPdfText,
      fileSizeBytes: 2_400_000,
      fileMimeType: 'application/pdf',
    });

    expect(res.success).toBe(true);
    expect(res.sourceType).toBe('pdf');
    expect(res.chunks).toBeDefined();
    expect(res.chunks!.length).toBeGreaterThanOrEqual(3);
    expect(res.pageCount).toBe(3);

    // Verify page numbers are preserved on chunks
    const page1Chunk = res.chunks!.find((c) => c.pageNumber === 1);
    const page2Chunk = res.chunks!.find((c) => c.pageNumber === 2);
    expect(page1Chunk).toBeDefined();
    expect(page1Chunk!.text).toContain('Database Engineering');
    expect(page2Chunk).toBeDefined();
    expect(page2Chunk!.text).toContain('Retrieval Augmented Generation');

    // Verify citations point to exact page numbers
    expect(res.citations.length).toBeGreaterThan(0);
    const cit1 = res.citations.find((c) => c.pageNumber === 1);
    expect(cit1).toBeDefined();
    expect(cit1!.formattedReference).toContain('p. 1');
  });

  it('correctly extracts and chunks PPTX content with slide references', async () => {
    const rawPptxText = `[Slide 1: Executive Roadmap]
Brainnote 2026 Commercial Strategy and Architecture.

[Slide 2: Security & RLS]
PostgreSQL Row-Level Security guarantees zero cross-tenant data leakage.

[Slide 3: Tiered Billing]
Pro plan ($19/mo) and Team plan ($49/mo) with automated quota gating.`;

    const res = await ingestDocumentSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'presentation',
      fileName: 'Board_Presentation.pptx',
      rawText: rawPptxText,
      fileSizeBytes: 4_500_000,
      fileMimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    expect(res.success).toBe(true);
    expect(res.sourceType).toBe('presentation');
    expect(res.slideCount).toBe(3);

    const slide2Chunk = res.chunks!.find((c) => c.slideNumber === 2);
    expect(slide2Chunk).toBeDefined();
    expect(slide2Chunk!.text).toContain('Row-Level Security');

    const slideCit = res.citations.find((c) => c.slideNumber === 2);
    expect(slideCit).toBeDefined();
    expect(slideCit!.formattedReference).toContain('Slide 2');
  });

  it('rejects oversized documents exceeding the 50MB limit with FILE_TOO_LARGE', async () => {
    const res = await ingestDocumentSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'pdf',
      fileName: 'Massive_Corpus.pdf',
      fileSizeBytes: 65 * 1024 * 1024, // 65MB
      fileMimeType: 'application/pdf',
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('FILE_TOO_LARGE');
    expect(res.error?.suggestedAlternative).toBeDefined();
  });

  it('rejects unsupported document formats with UNSUPPORTED_MIME_TYPE', async () => {
    const res = await ingestDocumentSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'document',
      fileName: 'binary_executable.exe',
      fileSizeBytes: 500_000,
      fileMimeType: 'application/x-msdownload',
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('UNSUPPORTED_MIME_TYPE');
  });
});

describe('2. YouTube Transcripts with Timestamp Preservation & Graceful Degradation', () => {
  it('extracts YouTube video IDs reliably across URL formats', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://invalid.com/video')).toBeNull();
  });

  it('ingests YouTube transcripts preserving verifiable timestamp seconds and citations', async () => {
    const res = await ingestYouTubeSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'youtube',
      sourceUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Architectural Foundations Keynote',
    });

    expect(res.success).toBe(true);
    expect(res.sourceType).toBe('youtube');
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.citations[0].timestampSeconds).toBeDefined();
    expect(res.citations[0].formattedReference).toMatch(/\[YouTube @ \d{2}:\d{2}\]/);
    expect(res.chunks).toBeDefined();
    expect(res.chunks!.length).toBeGreaterThan(0);
  });

  it('fails gracefully without hallucinating when video transcripts are unavailable', async () => {
    const res = await ingestYouTubeSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'youtube',
      sourceUrl: 'https://youtube.com/watch?v=restricted-drm-video-no-transcript',
      title: 'Protected Music Video',
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('TRANSCRIPT_UNAVAILABLE');
    expect(res.citations).toHaveLength(0);
    expect(res.extractedText).toBe('');
    expect(res.error?.suggestedAlternative).toContain('upload an audio recording');
  });
});

describe('3. Audio Uploads & Asynchronous Job Lifecycle', () => {
  it('enforces participant consent verification for meeting recordings', async () => {
    const res = await ingestAudioMeetingSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'meeting',
      fileName: 'Internal_Strategy_Sync.mp4',
      fileSizeBytes: 12_000_000,
      fileMimeType: 'audio/mp4',
      meetingConsentConfirmed: false, // Consent NOT confirmed
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('MEETING_CONSENT_REQUIRED');
  });

  it('creates an async background processing job for large media uploads (> 25MB)', async () => {
    const res = await ingestAudioMeetingSource({
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      sourceType: 'audio',
      fileName: 'Full_Day_Conference_Audio.mp3',
      fileSizeBytes: 35 * 1024 * 1024, // 35MB
      fileMimeType: 'audio/mp3',
    });

    expect(res.success).toBe(true);
    expect(res.isAsync).toBe(true);
    expect(res.jobId).toBeDefined();
    expect(res.processingStatus).toBe('processing');

    // Poll the created job status
    const job = getIngestionJob(res.jobId!, 'tenant-acme');
    expect(job).toBeDefined();
    expect(job!.tenantId).toBe('tenant-acme');
    expect(job!.fileName).toBe('Full_Day_Conference_Audio.mp3');
  });

  it('prevents cross-tenant job snooping', () => {
    const job = createIngestionJob('tenant-acme', 'src-123', 'audio', 'Secret_Audio.mp3');
    
    // Authorized tenant access
    expect(getIngestionJob(job.id, 'tenant-acme')).not.toBeNull();
    
    // Unauthorized tenant access attempt
    expect(getIngestionJob(job.id, 'tenant-adversary')).toBeNull();
  });
});

describe('4. Selective Grounding & Source-Aware Retrieval', () => {
  const mockNotes: Note[] = [
    {
      id: 'note-quantum',
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      title: 'Quantum Computing Fundamentals',
      content: 'Superposition and entanglement enable exponential speedups for specific algorithmic classes.',
      isPinned: false,
      isArchived: false,
      tags: [],
      sources: [
        {
          id: 'src-quantum-doc',
          tenantId: 'tenant-acme',
          noteId: 'note-quantum',
          sourceType: 'pdf',
          title: 'Quantum_Whitepaper.pdf',
          fileSizeBytes: 1_000_000,
          durationSeconds: 0,
          rawTranscript: '[Page 1] Superposition and entanglement define quantum supremacy algorithms.',
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
      ],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note-postgres',
      tenantId: 'tenant-acme',
      userId: 'user-alex',
      title: 'PostgreSQL Internals and RLS',
      content: 'Row-Level Security checks row policy conditions for every SELECT, UPDATE, and DELETE query.',
      isPinned: false,
      isArchived: false,
      tags: [],
      sources: [
        {
          id: 'src-postgres-doc',
          tenantId: 'tenant-acme',
          noteId: 'note-postgres',
          sourceType: 'document',
          title: 'Postgres_Security_Guide.md',
          fileSizeBytes: 500_000,
          durationSeconds: 0,
          rawTranscript: '[Page 1] Row-Level Security ensures tenant boundary isolation.',
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
      ],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('retrieves only from selected sources when selective grounding is active', () => {
    // Select ONLY the quantum source
    const res = retrieveGroundedContext(
      'Row-Level Security',
      mockNotes,
      ['src-quantum-doc'] // ONLY quantum source selected
    );

    // The postgres source was deselected, so it must NOT appear in matched chunks
    const matchedSourceIds = res.matchedChunks.map((m) => m.chunk.sourceId);
    expect(matchedSourceIds.includes('src-postgres-doc')).toBe(false);
  });

  it('returns zero results immediately when all sources are deselected', () => {
    const res = retrieveGroundedContext(
      'database security',
      mockNotes,
      [] // Empty selected list
    );

    expect(res.matchedChunks).toHaveLength(0);
    expect(res.totalCandidateChunks).toBe(0);
  });

  it('generates grounded answers with verifiable citations using hybrid BM25 and vector search', async () => {
    const res = await searchAndAnswerGrounded(
      'How does Row-Level Security guarantee isolation?',
      mockNotes,
      ['src-postgres-doc'],
      'technical'
    );

    expect(res.confidence).toBeGreaterThan(0.8);
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.citations[0].sourceId).toBe('src-postgres-doc');
    expect(res.citations[0].formattedReference).toContain('Postgres_Security_Guide');
    expect(res.answer).toContain('Technical Architecture Analysis');
  });

  it('returns a prompt to select sources when no sources are checked', async () => {
    const res = await searchAndAnswerGrounded('Any question', mockNotes, []);
    expect(res.citations).toHaveLength(0);
    expect(res.answer).toContain('No sources are currently selected for grounding');
  });
});
