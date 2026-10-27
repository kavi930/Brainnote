// ==============================================================================
// Brainnote AI — Notes CRUD & Synchronization API Endpoint
// GET /api/notes?tenantId=...
// POST /api/notes
// DELETE /api/notes
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantStore,
  saveNoteToStore,
  deleteNoteFromStore,
  clearDemoNotesFromStore,
} from '@/lib/server-store';
import { Note } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-acme';

    const store = getTenantStore(tenantId);
    return NextResponse.json({
      success: true,
      tenantId,
      notes: store.notes,
      totalCount: store.notes.length,
      usage: store.usage,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, note } = body;

    if (!tenantId || !note) {
      return NextResponse.json(
        { error: 'tenantId and note payload are required' },
        { status: 400 }
      );
    }

    const saved = saveNoteToStore(tenantId, note as Note);
    return NextResponse.json({
      success: true,
      note: saved,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to save note' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-acme';
    const noteId = searchParams.get('noteId');
    const action = searchParams.get('action');

    if (action === 'clear_demo') {
      clearDemoNotesFromStore(tenantId);
      const store = getTenantStore(tenantId);
      return NextResponse.json({
        success: true,
        message: 'Demo notes cleared. Showing only your personal data.',
        notes: store.notes,
      });
    }

    if (!noteId) {
      return NextResponse.json(
        { error: 'noteId or action=clear_demo required' },
        { status: 400 }
      );
    }

    const removed = deleteNoteFromStore(tenantId, noteId);
    return NextResponse.json({
      success: removed,
      deletedNoteId: noteId,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}
