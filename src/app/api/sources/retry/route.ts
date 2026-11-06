// ==============================================================================
// Brainnote AI — Source Retry API Endpoint (Stage 3B)
// POST /api/sources/retry
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantStoreAsync, saveNoteToStoreAsync } from '@/lib/server-store';
import { processSourceIngestion } from '@/lib/ingestion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant-acme', sourceId } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'sourceId is mandatory for retry.' },
        { status: 400 }
      );
    }

    const store = await getTenantStoreAsync(tenantId);
    if (!store || store.tenant.id !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant record not found or access denied.' },
        { status: 403 }
      );
    }

    // Locate the source across notes
    let targetNote = null;
    let targetSource = null;

    for (const note of store.notes) {
      const src = (note.sources || []).find((s) => s.id === sourceId);
      if (src) {
        targetNote = note;
        targetSource = src;
        break;
      }
    }

    if (!targetNote || !targetSource) {
      return NextResponse.json(
        { error: `Source "${sourceId}" not found in tenant library.` },
        { status: 404 }
      );
    }

    // Set status to processing during retry
    targetSource.processingStatus = 'processing';
    targetSource.errorMessage = undefined;

    // Execute re-ingestion
    const retryResult = await processSourceIngestion({
      tenantId,
      userId: targetNote.userId,
      sourceType: targetSource.sourceType,
      title: targetSource.title,
      sourceUrl: targetSource.sourceUrl,
      rawText: targetSource.rawTranscript,
      fileSizeBytes: targetSource.fileSizeBytes,
      meetingConsentConfirmed: true,
    });

    if (retryResult.success) {
      targetSource.processingStatus = 'completed';
      targetSource.rawTranscript = retryResult.extractedText;
      targetSource.durationSeconds = retryResult.durationSeconds || targetSource.durationSeconds;
      (targetSource as any).metadata = {
        ...(targetSource as any).metadata,
        ...retryResult.metadata,
        retriedAt: new Date().toISOString(),
        retryCount: ((targetSource as any).metadata?.retryCount || 0) + 1,
      };

      await saveNoteToStoreAsync(tenantId, targetNote);

      return NextResponse.json({
        success: true,
        message: `Source "${targetSource.title}" re-processed successfully.`,
        source: targetSource,
      });
    } else {
      targetSource.processingStatus = 'failed';
      targetSource.errorMessage = retryResult.error?.message || 'Re-processing failed';
      await saveNoteToStoreAsync(tenantId, targetNote);

      return NextResponse.json({
        success: false,
        message: retryResult.error?.message || 'Re-processing failed',
        errorCode: retryResult.error?.code,
        source: targetSource,
      }, { status: 422 });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Retry operation failed' },
      { status: 500 }
    );
  }
}
