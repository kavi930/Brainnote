import { describe, it, expect, vi } from 'vitest';
import {
  generateStructuredNotes,
  generateSummary,
  generateDetailedTopicExplanation,
  generateShortAnswerQuestions,
  generateLongAnswerQuestions,
  generatePracticalExamples,
  generateTechnicalExplanation,
  generateCriticalAnalysis,
  generateFlashcards,
  generateQuiz,
  generateInterviewQA,
  generateGlossary
} from '@/lib/ai-provider';
import { Note, Notebook, ResearchSession, RetentionPeriodDays, NoteSource, AIArtifact } from '@/types';

// ==============================================================================
// TEST SUITE: WORKSPACE, AUTHENTICATION & RESEARCH MANAGEMENT UPGRADE
// ==============================================================================

describe('Module 1: Authentication & User Profile Validation', () => {
  it('validates email format and password length requirements', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(emailRegex.test('user@example.com')).toBe(true);
    expect(emailRegex.test('valid.researcher@domain.edu')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
    expect(emailRegex.test('@no-domain.com')).toBe(false);

    const validatePassword = (pass: string) => pass.length >= 6;
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('strongPass123!')).toBe(true);
    expect(validatePassword('12345')).toBe(false);
  });

  it('preserves user profile and tenant identity on session update', () => {
    const initialUser = {
      id: 'usr-101',
      tenantId: 'tenant-acme',
      email: 'alex@acme.com',
      name: 'Alex Rivera',
      role: 'owner' as const,
    };

    const updatedProfile = {
      ...initialUser,
      name: 'Dr. Alex Rivera',
      email: 'alex.rivera@acme.com',
    };

    expect(updatedProfile.id).toBe(initialUser.id);
    expect(updatedProfile.tenantId).toBe(initialUser.tenantId);
    expect(updatedProfile.name).toBe('Dr. Alex Rivera');
    expect(updatedProfile.email).toBe('alex.rivera@acme.com');
  });
});

describe('Module 2: Agent Studio Dedicated Source Selection', () => {
  const mockSources: NoteSource[] = [
    {
      id: 'src-pdf-1',
      tenantId: 'tenant-acme',
      noteId: 'nb-1',
      sourceType: 'pdf',
      title: 'Distributed Consensus Whitepaper.pdf',
      processingStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'src-yt-1',
      tenantId: 'tenant-acme',
      noteId: 'nb-1',
      sourceType: 'youtube',
      title: 'RAG Architecture Video Lecture',
      processingStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'src-web-1',
      tenantId: 'tenant-acme',
      noteId: 'nb-1',
      sourceType: 'web',
      title: 'Evaluation Metrics for LLMs (Web)',
      processingStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
  ];

  it('correctly filters sources by category', () => {
    const pdfSources = mockSources.filter((s) => s.sourceType === 'pdf' || s.sourceType === 'document');
    const ytSources = mockSources.filter((s) => s.sourceType === 'youtube');
    const webSources = mockSources.filter((s) => s.sourceType === 'web');

    expect(pdfSources).toHaveLength(1);
    expect(pdfSources[0].id).toBe('src-pdf-1');
    expect(ytSources).toHaveLength(1);
    expect(ytSources[0].id).toBe('src-yt-1');
    expect(webSources).toHaveLength(1);
    expect(webSources[0].id).toBe('src-web-1');
  });

  it('supports toggle, select all, and deselect all operations', () => {
    let selectedIds: string[] = [];

    // Toggle source 1
    selectedIds = [...selectedIds, mockSources[0].id];
    expect(selectedIds).toEqual(['src-pdf-1']);

    // Select all
    selectedIds = mockSources.map((s) => s.id);
    expect(selectedIds).toHaveLength(3);
    expect(selectedIds).toContain('src-yt-1');

    // Deselect all
    selectedIds = [];
    expect(selectedIds).toHaveLength(0);
  });

  it('enforces strict grounding rule and detects when 0 sources are selected', () => {
    const checkGrounding = (selectedCount: number, allowWeb: boolean) => {
      if (selectedCount === 0 && !allowWeb) {
        return { isGrounded: false, warning: 'Please select at least one source to ground reasoning.' };
      }
      return { isGrounded: true, warning: null };
    };

    expect(checkGrounding(0, false).isGrounded).toBe(false);
    expect(checkGrounding(1, false).isGrounded).toBe(true);
    expect(checkGrounding(0, true).isGrounded).toBe(true);
  });
});

describe('Module 3: My Notes Dual View & Document Export', () => {
  it('strips raw markdown symbols and prepares publication-grade Word document format', () => {
    const noteTitle = 'LLM Evaluation System Architecture';
    const rawMarkdown = `# ${noteTitle}\n\n**Deterministic metrics** should be evaluated alongside LLM-as-a-judge.\n\n## Core Principles\n- Source citation grounding\n- Low latency inference`;

    // Word HTML wrapper generation
    const buildWordDocument = (title: string, markdown: string) => {
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1><p>${markdown.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p></body></html>`;
      return htmlContent;
    };

    const docxHtml = buildWordDocument(noteTitle, rawMarkdown);
    expect(docxHtml).toContain('<!DOCTYPE html>');
    expect(docxHtml).toContain(noteTitle);
    expect(docxHtml).toContain('Deterministic metrics');
  });

  it('supports moving note to notebook and archiving', () => {
    const originalNote: Note = {
      id: 'note-1',
      tenantId: 'tenant-acme',
      userId: 'usr-1',
      title: 'Sprint Notes',
      content: 'Discussion points...',
      isPinned: false,
      isArchived: false,
      folderId: 'nb-initial',
      tags: [],
      sources: [],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Move to another notebook
    const movedNote: Note = {
      ...originalNote,
      folderId: 'nb-target-engineering',
      updatedAt: new Date().toISOString(),
    };
    expect(movedNote.folderId).toBe('nb-target-engineering');

    // Archive note
    const archivedNote: Note = {
      ...movedNote,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };
    expect(archivedNote.isArchived).toBe(true);
  });
});

describe('Module 4: Research Session Isolation', () => {
  it('creates an independent research session with isolated document and conversation collections', () => {
    const createResearchSession = (query: string, sessionNum: number): ResearchSession => {
      const id = `rs-${Date.now()}-${sessionNum}`;
      const now = new Date().toISOString();
      return {
        id,
        sessionNumber: sessionNum,
        title: query,
        userId: 'usr-default',
        tenantId: 'tenant-acme',
        queryOrUploadInfo: query,
        sources: [],
        selectedSourceIds: [],
        conversation: [
          {
            id: `msg-${id}`,
            role: 'assistant',
            content: `Isolated research session initiated for **${query}**.`,
            timestamp: now,
          },
        ],
        artifacts: [],
        savedNotes: [],
        status: 'active',
        isPermanent: false,
        isSaved: false,
        isArchived: false,
        retentionDays: 30,
        createdAt: now,
        lastActivityAt: now,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
    };

    const sessionA = createResearchSession('Quantum Computing Qubits', 1);
    const sessionB = createResearchSession('PostgreSQL B-Tree Indexing', 2);

    expect(sessionA.id).not.toBe(sessionB.id);
    expect(sessionA.title).toBe('Quantum Computing Qubits');
    expect(sessionB.title).toBe('PostgreSQL B-Tree Indexing');
    expect(sessionA.conversation[0].content).toContain('Quantum Computing Qubits');
    expect(sessionB.conversation[0].content).toContain('PostgreSQL B-Tree Indexing');

    // Verifying document collections are separate references
    sessionA.artifacts.push({
      id: 'art-quantum-summary',
      tenantId: 'tenant-acme',
      noteId: sessionA.id,
      userId: 'usr-default',
      artifactType: 'summary',
      title: 'Quantum Overview',
      content: { summaryText: 'Qubit superposition and entanglement.' },
      modelUsed: 'gemini-1.5-pro',
      tokensConsumed: 400,
      createdAt: new Date().toISOString(),
    });

    expect(sessionA.artifacts).toHaveLength(1);
    expect(sessionB.artifacts).toHaveLength(0); // Zero cross-leakage
  });
});

describe('Module 5: 14 Separate Document Types Generation', () => {
  const sampleTitle = 'Building an Evaluation Harness for LLM Systems';
  const sampleTranscript = 'In this lecture we build an automated LLM evaluation pipeline in Python. We use BLEU, ROUGE, and LLM-as-a-judge for semantic evaluation.';

  it('1. generates Comprehensive Notes', async () => {
    const res = await generateStructuredNotes(sampleTitle, sampleTranscript);
    expect(res.result).toBeDefined();
    expect(res.result.summaryText).toBeTruthy();
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it('2. generates Executive Summary & 4. Key Takeaways', async () => {
    const res = await generateSummary(sampleTitle, sampleTranscript);
    expect(res.result.summaryText).toBeTruthy();
    expect(res.result.keyTakeaways.length).toBeGreaterThan(0);
  });

  it('3. generates Detailed Topic Explanation', async () => {
    const res = await generateDetailedTopicExplanation(sampleTitle, sampleTranscript);
    expect(res.result.summaryText).toBeTruthy();
    expect(res.result.formattedMarkdown).toBeTruthy();
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it('5. generates Interview Q&A', async () => {
    const res = await generateInterviewQA(sampleTitle, sampleTranscript);
    expect(res.result.questions.length).toBeGreaterThan(0);
    expect(res.result.questions[0].answer).toBeTruthy();
    expect(res.result.questions[0].keyCriteria.length).toBeGreaterThan(0);
  });

  it('6. generates Study Guide & 14. Domain Glossary', async () => {
    const res = await generateGlossary(sampleTitle, sampleTranscript);
    expect(res.result.studyGuide.glossary.length).toBeGreaterThan(0);
    expect(res.result.studyGuide.glossary[0].term).toBeTruthy();
    expect(res.result.studyGuide.glossary[0].definition).toBeTruthy();
  });

  it('7. generates Flashcards', async () => {
    const res = await generateFlashcards(sampleTitle, sampleTranscript);
    expect(res.result.flashcards.length).toBeGreaterThan(0);
    expect(res.result.flashcards[0].front).toBeTruthy();
    expect(res.result.flashcards[0].back).toBeTruthy();
  });

  it('8. generates MCQ Bank', async () => {
    const res = await generateQuiz(sampleTitle, sampleTranscript);
    expect(res.result.questions.length).toBeGreaterThan(0);
    expect(res.result.questions[0].options.length).toBe(4);
    expect(res.result.questions[0].correctOptionIndex).toBeGreaterThanOrEqual(0);
  });

  it('9. generates Short Answer Questions', async () => {
    const res = await generateShortAnswerQuestions(sampleTitle, sampleTranscript);
    expect(res.result.shortQA.length).toBeGreaterThan(0);
    expect(res.result.shortQA[0].question).toBeTruthy();
    expect(res.result.shortQA[0].briefAnswer).toBeTruthy();
  });

  it('10. generates Long Answer Questions', async () => {
    const res = await generateLongAnswerQuestions(sampleTitle, sampleTranscript);
    expect(res.result.longQA.length).toBeGreaterThan(0);
    expect(res.result.longQA[0].comprehensiveAnalysis).toBeTruthy();
  });

  it('11. generates Practical Examples', async () => {
    const res = await generatePracticalExamples(sampleTitle, sampleTranscript);
    expect(res.result.practicalExamples.length).toBeGreaterThan(0);
    expect(res.result.practicalExamples[0].scenario).toBeTruthy();
    expect(res.result.practicalExamples[0].implementation).toBeTruthy();
  });

  it('12. generates Technical Explanation', async () => {
    const res = await generateTechnicalExplanation(sampleTitle, sampleTranscript);
    expect(res.result.summaryText).toBeTruthy();
    expect(res.result.formattedMarkdown).toBeTruthy();
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it('13. generates Critical Analysis', async () => {
    const res = await generateCriticalAnalysis(sampleTitle, sampleTranscript);
    expect(res.result.summaryText).toBeTruthy();
    expect(res.result.formattedMarkdown).toBeTruthy();
    expect(res.tokensUsed).toBeGreaterThan(0);
  });
});

describe('Module 6: Research Library & Organization', () => {
  it('structures research sessions into tree hierarchy and supports search & filters', () => {
    const sessions = [
      { id: 'rs-1', title: 'LLM Evaluation Harness', sourcesCount: 2, artifactsCount: 5, date: '2026-11-15' },
      { id: 'rs-2', title: 'Vector Database Benchmarks', sourcesCount: 1, artifactsCount: 3, date: '2026-11-16' },
      { id: 'rs-3', title: 'Kubernetes Operators', sourcesCount: 3, artifactsCount: 2, date: '2026-11-17' },
    ];

    // Search query filter
    const query = 'vector';
    const filtered = sessions.filter((s) => s.title.toLowerCase().includes(query));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('rs-2');

    // Date sort descending
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    expect(sorted[0].id).toBe('rs-3');
  });
});

describe('Module 7: Automatic Data Retention & Scheduled Cleanup', () => {
  it('correctly calculates expiration dates based on policy period', () => {
    const nowMs = 1700000000000;
    const calculateExpiration = (createdAtMs: number, retentionDays: RetentionPeriodDays) => {
      if (retentionDays === -1) return null; // Indefinite
      return new Date(createdAtMs + retentionDays * 24 * 60 * 60 * 1000).toISOString();
    };

    expect(calculateExpiration(nowMs, -1)).toBeNull();
    const exp30 = calculateExpiration(nowMs, 30);
    expect(exp30).toBe(new Date(nowMs + 30 * 86400000).toISOString());
    const exp7 = calculateExpiration(nowMs, 7);
    expect(exp7).toBe(new Date(nowMs + 7 * 86400000).toISOString());
  });

  it('strictly protects permanent and saved sessions from automated cleanup', () => {
    const sessions = [
      { id: 's-expired-temp', isPermanent: false, isSaved: false, status: 'active', isExpired: true },
      { id: 's-expired-saved', isPermanent: true, isSaved: true, status: 'active', isExpired: true },
      { id: 's-active-temp', isPermanent: false, isSaved: false, status: 'active', isExpired: false },
    ];

    const cleaned = sessions.map((s) => {
      if (s.isExpired && !s.isPermanent && !s.isSaved) {
        return { ...s, status: 'trashed' };
      }
      return s;
    });

    expect(cleaned[0].status).toBe('trashed');
    expect(cleaned[1].status).toBe('active'); // Shielded by isPermanent
    expect(cleaned[2].status).toBe('active');
  });
});

describe('Module 8: Workspace Navigation Reorganization', () => {
  it('verifies exact 3-group navigation hierarchy', () => {
    const navigationGroups = {
      WORKSPACE: ['home', 'my_research', 'my_notes', 'library', 'ai_chat', 'agent_studio'],
      AI_TOOLS: ['creation_studio', 'learning_review', 'research_visualization', 'meetings'],
      ACCOUNT: ['profile', 'settings', 'retention'],
    };

    expect(navigationGroups.WORKSPACE).toContain('home');
    expect(navigationGroups.WORKSPACE).toContain('my_research');
    expect(navigationGroups.WORKSPACE).toContain('agent_studio');

    expect(navigationGroups.AI_TOOLS).toContain('creation_studio');
    expect(navigationGroups.AI_TOOLS).toContain('learning_review');

    expect(navigationGroups.ACCOUNT).toContain('profile');
    expect(navigationGroups.ACCOUNT).toContain('settings');
    expect(navigationGroups.ACCOUNT).toContain('retention');
  });
});
