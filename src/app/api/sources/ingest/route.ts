// ==============================================================================
// Brainnote AI — Multi-Source Ingestion API Endpoint (Phase 3)
// POST /api/sources/ingest
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { processSourceIngestion, IngestionRequest } from '@/lib/ingestion';
import { saveNoteToStore } from '@/lib/server-store';

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

    saveNoteToStore(ingestionReq.tenantId, newNote as any);

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
    return NextResponse.json(
      { error: error.message || 'Source ingestion pipeline error' },
      { status: 500 }
    );
  }
}
