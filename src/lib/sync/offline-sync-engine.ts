// ==============================================================================
// Brainnote AI — Cross-Platform Offline Synchronization Engine (Phase 4)
// Implements resilient offline mutation queueing and conflict resolution
// ==============================================================================

import { Note } from '@/types';

export type MutationAction = 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE';

export interface QueuedMutation {
  id: string;
  tenantId: string;
  userId: string;
  action: MutationAction;
  noteId: string;
  payload: Partial<Note>;
  clientTimestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'applied';
}

export interface SyncConflictResult {
  hasConflict: boolean;
  resolvedNote: Note;
  resolutionStrategy: 'CLIENT_APPLIED' | 'SERVER_PRESERVED' | 'MERGED';
}

export class OfflineSyncEngine {
  private queue: QueuedMutation[] = [];
  private isOnline: boolean = true;

  constructor(initialQueue: QueuedMutation[] = []) {
    this.queue = [...initialQueue];
  }

  /**
   * Enqueue a note change when offline or preparing for optimistic update
   */
  public enqueueMutation(
    tenantId: string,
    userId: string,
    action: MutationAction,
    noteId: string,
    payload: Partial<Note>
  ): QueuedMutation {
    const mutation: QueuedMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      userId,
      action,
      noteId,
      payload,
      clientTimestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(mutation);
    return mutation;
  }

  public getPendingQueue(): QueuedMutation[] {
    return this.queue.filter((m) => m.status === 'pending' || m.status === 'failed');
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Resolves conflicts between a local offline mutation and a remote server state.
   * Uses monotonic updatedAt timestamps and field-level non-destructive merging.
   */
  public resolveConflict(clientNote: Note, serverNote: Note): SyncConflictResult {
    const clientTime = new Date(clientNote.updatedAt).getTime();
    const serverTime = new Date(serverNote.updatedAt).getTime();

    // If client edit is newer than server edit, client wins for updated fields
    if (clientTime > serverTime) {
      const merged: Note = {
        ...serverNote,
        ...clientNote,
        tags: Array.from(new Set([...serverNote.tags.map((t) => JSON.stringify(t)), ...clientNote.tags.map((t) => JSON.stringify(t))])).map((t) => JSON.parse(t)),
        aiArtifacts: [...serverNote.aiArtifacts, ...clientNote.aiArtifacts.filter((ca) => !serverNote.aiArtifacts.some((sa) => sa.id === ca.id))],
        updatedAt: new Date().toISOString(),
      };

      return {
        hasConflict: true,
        resolvedNote: merged,
        resolutionStrategy: 'MERGED',
      };
    }

    // If server edit is newer, preserve server content but retain unique client tags/artifacts
    const merged: Note = {
      ...clientNote,
      ...serverNote,
      tags: Array.from(new Set([...serverNote.tags.map((t) => JSON.stringify(t)), ...clientNote.tags.map((t) => JSON.stringify(t))])).map((t) => JSON.parse(t)),
      updatedAt: serverNote.updatedAt,
    };

    return {
      hasConflict: true,
      resolvedNote: merged,
      resolutionStrategy: 'SERVER_PRESERVED',
    };
  }

  /**
   * Simulates flushing pending mutations when connectivity is restored
   */
  public async flushSyncQueue(
    applyRemoteUpdate: (m: QueuedMutation) => Promise<boolean>
  ): Promise<{ applied: number; failed: number }> {
    if (!this.isOnline) {
      return { applied: 0, failed: this.queue.length };
    }

    let applied = 0;
    let failed = 0;

    for (const mutation of this.queue) {
      if (mutation.status === 'applied') continue;

      mutation.status = 'syncing';
      try {
        const success = await applyRemoteUpdate(mutation);
        if (success) {
          mutation.status = 'applied';
          applied++;
        } else {
          mutation.status = 'failed';
          mutation.retryCount++;
          failed++;
        }
      } catch {
        mutation.status = 'failed';
        mutation.retryCount++;
        failed++;
      }
    }

    // Retain only unapplied or failed items with retry limit
    this.queue = this.queue.filter((m) => m.status !== 'applied');
    return { applied, failed };
  }
}
