// ==============================================================================
// Brainnote SaaS — Scheduled Data Retention & Cleanup Engine
// POST /api/retention/cleanup
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTenantStoreAsync, saveNoteToStore } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || 'tenant-acme';
    const forcePurgeTrash = Boolean(body.forcePurgeTrash);

    const store = await getTenantStoreAsync(tenantId);
    const now = Date.now();

    let trashedCount = 0;
    let purgedCount = 0;
    let permanentCount = 0;

    const remainingNotes = [];

    for (const note of store.notes) {
      // 1. Permanent or Saved research is strictly protected
      const isPermanent = Boolean((note as any).isPermanent || (note as any).isSaved || note.isPinned);
      if (isPermanent) {
        permanentCount++;
        remainingNotes.push(note);
        continue;
      }

      // 2. Check Expiry
      const expiresAt = (note as any).expiresAt ? new Date((note as any).expiresAt).getTime() : now + 30 * 86400000;
      const isExpired = expiresAt < now;
      const isAlreadyTrashed = (note as any).status === 'trashed';
      const trashedAt = (note as any).trashedAt ? new Date((note as any).trashedAt).getTime() : now;

      if (isAlreadyTrashed) {
        // Recovery buffer: 30 days in trash before permanent purge
        const trashAgeDays = (now - trashedAt) / (1000 * 60 * 60 * 24);
        if (trashAgeDays >= 30 || forcePurgeTrash) {
          purgedCount++;
          // Excluded from remainingNotes => permanently deleted
          continue;
        } else {
          remainingNotes.push(note);
        }
      } else if (isExpired) {
        // Move to Trash buffer
        trashedCount++;
        remainingNotes.push({
          ...note,
          status: 'trashed',
          trashedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        remainingNotes.push(note);
      }
    }

    store.notes = remainingNotes as any;
    store.usage.notesCount = remainingNotes.length;

    return NextResponse.json({
      success: true,
      tenantId,
      metrics: {
        permanentCount,
        trashedCount,
        purgedCount,
        activeCount: remainingNotes.filter((n: any) => n.status !== 'trashed').length,
        trashCount: remainingNotes.filter((n: any) => n.status === 'trashed').length,
      },
      message: `Retention run completed: ${trashedCount} expired sessions moved to Trash, ${purgedCount} purged permanently, ${permanentCount} permanent records preserved.`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Retention cleanup error' },
      { status: 500 }
    );
  }
}

