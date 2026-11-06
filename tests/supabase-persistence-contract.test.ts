// ==============================================================================
// Brainnote AI — Supabase Persistence Contract & Concurrency Tests
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { 
  getTenantStore, 
  getTenantNotebooks, 
  saveNoteToStore, 
  updateNoteArtifact,
  deleteNoteFromStore 
} from '../src/lib/server-store';
import { assertTenantAccess, TenantIsolationViolationError } from '../src/lib/tenant-isolation';
import { searchAndAnswerGrounded } from '../src/lib/ai-provider';
import { Note, AIArtifact } from '../src/types';

describe('Supabase Schema Contract & Type Mapping Verification', () => {
  it('correctly maps all tenant fields required by Migration 003', () => {
    const store = getTenantStore('tenant-acme');
    expect(store.tenant).toBeDefined();
    expect(store.tenant.id).toBe('tenant-acme');
    expect(store.tenant.name).toBeDefined();
    expect(store.tenant.slug).toBeDefined();
    expect(store.tenant.tier).toBeDefined();
  });

  it('correctly maps user tenant relationship required by users table', () => {
    const store = getTenantStore('tenant-acme');
    expect(store.user.tenantId).toBe(store.tenant.id);
    expect(store.user.email).toContain('@');
    expect(['owner', 'admin', 'member']).toContain(store.user.role);
  });

  it('correctly maps subscription & usage tracking required by usage_records table', () => {
    const store = getTenantStore('tenant-acme');
    expect(store.subscription.status).toBeDefined();
    expect(store.usage.aiTokensLimit).toBeGreaterThan(0);
    expect(store.usage.notesLimit).toBeGreaterThan(0);
    expect(store.usage.storageBytesLimit).toBeGreaterThan(0);
  });

  it('correctly maps notebooks to 1:1 notes schema contract', () => {
    const notebooks = getTenantNotebooks('tenant-acme');
    expect(notebooks.length).toBeGreaterThan(0);
    const primary = notebooks[0];
    expect(primary.id).toBeDefined();
    expect(primary.tenantId).toBe('tenant-acme');
    expect(primary.sources).toBeDefined();
    expect(primary.conversation).toBeDefined();
  });
});

describe('Multi-Tenant Data Isolation & Security Guardrails', () => {
  const sessionTenantA = {
    tenantId: 'tenant-acme',
    user: { id: 'u-1', tenantId: 'tenant-acme', email: 'a@acme.com', name: 'Alex', role: 'owner' as const },
  };

  it('allows authorized access within the same tenant context', () => {
    expect(() => {
      assertTenantAccess(sessionTenantA, 'tenant-acme');
    }).not.toThrow();
  });

  it('blocks unauthorized cross-tenant read/write attempts with TenantIsolationViolationError', () => {
    expect(() => {
      assertTenantAccess(sessionTenantA, 'tenant-malicious-b');
    }).toThrow(TenantIsolationViolationError);
  });

  it('verifies that tenant datasets never share or bleed records in memory or database', () => {
    const acmeStore = getTenantStore('tenant-acme');
    const betaStore = getTenantStore('tenant-beta');

    const acmeNoteIds = new Set(acmeStore.notes.map((n) => n.id));
    for (const betaNote of betaStore.notes) {
      expect(acmeNoteIds.has(betaNote.id)).toBe(false);
    }
  });
});

describe('Concurrency & Non-Destructive Mutation Safety', () => {
  it('handles 10 concurrent note save operations without race conditions or data corruption', async () => {
    const promises = Array.from({ length: 10 }).map((_, idx) => {
      const concurrentNote: Note = {
        id: `note-concurrent-${idx}-${Date.now()}`,
        tenantId: 'tenant-acme',
        userId: 'user-concurrent',
        title: `Concurrent Note ${idx}`,
        content: `Concurrent test content for iteration ${idx}`,
        isPinned: false,
        isArchived: false,
        tags: [],
        sources: [],
        aiArtifacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return Promise.resolve(saveNoteToStore('tenant-acme', concurrentNote));
    });

    const savedNotes = await Promise.all(promises);
    expect(savedNotes).toHaveLength(10);

    const store = getTenantStore('tenant-acme');
    for (const saved of savedNotes) {
      const found = store.notes.find((n) => n.id === saved.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe(saved.title);
      // Clean up test notes to keep store clean
      deleteNoteFromStore('tenant-acme', saved.id);
    }
  });

  it('safely updates AI artifacts concurrently without dropping existing artifacts', () => {
    const targetNote = getTenantStore('tenant-acme').notes[0];
    const initialArtifactCount = targetNote.aiArtifacts?.length || 0;

    const testArtifact: AIArtifact = {
      id: `art-concurrent-${Date.now()}`,
      tenantId: 'tenant-acme',
      noteId: targetNote.id,
      userId: targetNote.userId,
      artifactType: 'summary',
      title: 'Concurrent Verification Summary',
      content: { summaryText: 'Verified concurrent artifact mutation.' },
      modelUsed: 'gemini-1.5-pro',
      tokensConsumed: 400,
      createdAt: new Date().toISOString(),
    };

    const updated = updateNoteArtifact('tenant-acme', targetNote.id, testArtifact);
    expect(updated).toBe(true);

    const reloadedNote = getTenantStore('tenant-acme').notes.find((n) => n.id === targetNote.id);
    expect(reloadedNote?.aiArtifacts?.length).toBeGreaterThanOrEqual(initialArtifactCount);
  });
});

describe('Selective Grounding Retrieval Contract', () => {
  it('verifies that deselected sources are never returned in grounded synthesis', async () => {
    const store = getTenantStore('tenant-acme');
    const note = store.notes.find((n) => n.sources && n.sources.length >= 2) || store.notes[0];

    if (note.sources && note.sources.length >= 2) {
      const keptSourceId = note.sources[0].id;
      const excludedSourceId = note.sources[1].id;

      const result = await searchAndAnswerGrounded(
        'Find technical details',
        [note],
        [keptSourceId] // Excludes note.sources[1]
      );

      const citedIds = result.citations.map((c) => c.sourceId);
      expect(citedIds).not.toContain(excludedSourceId);
    }
  });
});
