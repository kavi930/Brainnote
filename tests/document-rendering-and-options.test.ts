// ==============================================================================
// Brainnote SaaS — Automated Tests: Document Rendering & Multi-Option Management
// ==============================================================================

import { describe, it, expect } from 'vitest';
import {
  generateSummary,
  generateStructuredNotes,
  generateConceptMap,
  generateMindMap,
  generateTimeline,
  generateGlossary,
  generateAudioOverview,
  generateMeetingMinutes
} from '../src/lib/ai-provider';
import { updateNoteArtifact, deleteNoteArtifact, getTenantStore, saveNoteToStore } from '../src/lib/server-store';
import { AIArtifact, Note } from '../src/types';

describe('Document Generation & Multi-Option Pipelines', () => {
  const sampleTitle = 'Distributed Vector Search & Retrieval Architecture (2026)';
  const sampleContent = `Modern retrieval systems combine dense semantic embeddings with sparse BM25 token indices.
Hybrid search achieves 94% precision on technical documentation queries.
Tenant isolation is enforced via cryptographic tenant_id partition filters in pgvector.`;

  it('generates structured notes with formatted sections and key points', async () => {
    const res = await generateStructuredNotes(sampleTitle, sampleContent);
    expect(res.result).toBeDefined();
    expect(res.result.summaryText).toBeDefined();
    expect(res.result.formattedMarkdown).toBeDefined();
    // Must contain formatted text without markdown syntax errors
    expect(res.result.formattedMarkdown).toContain('Distributed Vector Search');
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it('generates concept map and mind map structures', async () => {
    const conceptRes = await generateConceptMap(sampleTitle, sampleContent);
    expect(conceptRes.result.conceptMap).toBeDefined();
    expect(conceptRes.result.conceptMap.nodes.length).toBeGreaterThan(0);
    expect(conceptRes.result.conceptMap.relationships.length).toBeGreaterThan(0);

    const mindRes = await generateMindMap(sampleTitle, sampleContent);
    expect(mindRes.result.mindMap).toBeDefined();
    expect(mindRes.result.mindMap.rootTopic).toBeDefined();
    expect(mindRes.result.mindMap.branches.length).toBeGreaterThan(0);
  });

  it('generates chronological timeline events and domain glossary', async () => {
    const timelineRes = await generateTimeline(sampleTitle, sampleContent);
    expect(timelineRes.result.timeline).toBeDefined();
    expect(timelineRes.result.timeline.milestones.length).toBeGreaterThan(0);

    const glossaryRes = await generateGlossary(sampleTitle, sampleContent);
    expect(glossaryRes.result.studyGuide).toBeDefined();
    expect(glossaryRes.result.studyGuide.glossary.length).toBeGreaterThan(0);
    expect(glossaryRes.result.studyGuide.glossary[0]).toHaveProperty('term');
    expect(glossaryRes.result.studyGuide.glossary[0]).toHaveProperty('definition');
  });

  it('generates audio overview conversational narrative', async () => {
    const audioRes = await generateAudioOverview(sampleTitle, sampleContent);
    expect(audioRes.result.formattedMarkdown).toBeDefined();
    expect(audioRes.result.summaryText).toBeDefined();
    expect(audioRes.result.formattedMarkdown).toContain('Audio Overview');
    expect(audioRes.tokensUsed).toBeGreaterThan(0);
  });

  it('preserves multiple options of same or different types without dropping previous artifacts', () => {
    const tenantId = 'tenant-acme';
    const noteId = 'test-multi-option-note';

    // Seed test note
    const testNote: Note = {
      id: noteId,
      tenantId,
      userId: 'user-1',
      title: 'Multi Option Test Notebook',
      content: 'Sample test content',
      isPinned: false,
      isArchived: false,
      tags: [],
      sources: [],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveNoteToStore(tenantId, testNote);

    const artifactOption1: AIArtifact = {
      id: 'art-opt-1',
      tenantId,
      noteId,
      userId: 'user-1',
      artifactType: 'summary',
      title: 'Option 1: Executive Summary',
      content: { summaryText: 'Executive summary content' },
      modelUsed: 'claude-3-5-sonnet',
      tokensConsumed: 450,
      createdAt: new Date().toISOString(),
    };

    const artifactOption2: AIArtifact = {
      id: 'art-opt-2',
      tenantId,
      noteId,
      userId: 'user-1',
      artifactType: 'structured_notes',
      title: 'Option 2: Structured Notes',
      content: { summaryText: 'Structured notes content' },
      modelUsed: 'claude-3-5-sonnet',
      tokensConsumed: 550,
      createdAt: new Date().toISOString(),
    };

    const artifactOption3: AIArtifact = {
      id: 'art-opt-3',
      tenantId,
      noteId,
      userId: 'user-1',
      artifactType: 'key_takeaways',
      title: 'Option 3: Key Takeaways',
      content: { summaryText: 'Key takeaways content' },
      modelUsed: 'claude-3-5-sonnet',
      tokensConsumed: 320,
      createdAt: new Date().toISOString(),
    };

    // Update all 3 options
    updateNoteArtifact(tenantId, noteId, artifactOption1);
    updateNoteArtifact(tenantId, noteId, artifactOption2);
    updateNoteArtifact(tenantId, noteId, artifactOption3);

    const store = getTenantStore(tenantId);
    const updatedNote = store.notes.find((n) => n.id === noteId);
    expect(updatedNote).toBeDefined();
    const artifactIds = (updatedNote?.aiArtifacts || []).map((a) => a.id);
    expect(artifactIds).toContain('art-opt-1');
    expect(artifactIds).toContain('art-opt-2');
    expect(artifactIds).toContain('art-opt-3');
  });

  it('confirms the test source, notebook, and all associated artifacts are permanently deleted', () => {
    const store = getTenantStore('tenant-acme');
    
    // 1. Verify test note / notebook is permanently removed
    const videoNote = store.notes.find((n) => n.id === 'note-user-ai-video-tools' || n.title.includes('Top 5 Free AI Video Generator'));
    expect(videoNote).toBeUndefined();

    // 2. Verify test source is permanently removed across all notes
    const allSources = store.notes.flatMap((n) => n.sources || []);
    const videoSource = allSources.find((s) => s.id === 'src-yt-video-1' || s.title.includes('Top 5 Free AI Video Generator'));
    expect(videoSource).toBeUndefined();

    // 3. Verify all associated artifacts are completely removed
    const allArtifacts = store.notes.flatMap((n) => n.aiArtifacts || []);
    const videoArtifacts = allArtifacts.filter(
      (a) => a.id.startsWith('art-yt-') || a.title.includes('Free AI Video Generators') || a.title.includes('AI Video Tools')
    );
    expect(videoArtifacts).toHaveLength(0);

    // 4. Verify Custom LLM Evaluation Harness notebook and sources remain intact and untouched
    const evalNote = store.notes.find((n) => n.id === 'note-custom-llm-eval-harness');
    expect(evalNote).toBeDefined();
    expect(evalNote?.title).toContain('Building a Custom LLM Evaluation Harness in Python from Scratch');
    expect(evalNote?.sources).toHaveLength(1);
    expect(evalNote?.sources[0].id).toBe('src-mlm-eval-1');
    expect(evalNote?.aiArtifacts?.length).toBeGreaterThanOrEqual(3);
  });

  it('deletes a specific artifact via deleteNoteArtifact without touching other artifacts', () => {
    const tenantId = 'tenant-acme';
    const noteId = 'test-multi-option-note';

    const deleted = deleteNoteArtifact(tenantId, noteId, 'art-opt-2');
    expect(deleted).toBe(true);

    const store = getTenantStore(tenantId);
    const note = store.notes.find((n) => n.id === noteId);
    const remainingIds = (note?.aiArtifacts || []).map((a) => a.id);
    expect(remainingIds).not.toContain('art-opt-2');
    expect(remainingIds).toContain('art-opt-1');
    expect(remainingIds).toContain('art-opt-3');
  });

  it('guarantees search across all notebooks never returns deleted video generator records', () => {
    const store = getTenantStore('tenant-acme');
    const query = 'Top 5 Free AI Video Generator Tools'.toLowerCase();

    // Search across all artifacts
    const allArtifacts: AIArtifact[] = store.notes.flatMap((n) => n.aiArtifacts || []);
    const matchingArtifacts = allArtifacts.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.content?.summaryText?.toLowerCase().includes(query)
    );
    expect(matchingArtifacts).toHaveLength(0);

    // Search across all sources
    const allSources = store.notes.flatMap((n) => n.sources || []);
    const matchingSources = allSources.filter(
      (s) => s.title.toLowerCase().includes(query) || (s.sourceUrl && s.sourceUrl.toLowerCase().includes('ai-video-generators-free'))
    );
    expect(matchingSources).toHaveLength(0);

    // Search across all notebooks
    const matchingNotes = store.notes.filter((n) => n.title.toLowerCase().includes(query));
    expect(matchingNotes).toHaveLength(0);

    // Verify search for active LLM Evaluation documents succeeds
    const evalQuery = 'Evaluation Harness'.toLowerCase();
    const evalMatches = allArtifacts.filter((a) => a.title.toLowerCase().includes(evalQuery));
    expect(evalMatches.length).toBeGreaterThanOrEqual(1);

    const evalSourceMatches = allSources.filter((s) => s.title.toLowerCase().includes('evaluation harness'));
    expect(evalSourceMatches.length).toBeGreaterThanOrEqual(1);
  });
});
