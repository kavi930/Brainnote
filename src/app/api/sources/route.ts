// ==============================================================================
// Brainnote AI — Source Library API Endpoint (Stage 3B)
// GET /api/sources?tenantId=...&status=...
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantStoreAsync } from '@/lib/server-store';
import { NoteSource } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-acme';
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');

    const store = await getTenantStoreAsync(tenantId);
    if (!store || store.tenant.id !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant record not found or access denied.' },
        { status: 404 }
      );
    }

    // Collect all sources across notes
    const allSources: (NoteSource & { noteTitle?: string; noteId: string })[] = [];

    for (const note of store.notes) {
      for (const src of note.sources || []) {
        allSources.push({
          ...src,
          noteTitle: note.title,
          noteId: note.id,
        });
      }
    }

    // Apply optional filtering
    let filtered = allSources;
    if (statusFilter) {
      filtered = filtered.filter((s) => s.processingStatus === statusFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter((s) => s.sourceType === typeFilter);
    }

    const summary = {
      total: allSources.length,
      completed: allSources.filter((s) => s.processingStatus === 'completed').length,
      processing: allSources.filter((s) => s.processingStatus === 'processing').length,
      failed: allSources.filter((s) => s.processingStatus === 'failed').length,
      totalBytes: allSources.reduce((acc, s) => acc + (s.fileSizeBytes || 0), 0),
    };

    return NextResponse.json({
      success: true,
      tenantId,
      summary,
      sources: filtered,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to list source library' },
      { status: 500 }
    );
  }
}
