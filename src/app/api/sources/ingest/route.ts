// ==============================================================================
// Brainnote AI — Multi-Source Ingestion API Endpoint (Phase 3)
// POST /api/sources/ingest
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { processSourceIngestion, IngestionRequest } from '@/lib/ingestion';
import { saveNoteToStoreAsync } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    let ingestionReq: IngestionRequest;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const sourceType = (formData.get('sourceType') as string) || 'document';
      const tenantId = (formData.get('tenantId') as string) || '';
      const title = (formData.get('title') as string) || '';
      const url = (formData.get('url') as string) || '';
      const meetingConsentConfirmed = formData.get('meetingConsentConfirmed') === 'true';
      const file = formData.get('file') as File | null;

      let fileBuffer: Buffer | undefined;
      let fileName: string | undefined;
      let fileMimeType: string | undefined;
      let fileSizeBytes: number | undefined;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileName = file.name;
        fileMimeType = file.type;
        fileSizeBytes = file.size;
      }

      ingestionReq = {
        tenantId,
        userId: 'user-active',
        sourceType: sourceType as any,
        title: title || fileName,
        sourceUrl: url,
        fileBuffer,
        fileName,
        fileMimeType,
        fileSizeBytes,
        meetingConsentConfirmed,
      };
    } else {
      const body = await req.json();
      const {
        sourceType,
        url,
        title,
        tenantId,
        rawText,
        fileSizeBytes,
        fileMimeType,
        meetingConsentConfirmed,
        meetingPlatform,
      } = body;

      ingestionReq = {
        tenantId,
        userId: 'user-active',
        sourceType,
        sourceUrl: url,
        title,
        rawText,
        fileSizeBytes,
        fileMimeType,
        meetingConsentConfirmed,
        meetingPlatform,
      };
    }

    if (!ingestionReq.tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId. Multi-tenant security requires tenant isolation scope.' },
        { status: 400 }
      );
    }

    if (!ingestionReq.sourceType) {
      return NextResponse.json(
        { error: 'Missing sourceType parameter.' },
        { status: 400 }
      );
    }

    // 1. Pre-flight Tenant Usage & Quota Gating (Cost Controls)
    const { getTenantStoreAsync } = await import('@/lib/server-store');
    const store = await getTenantStoreAsync(ingestionReq.tenantId);

    if (store.usage.notesCount >= store.usage.notesLimit) {
      return NextResponse.json(
        {
          error: `Notes limit (${store.usage.notesLimit}) reached for current plan. Please upgrade your subscription.`,
          code: 'QUOTA_EXCEEDED',
          quotaType: 'notes',
        },
        { status: 402 }
      );
    }

    const prospectiveBytes = ingestionReq.fileSizeBytes || 1_200_000;
    if (store.usage.storageBytesConsumed + prospectiveBytes > store.usage.storageBytesLimit) {
      return NextResponse.json(
        {
          error: `Storage capacity limit (${(store.usage.storageBytesLimit / (1024 * 1024)).toFixed(0)}MB) exceeded.`,
          code: 'QUOTA_EXCEEDED',
          quotaType: 'storage',
        },
        { status: 402 }
      );
    }

    if (
      (ingestionReq.sourceType === 'audio' || ingestionReq.sourceType === 'meeting') &&
      store.usage.audioMinutesTranscribed >= store.usage.audioMinutesLimit
    ) {
      return NextResponse.json(
        {
          error: `Audio transcription minutes quota (${store.usage.audioMinutesLimit} mins) exhausted.`,
          code: 'QUOTA_EXCEEDED',
          quotaType: 'audioMinutes',
        },
        { status: 402 }
      );
    }

    // 2. Duplicate Source Detection
    for (const note of store.notes) {
      for (const existingSrc of note.sources || []) {
        const isUrlDup = ingestionReq.sourceUrl && existingSrc.sourceUrl === ingestionReq.sourceUrl;
        const isFileDup =
          ingestionReq.fileName &&
          existingSrc.title === ingestionReq.fileName &&
          existingSrc.fileSizeBytes === ingestionReq.fileSizeBytes;

        if (isUrlDup || isFileDup) {
          return NextResponse.json({
            success: true,
            isDuplicate: true,
            message: `Source "${existingSrc.title}" is already present in your knowledge library.`,
            noteId: note.id,
            source: existingSrc,
            note,
          });
        }
      }
    }

    const result = await processSourceIngestion(ingestionReq);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || 'Ingestion failed',
          errorCode: result.error?.code,
          suggestedAlternative: result.error?.suggestedAlternative,
        },
        { status: 400 }
      );
    }

    const sourceRecord = {
      id: result.sourceId,
      tenantId: ingestionReq.tenantId,
      noteId: result.noteId,
      sourceType: result.sourceType,
      title: result.title,
      sourceUrl: result.sourceUrl,
      durationSeconds: result.durationSeconds,
      fileSizeBytes: result.fileSizeBytes,
      rawTranscript: result.extractedText,
      processingStatus: result.processingStatus,
      createdAt: new Date().toISOString(),
      metadata: result.metadata,
    };

    const newNote = {
      id: result.noteId,
      tenantId: ingestionReq.tenantId,
      userId: ingestionReq.userId || 'user-active',
      title: result.title,
      content: result.structuredMarkdown,
      isPinned: true,
      isArchived: false,
      tags: [
        { id: `t-${result.sourceType}-${Date.now()}`, tenantId: ingestionReq.tenantId, name: result.sourceType, color: '#7C3AED' },
      ],
      sources: [sourceRecord],
      aiArtifacts: [
        {
          id: `art-sum-${Date.now()}`,
          tenantId: ingestionReq.tenantId,
          noteId: result.noteId,
          userId: ingestionReq.userId || 'user-active',
          artifactType: 'summary' as const,
          title: 'Executive Summary',
          content: {
            summaryText: `Extracted key insights from ${result.title}. Content processed and grounded with citations.`,
            keyTakeaways: [
              'Source analyzed and indexed with verifiable citations.',
              'Grounded context extracted for downstream study tools & active recall.',
            ],
          },
          modelUsed: 'Gemini 1.5 Pro',
          tokensConsumed: 1200,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Record consumption metrics into tenant usage
    store.usage.notesCount += 1;
    store.usage.storageBytesConsumed += result.fileSizeBytes || 1_200_000;
    if (result.sourceType === 'audio' || result.sourceType === 'meeting') {
      store.usage.audioMinutesTranscribed += Math.ceil((result.durationSeconds || 1800) / 60);
    }
    store.usage.aiTokensConsumed += 1200;

    await saveNoteToStoreAsync(ingestionReq.tenantId, newNote as any);

    return NextResponse.json({
      success: true,
      noteId: result.noteId,
      source: sourceRecord,
      note: newNote,
      initialMarkdown: result.structuredMarkdown,
      isAsync: result.isAsync,
      jobId: result.jobId,
      citations: result.citations,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Ingest route error:', error);
    return NextResponse.json(
      { error: error.message || 'Source ingestion pipeline error', stack: error.stack },
      { status: 500 }
    );
  }
}
