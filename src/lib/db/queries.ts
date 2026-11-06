// ==============================================================================
// Brainnote AI — Supabase Database Query Layer
// Strictly Enforces Tenant Boundary Isolation (.eq('tenant_id', tenantId))
// ==============================================================================

import { getSupabaseAdminClient } from './client';
import { Note, NoteSource, AIArtifact, Collaborator, Notebook, TenantDataset } from '@/types';
import { toDeterministicUuid } from '@/lib/uuid-helper';

/**
 * Loads the complete tenant dataset from Supabase PostgreSQL.
 * Returns null if database is unconfigured or tenant is not found.
 */
export async function fetchTenantStoreFromDb(tenantId: string): Promise<TenantDataset | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    // 1. Fetch Tenant
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (tErr || !tenant) return null;

    // 2. Fetch Owner / User
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle();

    // 3. Fetch Subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // 4. Fetch Usage Record
    const { data: usage } = await supabase
      .from('usage_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('billing_period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 5. Fetch Notes with nested sources and artifacts
    const { data: notes } = await supabase
      .from('notes')
      .select(`
        *,
        sources:note_sources(*),
        ai_artifacts(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // 6. Fetch Collaborators
    const { data: collaborators } = await supabase
      .from('collaborators')
      .select('*')
      .eq('tenant_id', tenantId);

    const formattedNotes: Note[] = (notes || []).map((n) => ({
      id: n.id,
      tenantId: n.tenant_id,
      userId: n.user_id,
      folderId: n.folder_id,
      title: n.title,
      content: n.content,
      isPinned: n.is_pinned,
      isArchived: n.is_archived,
      tags: [],
      sources: (n.sources || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        tenantId: s.tenant_id as string,
        noteId: s.note_id as string,
        sourceType: s.source_type as NoteSource['sourceType'],
        title: s.title as string,
        sourceUrl: s.source_url as string | undefined,
        fileSizeBytes: (s.file_size_bytes as number) || 0,
        durationSeconds: (s.duration_seconds as number) || 0,
        rawTranscript: (s.raw_transcript as string) || '',
        processingStatus: (s.processing_status as NoteSource['processingStatus']) || 'completed',
        errorMessage: s.error_message as string | undefined,
        createdAt: s.created_at as string,
      })),
      aiArtifacts: (n.ai_artifacts || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        tenantId: a.tenant_id as string,
        noteId: a.note_id as string,
        userId: a.user_id as string,
        artifactType: a.artifact_type as AIArtifact['artifactType'],
        title: a.title as string,
        content: a.content as AIArtifact['content'],
        modelUsed: (a.model_used as string) || 'gemini-1.5-pro',
        tokensConsumed: (a.tokens_consumed as number) || 0,
        createdAt: a.created_at as string,
      })),
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        tier: tenant.tier,
        createdAt: tenant.created_at,
      },
      user: {
        id: user?.id || `user-${tenantId}`,
        tenantId,
        email: user?.email || `${tenant.slug}@brainnote.ai`,
        name: user?.name || 'Workspace Owner',
        role: user?.role || 'owner',
      },
      subscription: {
        id: subscription?.id || `sub-${tenantId}`,
        tenantId,
        planTier: subscription?.plan_tier || 'trial',
        status: subscription?.status || 'trialing',
        trialStart: subscription?.trial_start || new Date().toISOString(),
        trialEnd: subscription?.trial_end || new Date(Date.now() + 7 * 86400000).toISOString(),
        cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
        hasPaymentMethod: Boolean(subscription?.has_payment_method),
      },
      usage: {
        tenantId,
        aiTokensConsumed: Number(usage?.ai_tokens_consumed || 0),
        aiTokensLimit: Number(usage?.ai_tokens_limit || 50000),
        storageBytesConsumed: Number(usage?.storage_bytes_consumed || 0),
        storageBytesLimit: Number(usage?.storage_bytes_limit || 262144000),
        notesCount: Number(usage?.notes_count || formattedNotes.length),
        notesLimit: Number(usage?.notes_limit || 25),
        audioMinutesTranscribed: Number(usage?.audio_minutes_transcribed || 0),
        audioMinutesLimit: Number(usage?.audio_minutes_limit || 30),
      },
      folders: [],
      tags: [],
      notes: formattedNotes,
      collaborators: (collaborators || []).map((c) => ({
        id: c.id,
        tenantId: c.tenant_id,
        email: c.email,
        name: c.name,
        role: c.role,
        status: c.status,
        invitedAt: c.invited_at,
      })),
    };
  } catch (err) {
    console.warn('[Supabase Database Query Error] Falling back to in-memory store:', err);
    return null;
  }
}

/**
 * Persists a Note and its attached sources to Supabase PostgreSQL.
 */
export async function saveNoteToDb(tenantId: string, note: Note): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    // 1. Upsert Note record
    const { error: noteErr } = await supabase
      .from('notes')
      .upsert({
        id: note.id,
        tenant_id: tenantId,
        user_id: note.userId || '00000000-0000-0000-0000-000000000002',
        title: note.title,
        content: note.content,
        is_pinned: note.isPinned || false,
        is_archived: note.isArchived || false,
        updated_at: new Date().toISOString(),
      });

    if (noteErr) {
      console.warn('[Supabase Note Upsert Error]:', noteErr);
      return false;
    }

    // 2. Upsert Sources if present
    if (note.sources && note.sources.length > 0) {
      const sourcesPayload = note.sources.map((s) => ({
        id: s.id,
        tenant_id: tenantId,
        note_id: note.id,
        source_type: s.sourceType,
        title: s.title,
        source_url: s.sourceUrl,
        file_size_bytes: s.fileSizeBytes || 0,
        duration_seconds: s.durationSeconds || 0,
        raw_transcript: s.rawTranscript || '',
        processing_status: s.processingStatus || 'completed',
        error_message: s.errorMessage,
        created_at: s.createdAt || new Date().toISOString(),
      }));

      await supabase.from('note_sources').upsert(sourcesPayload);
    }

    // 3. Mirror into Notebooks table for 3-Panel workspace
    await supabase.from('notebooks').upsert({
      id: note.id,
      tenant_id: tenantId,
      user_id: note.userId || '00000000-0000-0000-0000-000000000002',
      title: note.title,
      description: note.content ? note.content.slice(0, 250) : '',
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch (err) {
    console.warn('[Supabase saveNoteToDb Exception]:', err);
    return false;
  }
}

/**
 * Persists an AI Artifact to Supabase PostgreSQL.
 */
export async function updateNoteArtifactInDb(
  tenantId: string,
  noteId: string,
  artifact: AIArtifact
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('ai_artifacts').upsert({
      id: artifact.id,
      tenant_id: tenantId,
      note_id: noteId,
      user_id: artifact.userId || '00000000-0000-0000-0000-000000000002',
      artifact_type: artifact.artifactType,
      title: artifact.title,
      content: artifact.content,
      model_used: artifact.modelUsed,
      tokens_consumed: artifact.tokensConsumed || 0,
      created_at: artifact.createdAt || new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Deletes a note and its cascaded children from Supabase PostgreSQL.
 */
export async function deleteNoteFromDb(tenantId: string, noteId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('tenant_id', tenantId);

    // Also remove mirrored notebook
    await supabase.from('notebooks').delete().eq('id', noteId).eq('tenant_id', tenantId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Invites a Collaborator in Supabase PostgreSQL.
 */
export async function inviteCollaboratorInDb(
  tenantId: string,
  email: string,
  name?: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<Collaborator | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const cleanEmail = email.trim().toLowerCase();
    const id = `collab-${Date.now()}`;
    const { data, error } = await supabase
      .from('collaborators')
      .upsert({
        id,
        tenant_id: tenantId,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        role,
        status: 'invited',
        invited_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      tenantId: data.tenant_id,
      email: data.email,
      name: data.name,
      role: data.role,
      status: data.status,
      invitedAt: data.invited_at,
    };
  } catch {
    return null;
  }
}

/**
 * Removes a Collaborator in Supabase PostgreSQL.
 */
export async function removeCollaboratorFromDb(tenantId: string, collabId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', collabId)
      .eq('tenant_id', tenantId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches all sources belonging to a tenant directly from Supabase PostgreSQL.
 */
export async function fetchSourcesFromDb(tenantId: string): Promise<NoteSource[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  try {
    const dbTenantId = toDeterministicUuid(tenantId);
    const { data, error } = await supabase
      .from('note_sources')
      .select('*')
      .eq('tenant_id', dbTenantId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((s) => ({
      id: s.id,
      tenantId: s.tenant_id,
      noteId: s.note_id,
      sourceType: s.source_type,
      title: s.title,
      sourceUrl: s.source_url,
      fileSizeBytes: s.file_size_bytes || 0,
      durationSeconds: s.duration_seconds || 0,
      rawTranscript: s.raw_transcript || '',
      processingStatus: s.processing_status,
      errorMessage: s.error_message,
      metadata: s.metadata,
      createdAt: s.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase fetchSourcesFromDb Exception]:', err);
    return [];
  }
}

/**
 * Checks if a duplicate source exists in Supabase PostgreSQL by URL or file name/size.
 */
export async function checkDuplicateSourceInDb(
  tenantId: string,
  url?: string,
  title?: string,
  fileSizeBytes?: number
): Promise<{ isDuplicate: boolean; existingSource?: NoteSource }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { isDuplicate: false };

  try {
    const dbTenantId = toDeterministicUuid(tenantId);

    if (url) {
      const { data } = await supabase
        .from('note_sources')
        .select('*')
        .eq('tenant_id', dbTenantId)
        .eq('source_url', url)
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          isDuplicate: true,
          existingSource: {
            id: data.id,
            tenantId: data.tenant_id,
            noteId: data.note_id,
            sourceType: data.source_type,
            title: data.title,
            sourceUrl: data.source_url,
            fileSizeBytes: data.file_size_bytes,
            durationSeconds: data.duration_seconds,
            rawTranscript: data.raw_transcript,
            processingStatus: data.processing_status,
            createdAt: data.created_at,
          },
        };
      }
    }

    if (title && fileSizeBytes) {
      const { data } = await supabase
        .from('note_sources')
        .select('*')
        .eq('tenant_id', dbTenantId)
        .eq('title', title)
        .eq('file_size_bytes', fileSizeBytes)
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          isDuplicate: true,
          existingSource: {
            id: data.id,
            tenantId: data.tenant_id,
            noteId: data.note_id,
            sourceType: data.source_type,
            title: data.title,
            sourceUrl: data.source_url,
            fileSizeBytes: data.file_size_bytes,
            durationSeconds: data.duration_seconds,
            rawTranscript: data.raw_transcript,
            processingStatus: data.processing_status,
            createdAt: data.created_at,
          },
        };
      }
    }

    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

/**
 * Updates a source's processing status and optional error message in Supabase.
 */
export async function updateSourceStatusInDb(
  tenantId: string,
  sourceId: string,
  status: NoteSource['processingStatus'],
  errorMessage?: string
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    const dbTenantId = toDeterministicUuid(tenantId);
    const dbSourceId = toDeterministicUuid(sourceId);

    const { error } = await supabase
      .from('note_sources')
      .update({
        processing_status: status,
        error_message: errorMessage || null,
      })
      .eq('id', dbSourceId)
      .eq('tenant_id', dbTenantId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Increments tenant usage records in Supabase PostgreSQL for cost controls.
 */
export async function recordUsageMetricsInDb(
  tenantId: string,
  delta: { aiTokens?: number; audioMinutes?: number; storageBytes?: number; notesDelta?: number }
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    const dbTenantId = toDeterministicUuid(tenantId);

    // Get current usage record
    const { data: usage } = await supabase
      .from('usage_records')
      .select('*')
      .eq('tenant_id', dbTenantId)
      .order('billing_period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!usage) return false;

    const { error } = await supabase
      .from('usage_records')
      .update({
        ai_tokens_consumed: (usage.ai_tokens_consumed || 0) + (delta.aiTokens || 0),
        audio_minutes_transcribed: (usage.audio_minutes_transcribed || 0) + (delta.audioMinutes || 0),
        storage_bytes_consumed: (usage.storage_bytes_consumed || 0) + (delta.storageBytes || 0),
        notes_count: (usage.notes_count || 0) + (delta.notesDelta || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', usage.id);

    return !error;
  } catch {
    return false;
  }
}

