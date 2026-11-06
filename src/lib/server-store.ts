// ==============================================================================
// Brainnote AI — Multi-Tenant Persistence Store & Adapter
// NOTE ON PERSISTENCE ARCHITECTURE:
// In production environments, PostgreSQL (defined in src/db/schema.sql and
// migrations/002_notebooks_and_conversations.sql) is the authoritative, 
// ACID-compliant datastore. This module provides the in-process state adapter
// for fast local development, deterministic test execution, and API compatibility.
// ==============================================================================

import { INITIAL_TENANTS, TenantDataset } from './mock-data';
import { Note, AIArtifact, Collaborator, Notebook } from '@/types';
import { isDatabaseConfigured } from './db/client';
import {
  fetchTenantStoreFromDb,
  saveNoteToDb,
  updateNoteArtifactInDb,
  deleteNoteFromDb,
  inviteCollaboratorInDb,
  removeCollaboratorFromDb,
} from './db/queries';

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

/**
 * Asynchronously retrieves tenant dataset from Supabase PostgreSQL if configured,
 * otherwise hydrates and returns the in-memory store.
 */
export async function getTenantStoreAsync(tenantId: string): Promise<TenantDataset> {
  if (isDatabaseConfigured()) {
    try {
      const dbDataset = await fetchTenantStoreFromDb(tenantId);
      if (dbDataset && dbDataset.tenant) {
        // Cache in memory for fast local response
        if (!global.__BRAINNOTE_STORE__) {
          global.__BRAINNOTE_STORE__ = {};
        }
        global.__BRAINNOTE_STORE__[tenantId] = dbDataset;
        return dbDataset;
      }
    } catch (err) {
      console.warn('[server-store] Failed to fetch from Supabase, falling back to in-memory:', err);
    }
  }

  return getTenantStore(tenantId);
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

  // Non-blocking background sync if DB is configured
  if (isDatabaseConfigured()) {
    saveNoteToDb(tenantId, note).catch((err) => {
      console.warn('[server-store] Background sync to Supabase failed:', err);
    });
  }

  return note;
}

export async function saveNoteToStoreAsync(tenantId: string, note: Note): Promise<Note> {
  const saved = saveNoteToStore(tenantId, note);
  if (isDatabaseConfigured()) {
    await saveNoteToDb(tenantId, note);
  }
  return saved;
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

  if (isDatabaseConfigured()) {
    updateNoteArtifactInDb(tenantId, noteId, artifact).catch((err) => {
      console.warn('[server-store] Background artifact sync to Supabase failed:', err);
    });
  }

  return true;
}

export async function updateNoteArtifactAsync(
  tenantId: string,
  noteId: string,
  artifact: AIArtifact
): Promise<boolean> {
  const success = updateNoteArtifact(tenantId, noteId, artifact);
  if (success && isDatabaseConfigured()) {
    await updateNoteArtifactInDb(tenantId, noteId, artifact);
  }
  return success;
}

export function deleteNoteFromStore(tenantId: string, noteId: string): boolean {
  const store = getTenantStore(tenantId);
  const prevLen = store.notes.length;
  store.notes = store.notes.filter((n) => n.id !== noteId);
  store.usage.notesCount = store.notes.length;

  if (isDatabaseConfigured()) {
    deleteNoteFromDb(tenantId, noteId).catch((err) => {
      console.warn('[server-store] Background delete sync to Supabase failed:', err);
    });
  }

  return store.notes.length < prevLen;
}

export async function deleteNoteFromStoreAsync(tenantId: string, noteId: string): Promise<boolean> {
  const removed = deleteNoteFromStore(tenantId, noteId);
  if (removed && isDatabaseConfigured()) {
    await deleteNoteFromDb(tenantId, noteId);
  }
  return removed;
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

  if (isDatabaseConfigured()) {
    inviteCollaboratorInDb(tenantId, cleanEmail, name, role).catch((err) => {
      console.warn('[server-store] Background collaborator invite sync failed:', err);
    });
  }

  return newCollab;
}

export async function inviteCollaboratorAsync(
  tenantId: string, 
  email: string, 
  name?: string, 
  role: 'editor' | 'viewer' = 'editor'
): Promise<Collaborator> {
  const collab = inviteCollaborator(tenantId, email, name, role);
  if (isDatabaseConfigured()) {
    const dbCollab = await inviteCollaboratorInDb(tenantId, email, name, role);
    if (dbCollab) return dbCollab;
  }
  return collab;
}

export function removeCollaborator(tenantId: string, collabId: string): boolean {
  const store = getTenantStore(tenantId);
  if (!store.collaborators) return false;
  const initial = store.collaborators.length;
  store.collaborators = store.collaborators.filter((c) => c.id !== collabId);

  if (isDatabaseConfigured()) {
    removeCollaboratorFromDb(tenantId, collabId).catch((err) => {
      console.warn('[server-store] Background collaborator removal sync failed:', err);
    });
  }

  return store.collaborators.length < initial;
}

export async function removeCollaboratorAsync(tenantId: string, collabId: string): Promise<boolean> {
  const removed = removeCollaborator(tenantId, collabId);
  if (removed && isDatabaseConfigured()) {
    await removeCollaboratorFromDb(tenantId, collabId);
  }
  return removed;
}

// ==============================================================================
// Backward-Compatible Notebook Domain Mapping
// Connects existing Notes into first-class NotebookLM-style Notebook entities
// ==============================================================================

export function getTenantNotebooks(tenantId: string): Notebook[] {
  const store = getTenantStore(tenantId);
  return store.notes.map((note) => ({
    id: note.id,
    tenantId: note.tenantId,
    userId: note.userId,
    title: note.title,
    description: note.content ? note.content.slice(0, 240) : '',
    sources: note.sources || [],
    selectedSourceIds: (note.sources || []).map((s) => s.id),
    conversation: [
      {
        id: `msg-init-${note.id}`,
        role: 'assistant',
        content: `I've analyzed your sources for **${note.title}**. Ask anything about this material or choose a study action from the Studio.`,
        timestamp: note.createdAt,
      },
    ],
    artifacts: note.aiArtifacts || [],
    savedNotes: [note],
    persona: 'default',
    isArchived: note.isArchived,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));
}

export function getNotebookById(tenantId: string, notebookId: string): Notebook | null {
  const notebooks = getTenantNotebooks(tenantId);
  return notebooks.find((nb) => nb.id === notebookId) || null;
}

export async function getTenantNotebooksAsync(tenantId: string): Promise<Notebook[]> {
  const store = await getTenantStoreAsync(tenantId);
  return store.notes.map((note) => ({
    id: note.id,
    tenantId: note.tenantId,
    userId: note.userId,
    title: note.title,
    description: note.content ? note.content.slice(0, 240) : '',
    sources: note.sources || [],
    selectedSourceIds: (note.sources || []).map((s) => s.id),
    conversation: [
      {
        id: `msg-init-${note.id}`,
        role: 'assistant',
        content: `I've analyzed your sources for **${note.title}**. Ask anything about this material or choose a study action from the Studio.`,
        timestamp: note.createdAt,
      },
    ],
    artifacts: note.aiArtifacts || [],
    savedNotes: [note],
    persona: 'default',
    isArchived: note.isArchived,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));
}

export async function getNotebookByIdAsync(tenantId: string, notebookId: string): Promise<Notebook | null> {
  const notebooks = await getTenantNotebooksAsync(tenantId);
  return notebooks.find((nb) => nb.id === notebookId) || null;
}


