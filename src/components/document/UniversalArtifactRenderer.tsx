'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  HelpCircle, 
  Layers, 
  BrainCircuit, 
  Briefcase, 
  Clock, 
  FileText, 
  ListOrdered, 
  Check, 
  Sparkles, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Network, 
  GitCompare, 
  Users, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AIArtifact, Flashcard, QuizQuestion, InterviewQuestion, ActionItem } from '@/types';
import { RichDocumentContent } from './RichDocumentContent';

interface UniversalArtifactRendererProps {
  artifact: AIArtifact;
  className?: string;
  editable?: boolean;
  onUpdateContent?: (updatedContent: Record<string, unknown>) => void;
}

export const UniversalArtifactRenderer: React.FC<UniversalArtifactRendererProps> = ({
  artifact,
  className = '',
  editable = false,
  onUpdateContent,
}) => {
  // Flashcard Deck State
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [flashcardViewMode, setFlashcardViewMode] = useState<'card' | 'grid'>('card');

  // Quiz State
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [revealedQuizExplanations, setRevealedQuizExplanations] = useState<Record<number, boolean>>({});

  // Action Items State
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const { artifactType, title, content } = artifact;

  // Toggle action item task
  const handleToggleTask = (taskId: string, currentStatus: boolean) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: prev[taskId] !== undefined ? !prev[taskId] : !currentStatus,
    }));
  };

  // 1. FLASHCARDS DECK
  const flashcards: Flashcard[] = content?.flashcards || [];
  if (artifactType === 'flashcards' && flashcards.length > 0) {
    const activeCard = flashcards[currentFlashcardIdx] || flashcards[0];

    return (
      <div className={`space-y-4 ${className}`}>
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
              Flashcard Deck
            </span>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {flashcards.length} Active Recall Cards
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFlashcardViewMode(flashcardViewMode === 'card' ? 'grid' : 'card')}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
            >
              {flashcardViewMode === 'card' ? 'Show Grid View' : 'Show Single Player'}
            </button>
          </div>
        </div>

        {flashcardViewMode === 'card' ? (
          <div className="max-w-xl mx-auto space-y-4">
            {/* Interactive Flashcard */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[220px] p-6 sm:p-8 rounded-2xl border-2 border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-md hover:border-[var(--accent-primary)] cursor-pointer transition-all flex flex-col justify-between select-none relative group"
            >
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="font-bold uppercase tracking-wider">
                  {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-[var(--accent-primary)]">
                  <RotateCw size={12} className="group-hover:rotate-180 transition-transform duration-300" />
                  <span>Click to flip</span>
                </span>
              </div>

              <div className="my-4 text-center">
                {!isFlipped ? (
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
                    {activeCard.front}
                  </h3>
                ) : (
                  <div className="text-sm sm:text-base font-semibold text-[var(--text-secondary)] leading-relaxed">
                    <RichDocumentContent content={activeCard.back} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[11px]">
                {activeCard.hint ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(!showHint);
                    }}
                    className="text-[var(--accent-primary)] hover:underline font-semibold"
                  >
                    {showHint ? `Hint: ${activeCard.hint}` : '💡 Show Hint'}
                  </button>
                ) : (
                  <span />
                )}
                <span className="text-[var(--text-muted)] font-mono font-medium">
                  {currentFlashcardIdx + 1} / {flashcards.length}
                </span>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={currentFlashcardIdx === 0}
                onClick={() => {
                  setCurrentFlashcardIdx((prev) => Math.max(0, prev - 1));
                  setIsFlipped(false);
                  setShowHint(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-card-hover)]"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                disabled={currentFlashcardIdx === flashcards.length - 1}
                onClick={() => {
                  setCurrentFlashcardIdx((prev) => Math.min(flashcards.length - 1, prev + 1));
                  setIsFlipped(false);
                  setShowHint(false);
                }}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-primary-hover)]"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flashcards.map((fc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                  <span>CARD #{idx + 1}</span>
                  {fc.hint && <span className="text-[var(--accent-primary)]">Hint available</span>}
                </div>
                <div className="font-bold text-xs text-[var(--text-primary)]">{fc.front}</div>
                <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  <RichDocumentContent content={fc.back} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. INTERACTIVE QUIZ STUDIO
  const quizQuestions: QuizQuestion[] =
    content?.quiz?.questions || (Array.isArray(content?.questions) ? (content.questions as QuizQuestion[]) : []);

  if (artifactType === 'quiz' && quizQuestions.length > 0) {
    const answeredCount = Object.keys(selectedQuizAnswers).length;
    const correctCount = Object.entries(selectedQuizAnswers).filter(
      ([qIdx, ansIdx]) => quizQuestions[Number(qIdx)]?.correctOptionIndex === ansIdx
    ).length;

    return (
      <div className={`space-y-5 ${className}`}>
        {/* Quiz Progress & Score Header */}
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <BrainCircuit size={16} className="text-sky-500" />
              <span>Interactive Practice Quiz</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select your answer to verify comprehension with instant feedback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
              Answered: {answeredCount} / {quizQuestions.length}
            </span>
            {answeredCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Score: {correctCount} / {answeredCount} ({Math.round((correctCount / answeredCount) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {quizQuestions.map((q, qIdx) => {
            const selectedOpt = selectedQuizAnswers[qIdx];
            const hasAnswered = selectedOpt !== undefined;
            const isCorrect = hasAnswered && selectedOpt === q.correctOptionIndex;
            const isExplanationShown = revealedQuizExplanations[qIdx] || hasAnswered;

            return (
              <div
                key={q.id || qIdx}
                className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h4 className="font-bold text-sm text-[var(--text-primary)] leading-snug">
                    {q.question}
                  </h4>
                </div>

                {/* Option Choices */}
                <div className="space-y-2 pt-1 pl-8">
                  {q.options.map((opt, optIdx) => {
                    const isThisOptionSelected = selectedOpt === optIdx;
                    const isThisCorrectOption = optIdx === q.correctOptionIndex;

                    let optStyle =
                      'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]';

                    if (hasAnswered) {
                      if (isThisCorrectOption) {
                        optStyle =
                          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isThisOptionSelected && !isCorrect) {
                        optStyle =
                          'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                      } else {
                        optStyle = 'border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={hasAnswered}
                        onClick={() => {
                          setSelectedQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${optStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md border border-[var(--border-subtle)] flex items-center justify-center font-bold text-[10px] text-[var(--text-muted)] bg-[var(--bg-panel)]">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </div>

                        {hasAnswered && isThisCorrectOption && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check size={14} />
                            <span>Correct</span>
                          </span>
                        )}
                        {hasAnswered && isThisOptionSelected && !isCorrect && (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Incorrect
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {isExplanationShown && q.explanation && (
                  <div className="mt-3 ml-8 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
                    <div className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                      <HelpCircle size={12} className="text-[var(--accent-primary)]" />
                      <span>Explanation</span>
                    </div>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. TECHNICAL INTERVIEW PREPARATION STUDIO
  const interviewQuestions: InterviewQuestion[] =
    content?.interviewQA?.questions || (Array.isArray(content?.questions) ? (content.questions as InterviewQuestion[]) : []);

  if (artifactType === 'interview_qa' && interviewQuestions.length > 0) {
    return (
      <div className={`space-y-5 ${className}`}>
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-header)] shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Briefcase size={16} className="text-amber-500" />
              <span>Technical Interview Q&A Studio</span>
            </h3>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {interviewQuestions.length} Questions & Model Answers
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Calibrated for technical evaluations with rubric criteria and follow-up prompts.
          </p>
        </div>

        <div className="space-y-4">
          {interviewQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {q.difficulty || 'Senior'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                    {q.category || 'Architecture'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Question #{idx + 1}
                </span>
              </div>

              {/* Question */}
              <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-snug">
                {q.question}
              </h4>

              {/* Model Answer */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--accent-primary)]">
                  Model Answer
                </span>
                <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  <RichDocumentContent content={q.answer} />
                </div>
              </div>

              {/* Key Criteria */}
              {q.keyCriteria && q.keyCriteria.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    What Interviewers Look For (Evaluation Criteria)
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.keyCriteria.map((kc, kIdx) => (
                      <li
                        key={kIdx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
                      >
                        <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{kc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code Snippet */}
              {q.codeSnippet && (
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Code / Implementation Sample
                  </span>
                  <pre className="p-3.5 rounded-xl bg-[var(--bg-input)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto border border-[var(--border-subtle)]">
                    <code>{q.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Follow-Up Questions */}
              {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Expected Follow-Up Questions
                  </span>
                  <div className="space-y-1 pl-2">
                    {q.followUpQuestions.map((fu, fIdx) => (
                      <div key={fIdx} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="text-[var(--accent-primary)] font-bold">&bull;</span>
                        <span>{fu}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. ACTION ITEMS CHECKLIST
  const actionItems: ActionItem[] = content?.actionItems || [];
  if (artifactType === 'action_items' && actionItems.length > 0) {
    const completedCount = actionItems.filter(
      (a) => (completedTasks[a.id] !== undefined ? completedTasks[a.id] : a.completed)
    ).length;

    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between shadow-xs">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <CheckSquare size={16} className="text-rose-500" />
              <span>Action Items & Execution Checklist</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Track tasks, assignees, and deadlines derived from note contents.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            {completedCount} / {actionItems.length} Completed
          </span>
        </div>

        <div className="space-y-2">
          {actionItems.map((item) => {
            const isDone = completedTasks[item.id] !== undefined ? completedTasks[item.id] : item.completed;
            return (
              <div
                key={item.id}
                onClick={() => handleToggleTask(item.id, isDone)}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {isDone ? (
                  <CheckSquare size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Square size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-xs sm:text-sm text-[var(--text-primary)] ${
                      isDone ? 'line-through text-[var(--text-muted)]' : ''
                    }`}
                  >
                    {item.task}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-[var(--text-muted)]">
                    {item.assignee && (
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        <span>Owner: {item.assignee}</span>
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Calendar size={11} />
                        <span>Due: {item.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. MEETING MINUTES & DECISIONS LOG
  if (artifactType === 'meeting_minutes' || content?.meetingMinutes) {
    const mm = content?.meetingMinutes || {};
    return (
      <div className={`space-y-5 ${className}`}>
        {/* Attendees & Overview */}
        {mm.attendees && mm.attendees.length > 0 && (
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel-header)] space-y-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Users size={13} className="text-[var(--accent-primary)]" />
              <span>Attendees & Stakeholders ({mm.attendees.length})</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {mm.attendees.map((att, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  {att}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Agenda */}
        {mm.agenda && mm.agenda.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <ListOrdered size={14} className="text-cyan-500" />
              <span>Meeting Agenda</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mm.agenda.map((ag, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs text-[var(--text-primary)] flex items-start gap-2"
                >
                  <span className="font-bold text-[var(--accent-primary)]">{idx + 1}.</span>
                  <span>{ag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Highlights */}
        {mm.discussionPoints && mm.discussionPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <FileText size={14} className="text-purple-500" />
              <span>Key Discussion Highlights</span>
            </h4>
            <div className="space-y-2">
              {mm.discussionPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decisions Log */}
        {mm.decisions && mm.decisions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckSquare size={14} />
              <span>Decisions Made ({mm.decisions.length})</span>
            </h4>
            <div className="space-y-2">
              {mm.decisions.map((dec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed flex items-start gap-2.5"
                >
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. STUDY GUIDE & REVISION NOTES
  if (content?.studyGuide?.topics) {
    return (
      <div className={`space-y-5 ${className}`}>
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <BookOpen size={14} className="text-indigo-500" />
            <span>Curriculum Topics & Principles</span>
          </h4>
          <div className="space-y-3">
            {content.studyGuide.topics.map((t, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{t.title}</h4>
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pl-7">
                  <RichDocumentContent content={t.explanation} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Glossary */}
        {content.studyGuide.glossary && content.studyGuide.glossary.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
              Domain Term Glossary
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {content.studyGuide.glossary.map((g, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1"
                >
                  <span className="font-bold text-xs text-[var(--accent-primary)]">{g.term}</span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{g.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 7. EXECUTIVE SUMMARY & KEY TAKEAWAYS (Structured)
  const summaryText = content?.summaryText;
  const keyTakeaways = content?.keyTakeaways || [];

  if (summaryText || keyTakeaways.length > 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Executive Summary Brief */}
        {summaryText && (
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--accent-primary)]" />
              <span>Synthesis & Brief</span>
            </h3>
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] shadow-xs">
              <RichDocumentContent content={summaryText} />
            </div>
          </div>
        )}

        {/* Key Takeaways Cards */}
        {keyTakeaways.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckSquare size={14} />
              <span>Key Takeaways & High-Signal Findings ({keyTakeaways.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {keyTakeaways.map((takeaway, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed flex items-start gap-2.5 shadow-xs hover:border-[var(--border-medium)] transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{takeaway}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 8. GENERIC RICH MARKDOWN OR STRUCTURED FALLBACK (Never display raw JSON!)
  if (content?.formattedMarkdown || content?.richText || typeof content === 'string') {
    const rawStr = (content?.formattedMarkdown || content?.richText || content) as string;
    return (
      <div className={className}>
        <RichDocumentContent content={rawStr} />
      </div>
    );
  }

  // Intelligently parse arbitrary object keys into beautiful visual sections
  const objectEntries = Object.entries(content || {}).filter(
    ([k]) => k !== 'summaryText' && k !== 'keyTakeaways' && k !== 'actionItems'
  );

  if (objectEntries.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {objectEntries.map(([sectionKey, sectionValue], idx) => {
          const formattedKey = sectionKey
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xs space-y-2"
            >
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>{formattedKey}</span>
              </h4>

              {typeof sectionValue === 'string' ? (
                <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  <RichDocumentContent content={sectionValue} />
                </div>
              ) : Array.isArray(sectionValue) ? (
                <ul className="space-y-1.5 pl-1">
                  {sectionValue.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />
                      <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(sectionValue as Record<string, unknown>).map(([subK, subV], sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs space-y-0.5"
                    >
                      <span className="font-semibold text-[var(--text-muted)] text-[10px] uppercase">
                        {subK}
                      </span>
                      <p className="text-[var(--text-primary)]">{String(subV)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
      No formatted content available in this artifact.
    </div>
  );
};
