// ==============================================================================
// Brainnote AI — Automated Tests for Source Grounding & Tenant Notebook Isolation
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { searchAndAnswerGrounded } from '../src/lib/ai-provider';
import { getTenantNotebooks, getTenantStore } from '../src/lib/server-store';
import { Note } from '../src/types';

describe('Selective Source Grounding & Retrieval Exclusion Tests', () => {
  const sampleNotes: Note[] = [
    {
      id: 'note-rag-1',
      tenantId: 'tenant-test-grounding',
      userId: 'user-tester',
      title: 'Machine Learning Evaluation Architecture',
      content: 'This document details automated scoring metrics and latency benchmarks for LLMs.',
      isPinned: false,
      isArchived: false,
      tags: [],
      sources: [
        {
          id: 'src-ml-eval',
          tenantId: 'tenant-test-grounding',
          noteId: 'note-rag-1',
          sourceType: 'web',
          title: 'Machine Learning Mastery: Custom LLM Eval',
          sourceUrl: 'https://machinelearningmastery.com/eval',
          rawTranscript: 'Evaluating custom models using F1, ROUGE and embedding similarity.',
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'src-youtube-keynote',
          tenantId: 'tenant-test-grounding',
          noteId: 'note-rag-1',
          sourceType: 'youtube',
          title: 'Stanford HAI: Autonomous AI Agents',
          sourceUrl: 'https://youtube.com/watch?v=sample123',
          rawTranscript: 'Autonomous agent architectures require strict tool use and calibration testing.',
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'src-unselected-finance',
          tenantId: 'tenant-test-grounding',
          noteId: 'note-rag-1',
          sourceType: 'pdf',
          title: 'Confidential Financial Audit 2026',
          sourceUrl: 'https://internal.vault/finance.pdf',
          rawTranscript: 'Quarterly financial earnings and confidential revenue figures.',
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
      ],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('includes citations from all sources when all source IDs are selected', async () => {
    const allIds = ['src-ml-eval', 'src-youtube-keynote', 'src-unselected-finance'];
    const result = await searchAndAnswerGrounded('How are models evaluated?', sampleNotes, allIds);

    expect(result.confidence).toBeGreaterThan(0);
    expect(result.citations.length).toBeGreaterThan(0);
    const citedSourceIds = result.citations.map((c) => c.sourceId);
    expect(citedSourceIds).toContain('src-ml-eval');
  });

  it('strictly excludes deselected sources from retrieval and citations on the backend', async () => {
    // User specifically DESELECTS 'src-unselected-finance'
    const selectedIds = ['src-ml-eval'];
    const result = await searchAndAnswerGrounded(
      'What are the quarterly financial earnings?', 
      sampleNotes, 
      selectedIds
    );

    // Citations must NEVER cite the deselected source
    const citedSourceIds = result.citations.map((c) => c.sourceId);
    expect(citedSourceIds).not.toContain('src-unselected-finance');
    
    // Check that every cited source belongs strictly to the selected set
    for (const cite of result.citations) {
      expect(selectedIds).toContain(cite.sourceId);
    }
  });

  it('returns a warning and zero citations if the user deselects ALL sources', async () => {
    const emptySelectedIds: string[] = [];
    const result = await searchAndAnswerGrounded('Any question', sampleNotes, emptySelectedIds);

    expect(result.citations).toHaveLength(0);
    expect(result.confidence).toBe(0);
    expect(result.answer).toContain('No sources are currently selected for grounding');
  });

  it('applies persona instruction prefixes to the grounded synthesis output', async () => {
    const selectedIds = ['src-ml-eval'];
    const teacherResult = await searchAndAnswerGrounded(
      'Explain evaluation metrics', 
      sampleNotes, 
      selectedIds, 
      'teacher'
    );
    expect(teacherResult.answer).toContain('step-by-step educational breakdown');

    const technicalResult = await searchAndAnswerGrounded(
      'Explain evaluation metrics', 
      sampleNotes, 
      selectedIds, 
      'technical'
    );
    expect(technicalResult.answer).toContain('Technical Architecture Analysis');
  });
});

describe('Tenant Notebook Isolation Tests', () => {
  it('guarantees tenant-acme only sees notebooks belonging to tenant-acme', () => {
    const acmeNotebooks = getTenantNotebooks('tenant-acme');
    expect(acmeNotebooks.length).toBeGreaterThan(0);

    for (const nb of acmeNotebooks) {
      expect(nb.tenantId).toBe('tenant-acme');
      for (const src of nb.sources) {
        expect(src.tenantId).toBe('tenant-acme');
      }
    }
  });

  it('guarantees an isolated tenant workspace cannot leak records to another tenant', () => {
    const betaStore = getTenantStore('tenant-beta');
    const acmeStore = getTenantStore('tenant-acme');

    // Notes in Acme must never appear in Beta store
    const acmeNoteIds = new Set(acmeStore.notes.map((n) => n.id));
    const betaNoteIds = betaStore.notes.map((n) => n.id);

    for (const id of betaNoteIds) {
      expect(acmeNoteIds.has(id)).toBe(false);
    }
  });
});
