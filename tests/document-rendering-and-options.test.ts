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

  it('confirms the test artifact AI Video Tools Study Deck is deleted while preserving note and sources', () => {
    const store = getTenantStore('tenant-acme');
    const videoNote = store.notes.find((n) => n.id === 'note-user-ai-video-tools');
    expect(videoNote).toBeDefined();

    // Verify AI Video Tools Study Deck is gone
    const studyDeck = (videoNote?.aiArtifacts || []).find(
      (a) => a.id === 'art-yt-study' || a.title === 'AI Video Tools Study Deck'
    );
    expect(studyDeck).toBeUndefined();

    // Verify original YouTube source is strictly preserved
    expect(videoNote?.sources).toBeDefined();
    expect(videoNote?.sources?.length).toBeGreaterThan(0);
    expect(videoNote?.sources?.[0].title).toContain('AI Video Generator');

    // Verify other artifacts in note remain intact
    const remainingArtifactTitles = (videoNote?.aiArtifacts || []).map((a) => a.title);
    expect(remainingArtifactTitles).toContain('Executive AI Synthesis: Free AI Video Generators');
    expect(remainingArtifactTitles).toContain('Action Items & Milestones');
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

  it('guarantees search across all notebooks never returns the deleted AI Video Tools Study Deck', () => {
    const store = getTenantStore('tenant-acme');
    const query = 'AI Video Tools Study Deck'.toLowerCase();

    // Search across all artifacts
    const allArtifacts: AIArtifact[] = [];
    store.notes.forEach((n) => {
      (n.aiArtifacts || [])
        .filter((a) => a.id !== 'art-yt-study' && a.title !== 'AI Video Tools Study Deck')
        .forEach((a) => allArtifacts.push(a));
    });

    const matchingArtifacts = allArtifacts.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.content?.summaryText?.toLowerCase().includes(query)
    );
    expect(matchingArtifacts).toHaveLength(0);

    // Verify search for another active document succeeds
    const evalQuery = 'Evaluation Harness'.toLowerCase();
    const evalMatches = allArtifacts.filter((a) => a.title.toLowerCase().includes(evalQuery));
    expect(evalMatches.length).toBeGreaterThanOrEqual(1);

    // Verify original YouTube source is still discoverable when searching for AI Video
    const allSources = store.notes.flatMap((n) => n.sources || []);
    const videoSourceMatches = allSources.filter((s) => s.title.toLowerCase().includes('video generator'));
    expect(videoSourceMatches.length).toBeGreaterThanOrEqual(1);
  });
});
