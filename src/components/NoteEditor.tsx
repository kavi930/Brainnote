'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Pin, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  FileText, 
  MessageSquare, 
  ListChecks, 
  Layers, 
  GraduationCap, 
  Clock, 
  Send, 
  RotateCw, 
  CheckCircle2, 
  XCircle,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  Award,
  BookOpen,
  LayoutGrid,
  Share2,
  Briefcase,
  Code2,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { Note, AIArtifactType, QuizQuestion, ActionItem, Flashcard, AIArtifact, InterviewQuestion } from '@/types';

export type NoteEditorTab = 'content' | 'summary' | 'actions' | 'flashcards' | 'quiz' | 'qa' | 'interview_qa';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (updated: Note) => void;
  onGenerateAI: (type: AIArtifactType) => void;
  isGeneratingAI: boolean;
  activeTab?: NoteEditorTab;
  onTabChange?: (tab: NoteEditorTab) => void;
  onOpenShare?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onGenerateAI,
  isGeneratingAI,
  activeTab: controlledTab,
  onTabChange,
  onOpenShare,
}) => {
  const [internalTab, setInternalTab] = useState<NoteEditorTab>('content');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = (tab: NoteEditorTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Q&A Chat State
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string }>>([
    {
      q: 'What are the main tools and key findings mentioned in this source?',
      a: 'The source highlights top AI tools offering watermark-free high-definition video generation, focusing on motion consistency, temporal coherence, and image-to-video prompt control.',
    },
  ]);

  // Flashcards Study Deck State
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState<'player' | 'grid'>('player');
  const [knownCards, setKnownCards] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [revealedGridCards, setRevealedGridCards] = useState<Record<number, boolean>>({});
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardHint, setNewCardHint] = useState('');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  // Action Items State
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [isAddingAction, setIsAddingAction] = useState(false);

  // Interview Q&A State
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [interviewStatuses, setInterviewStatuses] = useState<Record<string, 'needs_practice' | 'mastered'>>({});

  if (!note) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF8F5',
        color: '#64748B',
        fontSize: '0.95rem',
      }}>
        Select or create a note to begin.
      </div>
    );
  }

  const primarySource = note.sources?.[0];
  const summaryArtifact = note.aiArtifacts?.find((a) => a.artifactType === 'summary');
  const actionsArtifact = note.aiArtifacts?.find((a) => a.artifactType === 'action_items');
  const flashcardArtifact = note.aiArtifacts?.find((a) => a.artifactType === 'flashcards');
  const quizArtifact = note.aiArtifacts?.find((a) => a.artifactType === 'quiz');
  const interviewArtifact = note.aiArtifacts?.find((a) => a.artifactType === 'interview_qa');

  // Normalized collections
  const actionItems: ActionItem[] = actionsArtifact?.content?.actionItems || [];
  const flashcardsList: Flashcard[] = flashcardArtifact?.content?.flashcards || [];
  const quizQuestions: QuizQuestion[] = 
    quizArtifact?.content?.quiz?.questions || 
    (quizArtifact?.content as any)?.questions || 
    [];
  const interviewQuestions: InterviewQuestion[] = 
    interviewArtifact?.content?.interviewQA?.questions ||
    (interviewArtifact?.content as any)?.questions ||
    [];

  // Note Metadata Handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({ ...note, title: e.target.value, updatedAt: new Date().toISOString() });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNote({ ...note, content: e.target.value, updatedAt: new Date().toISOString() });
  };

  const togglePin = () => {
    onUpdateNote({ ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() });
  };

  // --- ACTIONS HANDLERS ---
  const saveUpdatedActions = (items: ActionItem[]) => {
    const existing = note.aiArtifacts?.find((a) => a.artifactType === 'action_items');
    const newArtifact: AIArtifact = {
      id: existing?.id || `art-act-${Date.now()}`,
      tenantId: note.tenantId,
      noteId: note.id,
      userId: note.userId,
      artifactType: 'action_items',
      title: 'Action Items Checklist',
      content: { actionItems: items },
      modelUsed: existing?.modelUsed || 'Gemini 1.5 Pro',
      tokensConsumed: existing?.tokensConsumed || 1200,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    const updatedArtifacts = [
      newArtifact,
      ...(note.aiArtifacts || []).filter((a) => a.artifactType !== 'action_items'),
    ];
    onUpdateNote({ ...note, aiArtifacts: updatedArtifacts });
  };

  const toggleActionItem = (itemId: string) => {
    const items = actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    saveUpdatedActions(items);
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTask.trim()) return;
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      task: newActionTask.trim(),
      completed: false,
      dueDate: newActionDueDate.trim() || undefined,
    };
    saveUpdatedActions([...actionItems, newItem]);
    setNewActionTask('');
    setNewActionDueDate('');
    setIsAddingAction(false);
  };

  const handleDeleteActionItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveUpdatedActions(actionItems.filter((i) => i.id !== itemId));
  };

  // --- FLASHCARDS HANDLERS ---
  const saveUpdatedFlashcards = (cards: Flashcard[]) => {
    const existing = note.aiArtifacts?.find((a) => a.artifactType === 'flashcards');
    const newArtifact: AIArtifact = {
      id: existing?.id || `art-fc-${Date.now()}`,
      tenantId: note.tenantId,
      noteId: note.id,
      userId: note.userId,
      artifactType: 'flashcards',
      title: 'AI Video Tools Study Deck',
      content: { flashcards: cards },
      modelUsed: existing?.modelUsed || 'Gemini 1.5 Pro',
      tokensConsumed: existing?.tokensConsumed || 1100,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    const updated = [
      newArtifact,
      ...(note.aiArtifacts || []).filter((a) => a.artifactType !== 'flashcards'),
    ];
    onUpdateNote({ ...note, aiArtifacts: updated });
  };

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    const newCard: Flashcard = {
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      hint: newCardHint.trim() || undefined,
    };
    saveUpdatedFlashcards([...flashcardsList, newCard]);
    setNewCardFront('');
    setNewCardBack('');
    setNewCardHint('');
    setIsAddingCard(false);
  };

  const handleDeleteFlashcard = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = flashcardsList.filter((_, i) => i !== idx);
    saveUpdatedFlashcards(updated);
    if (activeCardIndex >= updated.length && updated.length > 0) {
      setActiveCardIndex(updated.length - 1);
    }
  };

  const markCardKnown = (isKnown: boolean) => {
    setKnownCards((prev) => ({ ...prev, [activeCardIndex]: isKnown }));
    if (activeCardIndex < flashcardsList.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
      setIsCardFlipped(false);
      setShowHint(false);
    }
  };

  // --- QUIZ HANDLERS ---
  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
  };

  // --- Q&A HANDLERS ---
  const handleAskQA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) return;

    const newQ = qaQuestion;
    setQaQuestion('');
    
    setTimeout(() => {
      setQaHistory((prev) => [
        ...prev,
        {
          q: newQ,
          a: `Based on "${note.title}", the analysis notes: "${note.content.slice(0, 180)}..." [Citation: Grounded directly in attached source: ${primarySource?.title || 'YouTube Transcript'}]`,
        },
      ]);
    }, 500);
  };

  // Folio Template Inserter
  const insertTemplate = (type: 'todo' | 'notes' | 'summary' | 'interview') => {
    let snippet = '';
    if (type === 'todo') {
      snippet = `\n\n### Action Items & Deliverables\n- [ ] Finalize browser extension side panel packaging\n- [ ] Verify source citation anchors against YouTube timestamp stream\n- [ ] Audit GDPR data export and deletion endpoints for tenant compliance\n`;
    } else if (type === 'notes') {
      snippet = `\n\n### Key Concepts & Workflow\n1. **Core Insight:** High-motion consistency without watermarks.\n2. **Image-to-Video Anchor:** Maintain subject character identity across frames.\n3. **Production Pipeline:** Generate keyframe starter images in Midjourney or Flux, then animate with Kling AI or Luma.\n`;
    } else if (type === 'summary') {
      snippet = `\n\n### Synthesis & Key Takeaways\n- **Primary Thesis:** Modern diffusion transformers simulate realistic physical motion without post-processing watermarks.\n- **Recommended Next Step:** Test high-fps exports with custom camera prompts.\n`;
    } else if (type === 'interview') {
      snippet = `\n\n### 💼 Technical Interview Preparation: Key Architecture Q&A\n**Q: How do you architect a custom LLM evaluation harness in Python from scratch?**\n- **Modular Design:** Decouple into 4 components: Dataset Manager, Model Interface, Metrics Pipeline, and Results Logger.\n- **Key Interview Criteria:** Demonstrating rate-limiting & exponential backoff, handling multiple models (OpenAI, Gemini, local vLLM), combining deterministic (Exact Match/F1) with semantic embeddings, and mitigating LLM-as-a-judge position bias.\n\n\`\`\`python\n# Minimal Evaluation Harness Loop\nfor sample in test_dataset:\n    output = model(sample.prompt)\n    score = metric(output, sample.expected)\n\`\`\`\n`;
    }
    onUpdateNote({ ...note, content: note.content + snippet, updatedAt: new Date().toISOString() });
  };

  // Calculations
  const completedActionsCount = actionItems.filter((i) => i.completed).length;
  const actionsProgressPercent = actionItems.length > 0 ? Math.round((completedActionsCount / actionItems.length) * 100) : 0;
  
  const currentCard = flashcardsList[activeCardIndex] || null;
  const knownCardsCount = Object.values(knownCards).filter(Boolean).length;

  const answeredQuizCount = Object.keys(quizAnswers).length;
  const correctQuizCount = quizQuestions.filter((q) => quizAnswers[q.id] === q.correctOptionIndex).length;
  const isQuizComplete = quizQuestions.length > 0 && answeredQuizCount === quizQuestions.length;

  return (
    <main style={{
      flex: 1,
      height: 'calc(100vh - 67px)',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top action toolbar (Folio inspired clean border) */}
      <div style={{
        padding: '12px 32px',
        borderBottom: '1px solid #E8E5DF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FAF8F5',
      }}>
        {/* Tab navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'content' ? '#18171C' : 'transparent',
              color: activeTab === 'content' ? '#FFFFFF' : '#64748B',
              border: activeTab === 'content' ? '1px solid #18171C' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={14} />
            <span>Note Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'summary' ? '#EDE9FE' : 'transparent',
              color: activeTab === 'summary' ? '#6D28D9' : '#64748B',
              border: activeTab === 'summary' ? '1px solid #DDD6FE' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color={activeTab === 'summary' ? '#6D28D9' : '#8B5CF6'} />
            <span>Summary</span>
            {summaryArtifact && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6D28D9' }} />}
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'actions' ? '#D1FAE5' : 'transparent',
              color: activeTab === 'actions' ? '#047857' : '#64748B',
              border: activeTab === 'actions' ? '1px solid #A7F3D0' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ListChecks size={14} color={activeTab === 'actions' ? '#047857' : '#10B981'} />
            <span>Actions ({actionItems.length})</span>
            {actionItems.length > 0 && (
              <span style={{ fontSize: '0.72rem', background: '#A7F3D0', padding: '1px 6px', borderRadius: '10px' }}>
                {completedActionsCount}/{actionItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'flashcards' ? '#E0F2FE' : 'transparent',
              color: activeTab === 'flashcards' ? '#0369A1' : '#64748B',
              border: activeTab === 'flashcards' ? '1px solid #BAE6FD' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} color={activeTab === 'flashcards' ? '#0369A1' : '#06B6D4'} />
            <span>Flashcards ({flashcardsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'quiz' ? '#FEF3C7' : 'transparent',
              color: activeTab === 'quiz' ? '#B45309' : '#64748B',
              border: activeTab === 'quiz' ? '1px solid #FDE68A' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <GraduationCap size={14} color={activeTab === 'quiz' ? '#B45309' : '#D97706'} />
            <span>Quiz ({quizQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('interview_qa')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'interview_qa' ? '#D1FAE5' : 'transparent',
              color: activeTab === 'interview_qa' ? '#065F46' : '#64748B',
              border: activeTab === 'interview_qa' ? '1px solid #A7F3D0' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Briefcase size={14} color={activeTab === 'interview_qa' ? '#047857' : '#059669'} />
            <span>Interview Q&A ({interviewQuestions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: activeTab === 'qa' ? '#EDE9FE' : 'transparent',
              color: activeTab === 'qa' ? '#6552A3' : '#64748B',
              border: activeTab === 'qa' ? '1px solid #DDD6FE' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <MessageSquare size={14} color="#6552A3" />
            <span>Grounded Q&A</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                color: '#6552A3',
                borderColor: '#DDD6FE',
                background: '#FAF5FF',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Share note and invite collaborators"
            >
              <Share2 size={14} color="#6552A3" />
              <span>Share & Invite</span>
            </button>
          )}

          {/* Pin button */}
          <button
            onClick={togglePin}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              color: note.isPinned ? '#B45309' : '#64748B',
              borderColor: note.isPinned ? '#FDE68A' : '#E8E5DF',
              background: note.isPinned ? '#FEF3C7' : '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <Pin size={14} color={note.isPinned ? '#D97706' : '#64748B'} />
            <span>{note.isPinned ? 'Pinned' : 'Pin Note'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', maxWidth: '1080px', width: '100%', margin: '0 auto' }}>
        
        {/* Note Title Input with Folio style font */}
        <input
          type="text"
          value={note.title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#1B1C1A',
            letterSpacing: '-0.025em',
            marginBottom: '16px',
            lineHeight: '1.3',
            fontFamily: 'inherit',
          }}
        />

        {/* Source Reference Card (if present) */}
        {primarySource && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '10px',
            background: '#FAF8F5',
            border: '1px solid #E8E5DF',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                textTransform: 'uppercase',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: primarySource.sourceType === 'youtube' ? '#FFE4E6' : '#EDE9FE',
                color: primarySource.sourceType === 'youtube' ? '#E11D48' : '#6552A3',
                border: primarySource.sourceType === 'youtube' ? '1px solid #FECDD3' : '1px solid #DDD6FE',
                letterSpacing: '0.04em',
              }}>
                {primarySource.sourceType}
              </span>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1B1C1A' }}>
                {primarySource.title}
              </span>
              {primarySource.durationSeconds && (
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {Math.floor(primarySource.durationSeconds / 60)} mins
                </span>
              )}
            </div>

            {primarySource.sourceUrl && (
              <a
                href={primarySource.sourceUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#6552A3',
                  textDecoration: 'none',
                }}
              >
                <span>Open Source</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Tab 1: Note Content & Editor */}
        {activeTab === 'content' && (
          <div>
            {/* Folio Inspired Quick Template Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: '10px',
              background: '#FAF8F5',
              border: '1px solid #E8E5DF',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#77717E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quick Templates:
                </span>
                <button
                  onClick={() => insertTemplate('todo')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#FFFFFF' }}
                >
                  + To-Do Checklist
                </button>
                <button
                  onClick={() => insertTemplate('notes')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#FFFFFF' }}
                >
                  + Video Insights
                </button>
                <button
                  onClick={() => insertTemplate('summary')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#FFFFFF' }}
                >
                  + Reflection
                </button>
                <button
                  onClick={() => insertTemplate('interview')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' }}
                >
                  + Interview Rubric
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => onGenerateAI('summary')}
                  disabled={isGeneratingAI}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                >
                  <Sparkles size={12} color="#6552A3" /> Summary
                </button>
                <button
                  onClick={() => onGenerateAI('interview_qa')}
                  disabled={isGeneratingAI}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', background: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857', fontWeight: 700 }}
                >
                  <Briefcase size={12} color="#059669" /> Interview Q&amp;A
                </button>
                <button
                  onClick={() => onGenerateAI('action_items')}
                  disabled={isGeneratingAI}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                >
                  <ListChecks size={12} color="#047857" /> Actions
                </button>
                <button
                  onClick={() => onGenerateAI('flashcards')}
                  disabled={isGeneratingAI}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                >
                  <Layers size={12} color="#0369A1" /> Flashcards
                </button>
                <button
                  onClick={() => onGenerateAI('quiz')}
                  disabled={isGeneratingAI}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                >
                  <GraduationCap size={12} color="#B45309" /> Quiz
                </button>
              </div>
            </div>

            {/* Interactive Ask AI / Web Notes & Interview Assistant Banner */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                    AI Note &amp; Technical Interview Assistant
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onGenerateAI('summary')}
                    disabled={isGeneratingAI}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: '#EDE9FE',
                      border: '1px solid #DDD6FE',
                      color: '#6D28D9',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Take Deep Notes</span>
                  </button>
                  <button
                    onClick={() => onGenerateAI('interview_qa')}
                    disabled={isGeneratingAI}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      background: '#D1FAE5',
                      border: '1px solid #A7F3D0',
                      color: '#047857',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Briefcase size={12} />
                    <span>Generate Interview Q&amp;A</span>
                  </button>
                </div>
              </div>

              {/* Quick Prompt Input Box */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ask AI: e.g. 'Synthesize custom evaluation loop into bullet points', 'Create 5 Senior Q&A on LLM-as-a-judge'..."
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (qaQuestion.toLowerCase().includes('interview') || qaQuestion.toLowerCase().includes('question')) {
                        onGenerateAI('interview_qa');
                      } else {
                        onGenerateAI('summary');
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#0F172A',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (qaQuestion.toLowerCase().includes('interview') || qaQuestion.toLowerCase().includes('question')) {
                      onGenerateAI('interview_qa');
                    } else {
                      onGenerateAI('summary');
                    }
                  }}
                  disabled={isGeneratingAI}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '8px 14px', borderRadius: '8px' }}
                >
                  <Send size={13} />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>

            {/* Note text editor */}
            <textarea
              value={note.content}
              onChange={handleContentChange}
              placeholder="Start typing your note, meeting minutes, or transcripts..."
              style={{
                width: '100%',
                minHeight: '480px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                color: '#1B1C1A',
                fontSize: '1rem',
                lineHeight: '1.8',
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
              }}
            />
          </div>
        )}

        {/* Tab 2: Executive Summary */}
        {activeTab === 'summary' && (
          <div>
            {!summaryArtifact ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                <Sparkles size={40} color="#6552A3" style={{ marginBottom: '14px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1B1C1A', marginBottom: '8px' }}>
                  No AI Summary Generated Yet
                </h4>
                <p style={{ fontSize: '0.88rem', marginBottom: '20px', color: '#64748B' }}>
                  Synthesize key themes, executive takeaways, and main topics from this note.
                </p>
                <button
                  onClick={() => onGenerateAI('summary')}
                  disabled={isGeneratingAI}
                  className="btn btn-primary"
                >
                  <Sparkles size={14} />
                  <span>{isGeneratingAI ? 'Processing with Gemini...' : 'Generate Executive Summary'}</span>
                </button>
              </div>
            ) : (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E8E5DF',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6552A3', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={18} />
                    <span>{summaryArtifact.title}</span>
                  </h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', background: '#FAF8F5', border: '1px solid #E8E5DF', padding: '4px 10px', borderRadius: '6px' }}>
                    Model: {summaryArtifact.modelUsed}
                  </span>
                </div>

                <p style={{ fontSize: '0.96rem', lineHeight: '1.8', color: '#1B1C1A', marginBottom: '24px' }}>
                  {summaryArtifact.content.summaryText}
                </p>

                {summaryArtifact.content.keyTakeaways && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Key Takeaways
                    </h4>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                      {summaryArtifact.content.keyTakeaways.map((item, idx) => (
                        <li key={idx} style={{ color: '#1B1C1A', lineHeight: '1.6' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Action Items Checklist (Fully Interactive & Persisted) */}
        {activeTab === 'actions' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E8E5DF',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Header with Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ListChecks size={20} />
                    <span>Action Items Checklist</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                    Track deliverables, commit milestones, and check off completed tasks.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setIsAddingAction(!isAddingAction)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '7px 14px', background: '#047857', borderColor: '#047857' }}
                  >
                    <Plus size={14} />
                    <span>Add Task</span>
                  </button>
                  <button
                    onClick={() => onGenerateAI('action_items')}
                    disabled={isGeneratingAI}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '7px 14px' }}
                  >
                    <Sparkles size={13} color="#047857" />
                    <span>{isGeneratingAI ? 'Extracting...' : 'AI Auto-Extract'}</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {actionItems.length > 0 && (
                <div style={{ marginBottom: '24px', background: '#F1F5F9', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    <span>Progress: {completedActionsCount} of {actionItems.length} completed</span>
                    <span>{actionsProgressPercent}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${actionsProgressPercent}%`, background: '#059669', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {/* Add New Action Item Form */}
              {isAddingAction && (
                <form onSubmit={handleAddActionItem} style={{
                  background: '#F8FAFC',
                  border: '1.5px dashed #059669',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857' }}>Add New Action Item</div>
                  <input
                    type="text"
                    placeholder="Describe the action item or deliverable..."
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={newActionDueDate}
                      onChange={(e) => setNewActionDueDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                      Save Action Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAction(false)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Action Items List */}
              {actionItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                  <ListChecks size={36} color="#059669" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.9rem', marginBottom: '14px' }}>No action items recorded for this note yet.</p>
                  <button
                    onClick={() => onGenerateAI('action_items')}
                    disabled={isGeneratingAI}
                    className="btn btn-primary"
                  >
                    Extract Action Items with AI
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleActionItem(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        background: item.completed ? '#F8FAFC' : '#FFFFFF',
                        border: item.completed ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, paddingRight: '12px' }}>
                        {item.completed ? (
                          <CheckSquare size={18} color="#059669" />
                        ) : (
                          <Square size={18} color="#94A3B8" />
                        )}
                        <span style={{
                          fontSize: '0.92rem',
                          fontWeight: item.completed ? 400 : 600,
                          color: item.completed ? '#94A3B8' : '#0F172A',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          lineHeight: '1.45',
                        }}>
                          {item.task}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.dueDate && (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#B45309', padding: '3px 9px', borderRadius: '6px', background: '#FEF3C7' }}>
                            Due: {item.dueDate}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteActionItem(item.id, e)}
                          title="Delete Action Item"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Active Recall Flashcards (Study Player + Grid Mode) */}
        {activeTab === 'flashcards' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E8E5DF',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Header Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={20} />
                    <span>Active Recall Flashcards</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                    Spaced repetition and active recall study deck generated from this note.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <button
                      onClick={() => setFlashcardMode('player')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: flashcardMode === 'player' ? '#FFFFFF' : 'transparent',
                        color: flashcardMode === 'player' ? '#0369A1' : '#64748B',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Study Mode
                    </button>
                    <button
                      onClick={() => setFlashcardMode('grid')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: flashcardMode === 'grid' ? '#FFFFFF' : 'transparent',
                        color: flashcardMode === 'grid' ? '#0369A1' : '#64748B',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Browse Grid ({flashcardsList.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAddingCard(!isAddingCard)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    <Plus size={13} />
                    <span>Add Card</span>
                  </button>

                  <button
                    onClick={() => onGenerateAI('flashcards')}
                    disabled={isGeneratingAI}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    <Sparkles size={13} />
                    <span>{isGeneratingAI ? 'Generating...' : 'AI Generate'}</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Flashcard Form */}
              {isAddingCard && (
                <form onSubmit={handleAddFlashcard} style={{
                  background: '#F0F9FF',
                  border: '1.5px dashed #0284C7',
                  borderRadius: '12px',
                  padding: '18px',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369A1' }}>Add New Study Flashcard</div>
                  <input
                    type="text"
                    placeholder="Front / Question / Concept..."
                    value={newCardFront}
                    onChange={(e) => setNewCardFront(e.target.value)}
                    required
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <textarea
                    placeholder="Back / Answer / Explanation..."
                    value={newCardBack}
                    onChange={(e) => setNewCardBack(e.target.value)}
                    required
                    rows={3}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Optional Hint..."
                    value={newCardHint}
                    onChange={(e) => setNewCardHint(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                      Save Flashcard
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCard(false)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Empty state */}
              {flashcardsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
                  <Layers size={40} color="#0284C7" style={{ margin: '0 auto 14px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    No Study Flashcards Generated Yet
                  </h4>
                  <p style={{ fontSize: '0.88rem', marginBottom: '20px', color: '#475569' }}>
                    Turn concepts from this note into active recall cards with one click.
                  </p>
                  <button
                    onClick={() => onGenerateAI('flashcards')}
                    disabled={isGeneratingAI}
                    className="btn btn-primary"
                  >
                    Generate Study Flashcards with AI
                  </button>
                </div>
              ) : flashcardMode === 'player' && currentCard ? (
                /* STUDY MODE PLAYER */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Progress Header */}
                  <div style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>
                    <span>Card {activeCardIndex + 1} of {flashcardsList.length}</span>
                    <span>Mastered: {knownCardsCount} / {flashcardsList.length}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', maxWidth: '640px', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ height: '100%', width: `${((activeCardIndex + 1) / flashcardsList.length) * 100}%`, background: '#0284C7', transition: 'width 0.3s ease' }} />
                  </div>

                  {/* Interactive Flip Card */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    style={{
                      width: '100%',
                      maxWidth: '640px',
                      minHeight: '280px',
                      borderRadius: '20px',
                      background: isCardFlipped ? '#F0F9FF' : '#FFFFFF',
                      border: isCardFlipped ? '2px solid #0284C7' : '1.5px solid #CBD5E1',
                      padding: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: isCardFlipped ? '#0369A1' : '#64748B',
                          background: isCardFlipped ? '#BAE6FD' : '#F1F5F9',
                          padding: '3px 10px',
                          borderRadius: '6px',
                        }}>
                          {isCardFlipped ? 'BACK / ANSWER' : 'FRONT / PROMPT'}
                        </span>

                        <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RotateCw size={13} /> Click to flip
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: '1.5',
                        marginBottom: '16px',
                      }}>
                        {isCardFlipped ? currentCard.back : currentCard.front}
                      </h3>

                      {currentCard.hint && !isCardFlipped && (
                        <div style={{ marginTop: '14px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowHint(!showHint);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#D97706',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {showHint ? 'Hide Hint' : '💡 Show Hint'}
                          </button>
                          {showHint && (
                            <p style={{ fontSize: '0.82rem', color: '#B45309', marginTop: '6px', fontStyle: 'italic' }}>
                              Hint: {currentCard.hint}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        {isCardFlipped ? 'Answer revealed' : 'Think through your answer before flipping'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCardFlipped(!isCardFlipped);
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                      >
                        <RotateCw size={12} />
                        <span>{isCardFlipped ? 'Show Question' : 'Reveal Answer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                    <button
                      onClick={() => {
                        if (activeCardIndex > 0) {
                          setActiveCardIndex((prev) => prev - 1);
                          setIsCardFlipped(false);
                          setShowHint(false);
                        }
                      }}
                      disabled={activeCardIndex === 0}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '8px 16px', opacity: activeCardIndex === 0 ? 0.4 : 1 }}
                    >
                      <ArrowLeft size={14} />
                      <span>Previous</span>
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => markCardKnown(false)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '8px 14px', background: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' }}
                      >
                        Review Again
                      </button>
                      <button
                        onClick={() => markCardKnown(true)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '8px 16px', background: '#059669', borderColor: '#059669' }}
                      >
                        <Check size={14} />
                        <span>I Know This</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (activeCardIndex < flashcardsList.length - 1) {
                          setActiveCardIndex((prev) => prev + 1);
                          setIsCardFlipped(false);
                          setShowHint(false);
                        }
                      }}
                      disabled={activeCardIndex >= flashcardsList.length - 1}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '8px 16px', opacity: activeCardIndex >= flashcardsList.length - 1 ? 0.4 : 1 }}
                    >
                      <span>Next</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* BROWSE GRID MODE */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {flashcardsList.map((card, idx) => {
                    const isRevealed = revealedGridCards[idx];
                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          border: isRevealed ? '2px solid #0284C7' : '1px solid #CBD5E1',
                          borderRadius: '16px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '220px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>
                              Card #{idx + 1}
                            </span>
                            <button
                              onClick={(e) => handleDeleteFlashcard(idx, e)}
                              title="Delete Flashcard"
                              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', lineHeight: '1.5', marginBottom: '14px' }}>
                            {card.front}
                          </h4>

                          {isRevealed && (
                            <div style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              fontSize: '0.88rem',
                              color: '#0369A1',
                              lineHeight: '1.55',
                              marginTop: '12px',
                            }}>
                              {card.back}
                            </div>
                          )}

                          {card.hint && (
                            <p style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '10px', fontStyle: 'italic' }}>
                              Hint: {card.hint}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => setRevealedGridCards((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          className="btn btn-secondary"
                          style={{ marginTop: '18px', fontSize: '0.78rem', width: '100%', fontWeight: 600 }}
                        >
                          <RotateCw size={12} />
                          <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Interactive Quiz (Fixed Question Resolution + Immediate Feedback) */}
        {activeTab === 'quiz' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E8E5DF',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={20} />
                    <span>Interactive Practice Quiz</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                    Test your comprehension with instant feedback, scoring, and grounded explanations.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {answeredQuizCount > 0 && (
                    <button
                      onClick={handleResetQuiz}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      <RotateCw size={12} />
                      <span>Retake Quiz</span>
                    </button>
                  )}
                  <button
                    onClick={() => onGenerateAI('quiz')}
                    disabled={isGeneratingAI}
                    className="btn btn-primary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#D97706', borderColor: '#D97706' }}
                  >
                    <Sparkles size={12} />
                    <span>{isGeneratingAI ? 'Generating...' : 'Regenerate Quiz'}</span>
                  </button>
                </div>
              </div>

              {/* Quiz Completion Banner */}
              {isQuizComplete && (
                <div style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #D1FAE5 100%)',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Award size={28} color="#D97706" />
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
                        Quiz Completed! Score: {correctQuizCount} / {quizQuestions.length} ({Math.round((correctQuizCount / quizQuestions.length) * 100)}%)
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {correctQuizCount === quizQuestions.length 
                          ? 'Outstanding! You have mastered all key concepts in this video.' 
                          : 'Great effort! Review the explanations below to solidify understanding.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetQuiz}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    Practice Again
                  </button>
                </div>
              )}

              {/* Questions List */}
              {quizQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
                  <GraduationCap size={40} color="#D97706" style={{ margin: '0 auto 14px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    No Quiz Generated Yet
                  </h4>
                  <p style={{ fontSize: '0.88rem', marginBottom: '20px', color: '#475569' }}>
                    Generate an interactive multiple-choice quiz from this note with instant explanations.
                  </p>
                  <button
                    onClick={() => onGenerateAI('quiz')}
                    disabled={isGeneratingAI}
                    className="btn btn-primary"
                  >
                    Generate Practice Quiz with AI
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {quizQuestions.map((q: QuizQuestion, qIdx: number) => {
                    const selectedOpt = quizAnswers[q.id];
                    const hasAnswered = selectedOpt !== undefined;
                    const isCorrect = selectedOpt === q.correctOptionIndex;

                    return (
                      <div
                        key={q.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '16px',
                          padding: '24px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Question {qIdx + 1} of {quizQuestions.length}
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', lineHeight: '1.45' }}>
                          {q.question}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                          {q.options.map((opt: string, optIdx: number) => {
                            let optBg = '#FFFFFF';
                            let optBorder = '#CBD5E1';
                            let optColor = '#0F172A';

                            if (hasAnswered) {
                              if (optIdx === q.correctOptionIndex) {
                                optBg = '#D1FAE5';
                                optBorder = '#10B981';
                                optColor = '#047857';
                              } else if (optIdx === selectedOpt) {
                                optBg = '#FFE4E6';
                                optBorder = '#F43F5E';
                                optColor = '#9F1239';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectQuizOption(q.id, optIdx)}
                                style={{
                                  textAlign: 'left',
                                  padding: '12px 18px',
                                  borderRadius: '10px',
                                  border: `1.5px solid ${optBorder}`,
                                  background: optBg,
                                  color: optColor,
                                  fontSize: '0.9rem',
                                  fontWeight: hasAnswered && (optIdx === q.correctOptionIndex || optIdx === selectedOpt) ? 700 : 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {hasAnswered && optIdx === q.correctOptionIndex && (
                                  <CheckCircle2 size={16} color="#059669" />
                                )}
                                {hasAnswered && optIdx === selectedOpt && optIdx !== q.correctOptionIndex && (
                                  <XCircle size={16} color="#E11D48" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {hasAnswered && (
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: isCorrect ? '#F0FDF4' : '#FFF1F2',
                            border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECDD3'}`,
                            fontSize: '0.85rem',
                            color: isCorrect ? '#166534' : '#9F1239',
                            lineHeight: '1.5',
                          }}>
                            <strong>{isCorrect ? '✓ Correct! ' : '✕ Incorrect. '}</strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Technical Interview Preparation & Model Answers */}
        {activeTab === 'interview_qa' && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E8E5DF',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {/* Header & Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={20} color="#059669" />
                  <span>Technical Interview Preparation Studio</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                  Master concepts from this note with senior-level interview questions, model answers, code patterns, and grading rubrics.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => onGenerateAI('interview_qa')}
                  disabled={isGeneratingAI}
                  className="btn btn-primary"
                  style={{
                    background: '#059669',
                    fontSize: '0.8rem',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>{isGeneratingAI ? 'Generating Questions...' : '+ Add / Regenerate Questions'}</span>
                </button>
              </div>
            </div>

            {/* Filters & Mastery Tracker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} color="#166534" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Difficulty:
                  </span>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #86EFAC',
                      background: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#166534',
                      outline: 'none',
                    }}
                  >
                    <option value="All">All Levels</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Staff/Principal">Staff/Principal</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Category:
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #86EFAC',
                      background: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#166534',
                      outline: 'none',
                    }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Conceptual">Conceptual</option>
                    <option value="Coding & Architecture">Coding & Architecture</option>
                    <option value="System Design">System Design</option>
                    <option value="Evaluation & Edge Cases">Evaluation & Edge Cases</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="#059669" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534' }}>
                  Mastered: {Object.values(interviewStatuses).filter(s => s === 'mastered').length} of {interviewQuestions.length} Questions
                </span>
              </div>
            </div>

            {/* Questions List */}
            {interviewQuestions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: '#FAF8F5',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
              }}>
                <Briefcase size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  No interview questions generated yet
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 18px' }}>
                  Click the button below to have Brainnote AI analyze this note and generate technical questions, model answers, and code implementations.
                </p>
                <button
                  onClick={() => onGenerateAI('interview_qa')}
                  disabled={isGeneratingAI}
                  className="btn btn-primary"
                  style={{ background: '#059669', padding: '10px 20px', fontSize: '0.85rem' }}
                >
                  <Sparkles size={15} />
                  <span>{isGeneratingAI ? 'Synthesizing Questions...' : 'Generate Interview Questions with AI'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {interviewQuestions
                  .filter((q) => {
                    const matchDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
                    const matchCat = categoryFilter === 'All' || q.category === categoryFilter;
                    return matchDiff && matchCat;
                  })
                  .map((q, idx) => {
                    const isRevealed = !!revealedAnswers[q.id];
                    const status = interviewStatuses[q.id] || 'unreviewed';

                    return (
                      <div
                        key={q.id || idx}
                        style={{
                          background: '#FAF8F5',
                          border: status === 'mastered' ? '1.5px solid #86EFAC' : '1px solid #E8E5DF',
                          borderRadius: '14px',
                          padding: '24px',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Question Badges & Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              background: q.difficulty === 'Staff/Principal' ? '#FEF3C7' : q.difficulty === 'Senior' ? '#EDE9FE' : '#E0F2FE',
                              color: q.difficulty === 'Staff/Principal' ? '#B45309' : q.difficulty === 'Senior' ? '#6552A3' : '#0369A1',
                              border: `1px solid ${q.difficulty === 'Staff/Principal' ? '#FDE68A' : q.difficulty === 'Senior' ? '#DDD6FE' : '#BAE6FD'}`,
                            }}>
                              {q.difficulty}
                            </span>

                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: '#F1F5F9',
                              color: '#475569',
                              border: '1px solid #E2E8F0',
                            }}>
                              {q.category}
                            </span>

                            {status === 'mastered' && (
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: '#DCFCE7',
                                color: '#15803D',
                                border: '1px solid #86EFAC',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}>
                                <Check size={12} /> Mastered
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setInterviewStatuses((prev) => ({
                                  ...prev,
                                  [q.id]: status === 'mastered' ? 'needs_practice' : 'mastered',
                                }));
                              }}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: status === 'mastered' ? '#15803D' : '#64748B',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Award size={13} color={status === 'mastered' ? '#15803D' : '#94A3B8'} />
                              <span>{status === 'mastered' ? 'Marked Mastered' : 'Mark as Mastered'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Question Prompt */}
                        <h4 style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#18171C',
                          lineHeight: '1.5',
                          marginBottom: '16px',
                        }}>
                          Q{idx + 1}: {q.question}
                        </h4>

                        {/* Toggle Reveal Answer Button */}
                        <button
                          onClick={() => {
                            setRevealedAnswers((prev) => ({
                              ...prev,
                              [q.id]: !prev[q.id],
                            }));
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: isRevealed ? '#F1F5F9' : '#EDE9FE',
                            border: `1px solid ${isRevealed ? '#CBD5E1' : '#DDD6FE'}`,
                            color: isRevealed ? '#475569' : '#6552A3',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: isRevealed ? '16px' : '0',
                          }}
                        >
                          {isRevealed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isRevealed ? 'Hide Model Answer' : 'Reveal Model Answer & Grading Rubric'}</span>
                        </button>

                        {/* Model Answer Drawer */}
                        {isRevealed && (
                          <div style={{
                            marginTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            animation: 'fadeIn 0.2s ease-in',
                          }}>
                            {/* Answer Box */}
                            <div style={{
                              background: '#FFFFFF',
                              border: '1px solid #E8E5DF',
                              borderRadius: '12px',
                              padding: '18px 20px',
                            }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                                ✓ Authoritative Model Answer
                              </div>
                              <p style={{ fontSize: '0.92rem', lineHeight: '1.65', color: '#1F2937', margin: 0 }}>
                                {q.answer}
                              </p>
                            </div>

                            {/* Key Evaluation Criteria (Interviewer Rubric) */}
                            {q.keyCriteria && q.keyCriteria.length > 0 && (
                              <div style={{
                                background: '#F0FDF4',
                                border: '1px solid #BBF7D0',
                                borderRadius: '12px',
                                padding: '16px 20px',
                              }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                                  🎯 What Interviewers Look For (Key Evaluation Criteria)
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {q.keyCriteria.map((item, cIdx) => (
                                    <li key={cIdx} style={{ fontSize: '0.84rem', color: '#166534', lineHeight: '1.45' }}>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Code Snippet (if available) */}
                            {q.codeSnippet && (
                              <div style={{
                                background: '#0F172A',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                position: 'relative',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.74rem', fontWeight: 700 }}>
                                    <Code2 size={13} />
                                    <span>Python Architecture Implementation</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(q.codeSnippet || '');
                                      setCopiedCodeId(q.id);
                                      setTimeout(() => setCopiedCodeId(null), 2000);
                                    }}
                                    style={{
                                      background: 'rgba(255,255,255,0.1)',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '4px 10px',
                                      color: '#E2E8F0',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <Copy size={12} />
                                    <span>{copiedCodeId === q.id ? 'Copied!' : 'Copy Code'}</span>
                                  </button>
                                </div>
                                <pre style={{
                                  margin: 0,
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '0.82rem',
                                  color: '#38BDF8',
                                  lineHeight: '1.5',
                                  overflowX: 'auto',
                                }}>
                                  {q.codeSnippet}
                                </pre>
                              </div>
                            )}

                            {/* Follow-up Probing Questions */}
                            {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                              <div style={{
                                background: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                borderRadius: '12px',
                                padding: '16px 20px',
                              }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                                  ⚡ Likely Interviewer Follow-Up Questions
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {q.followUpQuestions.map((fQ, fIdx) => (
                                    <li key={fIdx} style={{ fontSize: '0.84rem', color: '#92400E', lineHeight: '1.45' }}>
                                      {fQ}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Grounded Q&A Chat */}
        {activeTab === 'qa' && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E8E5DF',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            height: '560px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6552A3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                <span>Grounded Knowledge Q&A</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                Grounded strictly in this note’s saved transcript and content with verifiable citations.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {qaHistory.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    alignSelf: 'flex-end',
                    background: '#EDE9FE',
                    border: '1px solid #DDD6FE',
                    color: '#5B21B6',
                    padding: '12px 18px',
                    borderRadius: '16px 16px 2px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    maxWidth: '80%',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    {item.q}
                  </div>
                  <div style={{
                    alignSelf: 'flex-start',
                    background: '#FAF8F5',
                    border: '1px solid #E8E5DF',
                    padding: '16px 20px',
                    borderRadius: '16px 16px 16px 2px',
                    fontSize: '0.92rem',
                    lineHeight: '1.65',
                    maxWidth: '85%',
                    color: '#1B1C1A',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6552A3', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px' }}>
                      <Sparkles size={12} />
                      <span>Brainnote Grounded Answer</span>
                    </div>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>

            {/* Q&A Input bar */}
            <form onSubmit={handleAskQA} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ask anything about this note or its attached sources..."
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                style={{
                  flex: 1,
                  background: '#FAF8F5',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  color: '#0F172A',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', borderRadius: '10px' }}>
                <Send size={15} />
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};
