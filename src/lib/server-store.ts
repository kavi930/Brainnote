// ==============================================================================
// Brainnote AI — Shared Multi-Tenant Persistence Store
// Connects Extension captures, REST APIs, and Web Workspace into a unified store
// ==============================================================================

import { INITIAL_TENANTS, TenantDataset } from './mock-data';
import { Note, AIArtifact, Collaborator } from '@/types';

// Global server store in memory (persists across API requests in Node.js runtime)
declare global {
  // eslint-disable-next-line no-var
  var __BRAINNOTE_STORE__: Record<string, TenantDataset>;
}

if (!global.__BRAINNOTE_STORE__) {
  global.__BRAINNOTE_STORE__ = JSON.parse(JSON.stringify(INITIAL_TENANTS));
} else {
  // Clean lingering demo notes from in-memory cache
  if (global.__BRAINNOTE_STORE__['tenant-acme']) {
    global.__BRAINNOTE_STORE__['tenant-acme'].notes = global.__BRAINNOTE_STORE__['tenant-acme'].notes.filter(
      (n) => !n.id.startsWith('note-acme-')
    );
    if (global.__BRAINNOTE_STORE__['tenant-acme'].notes.length === 0) {
      global.__BRAINNOTE_STORE__['tenant-acme'].notes = JSON.parse(JSON.stringify(INITIAL_TENANTS['tenant-acme'].notes));
    }
    global.__BRAINNOTE_STORE__['tenant-acme'].usage.notesCount = global.__BRAINNOTE_STORE__['tenant-acme'].notes.length;
  }
}

export function getTenantStore(tenantId: string): TenantDataset {
  if (!global.__BRAINNOTE_STORE__) {
    global.__BRAINNOTE_STORE__ = JSON.parse(JSON.stringify(INITIAL_TENANTS));
  }

  // Ensure all initial notes (such as note-custom-llm-eval-harness) exist and stay enriched
  if (global.__BRAINNOTE_STORE__[tenantId]) {
    const initialNotes = INITIAL_TENANTS[tenantId]?.notes || [];
    for (const initN of initialNotes) {
      const existing = global.__BRAINNOTE_STORE__[tenantId].notes.find((n) => n.id === initN.id);
      if (!existing) {
        global.__BRAINNOTE_STORE__[tenantId].notes.push(JSON.parse(JSON.stringify(initN)));
      } else if (!existing.aiArtifacts || existing.aiArtifacts.length < (initN.aiArtifacts?.length || 0)) {
        existing.aiArtifacts = JSON.parse(JSON.stringify(initN.aiArtifacts || []));
      }
    }
    global.__BRAINNOTE_STORE__[tenantId].usage.notesCount = global.__BRAINNOTE_STORE__[tenantId].notes.length;
  }

  if (!global.__BRAINNOTE_STORE__[tenantId]) {
    // Auto-create workspace for any new tenant
    global.__BRAINNOTE_STORE__[tenantId] = {
      tenant: {
        id: tenantId,
        name: 'My Knowledge Workspace',
        slug: tenantId,
        tier: 'trial',
        createdAt: new Date().toISOString(),
      },
      user: {
        id: `user-${tenantId}`,
        tenantId,
        email: `${tenantId}@brainnote.ai`,
        name: 'Workspace Owner',
        role: 'owner',
      },
      subscription: {
        id: `sub-${tenantId}`,
        tenantId,
        planTier: 'trial',
        status: 'trialing',
        trialStart: new Date().toISOString(),
        trialEnd: new Date(Date.now() + 7 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        hasPaymentMethod: true,
        paymentMethodDetails: {
          brand: 'Visa',
          last4: '4242',
        },
      },
      usage: {
        tenantId,
        aiTokensConsumed: 0,
        aiTokensLimit: 50000,
        storageBytesConsumed: 0,
        storageBytesLimit: 250 * 1024 * 1024,
        notesCount: 0,
        notesLimit: 25,
        audioMinutesTranscribed: 0,
        audioMinutesLimit: 30,
      },
      folders: [],
      tags: [],
      notes: [],
    };
  }

  return global.__BRAINNOTE_STORE__[tenantId];
}

export function getAllDatasets(): Record<string, TenantDataset> {
  if (!global.__BRAINNOTE_STORE__) {
    global.__BRAINNOTE_STORE__ = JSON.parse(JSON.stringify(INITIAL_TENANTS));
  }
  return global.__BRAINNOTE_STORE__;
}

export function saveNoteToStore(tenantId: string, note: Note): Note {
  const store = getTenantStore(tenantId);
  const existingIdx = store.notes.findIndex((n) => n.id === note.id);

  if (existingIdx >= 0) {
    store.notes[existingIdx] = {
      ...store.notes[existingIdx],
      ...note,
      updatedAt: new Date().toISOString(),
    };
  } else {
    store.notes.unshift(note);
    store.usage.notesCount = store.notes.length;
  }

  return note;
}

export function updateNoteArtifact(
  tenantId: string,
  noteId: string,
  artifact: AIArtifact
): boolean {
  const store = getTenantStore(tenantId);
  const note = store.notes.find((n) => n.id === noteId);
  if (!note) return false;

  note.aiArtifacts = [
    artifact,
    ...(note.aiArtifacts || []).filter((a) => a.artifactType !== artifact.artifactType),
  ];
  note.updatedAt = new Date().toISOString();
  return true;
}

export function deleteNoteFromStore(tenantId: string, noteId: string): boolean {
  const store = getTenantStore(tenantId);
  const prevLen = store.notes.length;
  store.notes = store.notes.filter((n) => n.id !== noteId);
  store.usage.notesCount = store.notes.length;
  return store.notes.length < prevLen;
}

export function clearDemoNotesFromStore(tenantId: string): void {
  const store = getTenantStore(tenantId);
  // Keep only user-created notes (filter out demo seeds)
  store.notes = store.notes.filter((n) => !n.id.startsWith('note-acme-'));
  if (store.notes.length === 0) {
    store.notes = JSON.parse(JSON.stringify(INITIAL_TENANTS['tenant-acme'].notes));
  }
  store.usage.notesCount = store.notes.length;
}

export function getCollaborators(tenantId: string): Collaborator[] {
  const store = getTenantStore(tenantId);
  if (!store.collaborators || store.collaborators.length === 0) {
    const initial = INITIAL_TENANTS[tenantId]?.collaborators;
    store.collaborators = initial && initial.length > 0 
      ? JSON.parse(JSON.stringify(initial))
      : [
          {
            id: `collab-owner-${tenantId}`,
            tenantId,
            email: store.user.email,
            name: `${store.user.name} (Owner)`,
            role: 'editor',
            status: 'active',
            invitedAt: store.tenant.createdAt || new Date().toISOString(),
          },
        ];
  }
  return store.collaborators || [];
}

export function inviteCollaborator(
  tenantId: string, 
  email: string, 
  name?: string, 
  role: 'editor' | 'viewer' = 'editor'
): Collaborator {
  const store = getTenantStore(tenantId);
  if (!store.collaborators) {
    store.collaborators = [];
  }
  const cleanEmail = email.trim().toLowerCase();
  const existing = store.collaborators.find((c) => c.email.toLowerCase() === cleanEmail);
  if (existing) {
    existing.role = role;
    return existing;
  }
  const newCollab: Collaborator = {
    id: `collab-${Date.now()}`,
    tenantId,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0],
    role,
    status: 'invited',
    invitedAt: new Date().toISOString(),
  };
  store.collaborators.push(newCollab);
  return newCollab;
}

export function removeCollaborator(tenantId: string, collabId: string): boolean {
  const store = getTenantStore(tenantId);
  if (!store.collaborators) return false;
  const initial = store.collaborators.length;
  store.collaborators = store.collaborators.filter((c) => c.id !== collabId);
  return store.collaborators.length < initial;
}
