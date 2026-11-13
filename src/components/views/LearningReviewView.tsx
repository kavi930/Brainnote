'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Layers, 
  BrainCircuit, 
  Briefcase, 
  RotateCw, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Copy, 
  Check, 
  Sparkles, 
  CheckSquare, 
  X, 
  BookMarked,
  Award,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Notebook, AIArtifact, Flashcard, QuizQuestion, InterviewQuestion } from '@/types';
import { RichDocumentContent } from '../document/RichDocumentContent';
import { UniversalArtifactRenderer } from '../document/UniversalArtifactRenderer';

interface LearningReviewViewProps {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onSelectNotebook: (id: string) => void;
  onGenerateTool: (toolId: string) => void;
  isGenerating?: boolean;
  onOpenArtifact?: (artifactId: string) => void;
}

export type LearningSubTab = 'flashcards' | 'quiz' | 'interview' | 'study_guides';

export const LearningReviewView: React.FC<LearningReviewViewProps> = ({
  notebooks,
  activeNotebook,
  onSelectNotebook,
  onGenerateTool,
  isGenerating = false,
  onOpenArtifact,
}) => {
  const [activeTab, setActiveTab] = useState<LearningSubTab>('flashcards');

  // Flashcards state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  // Quiz state
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Interview state
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [interviewFilter, setInterviewFilter] = useState<string>('All');
  const [masteredInterview, setMasteredInterview] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Extract learning artifacts from active notebook or all notebooks
  const currentArtifacts = activeNotebook?.artifacts || [];

  const flashcardArtifact = currentArtifacts.find((a) => a.artifactType === 'flashcards');
  const quizArtifact = currentArtifacts.find((a) => a.artifactType === 'quiz');
  const interviewArtifact = currentArtifacts.find((a) => a.artifactType === 'interview_qa');
  const studyGuideArtifacts = currentArtifacts.filter((a) => a.artifactType === 'study_guide');

  // Normalized Flashcards
  const flashcards: Flashcard[] = flashcardArtifact?.content?.flashcards || [
    {
      front: 'What is the primary benefit of Row-Level Security in multi-tenant SaaS?',
      back: 'It enforces data isolation at the PostgreSQL database engine layer using tenant_id session contexts, preventing unauthorized cross-tenant data leakage even with buggy query code.',
    },
    {
      front: 'How does hybrid BM25 and vector search reduce LLM hallucination?',
      back: 'BM25 ensures exact keyword and entity match recall, while dense embeddings capture semantic meaning. Together, they provide verifiable evidence chunks cited directly in the answer.',
    },
    {
      front: 'Why are stateless PostgREST connections optimal for Next.js serverless functions?',
      back: 'Stateless HTTPS PostgREST eliminates traditional TCP connection pooling exhaustion on high-concurrency Vercel serverless cold starts.',
    },
  ];

  // Normalized Quiz Questions
  const quizQuestions: QuizQuestion[] = quizArtifact?.content?.quiz?.questions || [
    {
      id: 'qz-1',
      question: 'Which HTTP header or session parameter securely guarantees tenant isolation in Brainnote API routes?',
      options: [
        'A user-supplied tenant ID query parameter without verification',
        'Cryptographically verified JWT session claims mapped to tenant_id',
        'A public cookie named x-tenant',
        'Client-side localStorage identifier',
      ],
      correctOptionIndex: 1,
      explanation: 'Tenant boundaries must always be derived from verified server-side session credentials or signed JWT claims to prevent tenant spoofing.',
    },
    {
      id: 'qz-2',
      question: 'What occurs when a source file exceeds 50MB during ingestion?',
      options: [
        'The backend crashes with out-of-memory exception',
        'The system returns FILE_TOO_LARGE with actionable splitting suggestions',
        'It is uploaded without chunking or search indexing',
        'It is silently truncated to the first 500 characters',
      ],
      correctOptionIndex: 1,
      explanation: 'Brainnote applies pre-flight size limits (50MB) and returns structured error codes with remediation advice.',
    },
    {
      id: 'qz-3',
      question: 'How are slide references anchored in PowerPoint (.pptx) ingestion?',
      options: [
        'They are assigned arbitrary continuous line numbers',
        'Each slide receives dedicated [Slide X] anchors and slideNumber metadata',
        'Slide numbers are discarded during sanitization',
        'Slides are grouped by color palette',
      ],
      correctOptionIndex: 1,
      explanation: 'Stage 3B introduces granular [Slide X] reference markers mapped to CitationAnchor.slideNumber.',
    },
  ];

  // Normalized Interview Questions
  const interviewQuestions: InterviewQuestion[] = interviewArtifact?.content?.interviewQA?.questions || [
    {
      id: 'iq-1',
      question: 'Design a real-time multi-tenant Retrieval Augmented Generation (RAG) system with strict tenant data privacy.',
      difficulty: 'Senior',
      category: 'System Design',
      answer: 'A production multi-tenant RAG pipeline requires: 1) Tenant-scoped embeddings in vector storage (pgvector with metadata filters or separate schemas), 2) Pre-filtering candidate chunks by tenant_id before hybrid BM25 ranker, 3) Token quota metering before calling LLM APIs, and 4) Complete evidence citation tracking to source documents.',
      keyCriteria: [
        'Explicit tenant isolation in both vector search and document chunk storage',
        'Hybrid retrieval (Dense + Sparse) to balance keyword precision and semantics',
        'Graceful rate limiting and subscription tier enforcement',
      ],
      followUpQuestions: [
        'How would you handle document updates and cache invalidation when a user re-uploads an edited PDF?',
        'What strategies would you employ if a tenant exceeds their monthly LLM token allowance mid-query?',
      ],
    },
    {
      id: 'iq-2',
      question: 'How do you guarantee serverless database connection safety on platforms like Vercel with PostgreSQL?',
      difficulty: 'Mid-Level',
      category: 'Coding & Architecture',
      answer: 'Traditional connection pools like pg-pool or Prisma crash under high serverless concurrency because each lambda spawn creates dedicated TCP sockets. The solution is utilizing stateless HTTP/PostgREST APIs (like Supabase PostgREST) or dedicated external connection poolers (like PgBouncer or Supabase Supavisor) with transaction-mode pooling.',
      keyCriteria: [
        'Understanding of serverless execution lifecycles and ephemeral lambdas',
        'Distinction between session pooling and transaction pooling',
      ],
      followUpQuestions: [
        'What are the latency trade-offs between HTTP PostgREST vs persistent TCP pooling?',
      ],
    },
  ];

  const currentCard = flashcards[activeCardIndex] || flashcards[0];

  const handleNextCard = () => {
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleMasteredCard = (idx: number) => {
    setMasteredCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredInterviewQuestions = interviewQuestions.filter((q) => {
    if (interviewFilter === 'All') return true;
    return q.difficulty === interviewFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* 1. Header & Notebook Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-violet-500" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Learning & Active Recall Hub
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Active Notebook: <span className="font-semibold text-[var(--text-primary)]">{activeNotebook?.title || 'Untitled'}</span>
          </p>
        </div>

        {/* Notebook Switcher */}
        <select
          value={activeNotebook?.id || ''}
          onChange={(e) => onSelectNotebook(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] font-semibold"
        >
          {notebooks.map((nb) => (
            <option key={nb.id} value={nb.id}>
              {nb.title} ({nb.artifacts?.length || 0} artifacts)
            </option>
          ))}
        </select>
      </div>

      {/* 2. Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'flashcards'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <Layers size={14} />
          <span>Flashcards ({flashcards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'quiz'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <BrainCircuit size={14} />
          <span>Quiz ({quizQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'interview'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <Briefcase size={14} />
          <span>Interview Q&A ({interviewQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('study_guides')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            activeTab === 'study_guides'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
          }`}
        >
          <Sparkles size={14} />
          <span>Study Guides ({studyGuideArtifacts.length})</span>
        </button>
      </div>

      {/* 3. Tab Content */}

      {/* TAB A: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">
              Card {activeCardIndex + 1} of {flashcards.length}
            </span>
            <div className="flex items-center gap-3">
              {flashcardArtifact && onOpenArtifact && (
                <button
                  onClick={() => onOpenArtifact(flashcardArtifact.id)}
                  className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline font-semibold"
                >
                  <FileText size={13} />
                  <span>Open Document</span>
                </button>
              )}
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                Mastered: {Object.values(masteredCards).filter(Boolean).length} of {flashcards.length}
              </span>
            </div>
          </div>

          {/* Interactive 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[260px] p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between select-none relative group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                {isFlipped ? 'Answer' : 'Question'}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors">
                Click anywhere to flip
              </span>
            </div>

            <div className="py-6 text-center">
              <div className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMasteredCard(activeCardIndex);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  masteredCards[activeCardIndex]
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{masteredCards[activeCardIndex] ? 'Mastered' : 'Mark as Mastered'}</span>
              </button>

              <span className="text-[10px]">
                Spaced Active Recall Deck
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrevCard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors shadow-sm"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => onGenerateTool('flashcards')}
              disabled={isGenerating}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
            >
              <Sparkles size={13} />
              <span>Regenerate Deck</span>
            </button>

            <button
              onClick={handleNextCard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)] transition-colors shadow-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* TAB B: QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">
              Interactive Self-Assessment
            </span>
            <div className="flex items-center gap-3">
              {quizArtifact && onOpenArtifact && (
                <button
                  onClick={() => onOpenArtifact(quizArtifact.id)}
                  className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline font-semibold"
                >
                  <FileText size={13} />
                  <span>Open Document</span>
                </button>
              )}
              <span>
                {Object.keys(quizSelections).length} of {quizQuestions.length} answered
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {quizQuestions.map((q, qIdx) => {
              const selectedOpt = quizSelections[qIdx];
              const isAnswered = typeof selectedOpt === 'number';

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm space-y-3"
                >
                  <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                    {qIdx + 1}. {q.question}
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isThisSelected = selectedOpt === oIdx;
                      const isCorrect = oIdx === q.correctOptionIndex;
                      let btnStyle = 'border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]';

                      if (isAnswered) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                        } else if (isThisSelected) {
                          btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-semibold';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isAnswered}
                          onClick={() => setQuizSelections((prev) => ({ ...prev, [qIdx]: oIdx }))}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[11px] opacity-70">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isAnswered && isCorrect && (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] space-y-1">
                      <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        <Award size={12} className="text-amber-500" />
                        <span>Explanation & Citation Anchor</span>
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setQuizSelections({})}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Reset Quiz
            </button>
          </div>
        </div>
      )}

      {/* TAB C: INTERVIEW PREPARATION */}
      {activeTab === 'interview' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Difficulty Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              {['All', 'Junior', 'Mid-Level', 'Senior'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setInterviewFilter(lvl)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    interviewFilter === lvl
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {interviewArtifact && onOpenArtifact && (
                <button
                  onClick={() => onOpenArtifact(interviewArtifact.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  <FileText size={13} />
                  <span>Open Document</span>
                </button>
              )}
              <button
                onClick={() => onGenerateTool('interview_prep')}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                <Sparkles size={13} />
                <span>Generate Questions with AI</span>
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {filteredInterviewQuestions.map((q) => {
              const isRevealed = !!revealedAnswers[q.id];
              const isMastered = !!masteredInterview[q.id];

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          q.difficulty === 'Senior'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        }`}>
                          {q.difficulty}
                        </span>
                        {q.category && (
                          <span className="text-[11px] text-[var(--text-muted)] font-medium">
                            &bull; {q.category}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                        {q.question}
                      </h4>
                    </div>

                    <button
                      onClick={() => setMasteredInterview((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                        isMastered
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {isMastered ? 'Mastered' : 'Mark Mastered'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <button
                      onClick={() => setRevealedAnswers((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>{isRevealed ? 'Hide Model Answer' : 'Reveal Model Answer'}</span>
                    </button>
                  </div>

                  {isRevealed && (
                    <div className="space-y-3 pt-2 text-xs leading-relaxed animate-in fade-in">
                      <div className="p-3.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                        <div className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                          Model Answer
                        </div>
                        <RichDocumentContent content={q.answer} />
                      </div>

                      {q.keyCriteria && q.keyCriteria.length > 0 && (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                          <div className="font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <CheckSquare size={13} />
                            <span>Interviewer Evaluation Rubric</span>
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                            {q.keyCriteria.map((kc, idx) => (
                              <li key={idx}>{kc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                          <div className="font-bold text-[11px] uppercase tracking-wider mb-1">
                            Likely Follow-Up Questions
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                            {q.followUpQuestions.map((fu, idx) => (
                              <li key={idx}>{fu}</li>
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
        </div>
      )}

      {/* TAB D: STUDY GUIDES */}
      {activeTab === 'study_guides' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {studyGuideArtifacts.length > 0 ? (
            studyGuideArtifacts.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                      Study Guide
                    </span>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{art.title}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(art.createdAt).toLocaleDateString()}
                    </span>
                    {onOpenArtifact && (
                      <button
                        onClick={() => onOpenArtifact(art.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                      >
                        <FileText size={13} />
                        <span>Open Document</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-2 max-h-80 overflow-y-auto">
                  <UniversalArtifactRenderer artifact={art} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs text-[var(--text-muted)]">
              No study guides created in this notebook. Generate one in the AI Creation Studio.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
