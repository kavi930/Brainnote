'use client';

import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Globe, 
  FileText, 
  Youtube, 
  Mic, 
  BookMarked, 
  Layers, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  GraduationCap, 
  BrainCircuit, 
  Briefcase, 
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { Notebook, NoteSource, AIArtifact, PrimaryNavSection, SourceType } from '@/types';

interface HomeDashboardViewProps {
  userName: string;
  tenantName: string;
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  onNavigate: (section: PrimaryNavSection) => void;
  onOpenCapture: (tab?: SourceType) => void;
  onToggleSource: (sourceId: string) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  userName,
  tenantName,
  notebooks,
  activeNotebook,
  onSelectNotebook,
  onCreateNotebook,
  onNavigate,
  onOpenCapture,
  onToggleSource,
}) => {
  // Aggregate all sources and artifacts across notebooks
  const allSources: (NoteSource & { notebookTitle: string; notebookId: string })[] = [];
  const allArtifacts: (AIArtifact & { notebookTitle: string })[] = [];

  notebooks.forEach((nb) => {
    (nb.sources || []).forEach((src) => {
      allSources.push({ ...src, notebookTitle: nb.title, notebookId: nb.id });
    });
    (nb.artifacts || [])
      .filter(
        (art) =>
          art.id !== 'art-yt-study' &&
          art.title !== 'AI Video Tools Study Deck' &&
          !art.title.toLowerCase().includes('ai video tools study deck')
      )
      .forEach((art) => {
        allArtifacts.push({ ...art, notebookTitle: nb.title });
      });
  });

  // Recent 6 sources
  const recentSources = [...allSources].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 6);

  // Recent 4 artifacts
  const recentArtifacts = [...allArtifacts].slice(0, 4);

  // Sources with pending/processing status
  const activeProcessingJobs = allSources.filter((s) => s.processingStatus === 'processing' || s.processingStatus === 'pending');

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube size={15} className="text-red-500" />;
      case 'web':
        return <Globe size={15} className="text-blue-500" />;
      case 'pdf':
      case 'document':
        return <FileText size={15} className="text-rose-500" />;
      case 'audio':
      case 'meeting':
        return <Mic size={15} className="text-purple-500" />;
      default:
        return <FileText size={15} className="text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
      {/* 1. Welcome Section & Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)] to-[var(--accent-primary-light)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] mb-3">
            <Sparkles size={13} />
            <span>Brainnote AI &bull; Capture. Understand. Remember.</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, {userName}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Your grounded enterprise knowledge engine in <span className="font-semibold text-[var(--text-primary)]">{tenantName}</span>. Turn disparate web articles, YouTube lectures, meeting recordings, and whitepapers into actionable intelligence.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenCapture('youtube')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus size={15} />
              <span>Capture New Source</span>
            </button>
            <button
              onClick={() => onNavigate('ai_chat')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold transition-all"
            >
              <MessageSquare size={15} className="text-[var(--accent-primary)]" />
              <span>Open AI Chat Studio</span>
            </button>
            <button
              onClick={() => onNavigate('creation_studio')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold transition-all"
            >
              <Sparkles size={15} className="text-amber-500" />
              <span>AI Creation Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Capture Entry Points Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Quick Ingestion Methods
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onOpenCapture('web')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] hover:shadow-sm text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform">
              <Globe size={18} />
            </div>
            <span className="font-semibold text-xs text-[var(--text-primary)]">Website URL</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Articles & documentation</span>
          </button>

          <button
            onClick={() => onOpenCapture('pdf')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] hover:shadow-sm text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-2 group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <span className="font-semibold text-xs text-[var(--text-primary)]">Document File</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">PDF, PPTX slides, DOCX</span>
          </button>

          <button
            onClick={() => onOpenCapture('youtube')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] hover:shadow-sm text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-2 group-hover:scale-105 transition-transform">
              <Youtube size={18} />
            </div>
            <span className="font-semibold text-xs text-[var(--text-primary)]">YouTube Video</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Transcripts with timestamps</span>
          </button>

          <button
            onClick={() => onOpenCapture('audio')}
            className="flex flex-col items-start p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] hover:shadow-sm text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-105 transition-transform">
              <Mic size={18} />
            </div>
            <span className="font-semibold text-xs text-[var(--text-primary)]">Audio & Meeting</span>
            <span className="text-[11px] text-[var(--text-muted)] mt-0.5">Voice memos & meetings</span>
          </button>
        </div>
      </div>

      {/* 3. Processing Activity Alert (if any active jobs) */}
      {activeProcessingJobs.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Clock size={16} className="animate-spin text-amber-600 shrink-0" />
            <span>
              <strong>{activeProcessingJobs.length} source{activeProcessingJobs.length > 1 ? 's' : ''} processing</strong> &mdash; chunking & indexing for grounded search.
            </span>
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="text-xs font-semibold text-amber-900 dark:text-amber-200 underline hover:opacity-80"
          >
            View in Library
          </button>
        </div>
      )}

      {/* 4. Two-Column Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT / CENTER: Recent Sources & Active Notebooks (2 Cols on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Sources List */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[var(--accent-primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Recently Ingested Sources
                </h3>
              </div>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
              >
                <span>View all ({allSources.length})</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {recentSources.length > 0 ? (
              <div className="divide-y divide-[var(--border-subtle)]">
                {recentSources.map((src) => (
                  <div
                    key={src.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] px-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-[var(--bg-input)] shrink-0">
                        {getSourceIcon(src.sourceType)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {src.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-2">
                          <span>{src.notebookTitle}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{src.sourceType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {src.processingStatus === 'completed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={12} />
                          Ready
                        </span>
                      ) : src.processingStatus === 'failed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500">
                          <AlertCircle size={12} />
                          Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                          <Clock size={12} className="animate-spin" />
                          Processing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                No sources ingested yet. Capture a YouTube link or document to begin.
              </div>
            )}
          </div>

          {/* Active Notebooks */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookMarked size={16} className="text-[var(--accent-primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  My Notebooks
                </h3>
              </div>
              <button
                onClick={onCreateNotebook}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
              >
                <Plus size={13} />
                <span>New Notebook</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notebooks.map((nb) => {
                const isActive = activeNotebook?.id === nb.id;
                return (
                  <div
                    key={nb.id}
                    onClick={() => onSelectNotebook(nb.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-light)]/40 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-medium)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {nb.title}
                      </h4>
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary)] text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mb-2">
                      {nb.description || 'Grounded workspace containing sources and chat conversations.'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                      <span>{nb.sources?.length || 0} sources</span>
                      <span>{nb.artifacts?.length || 0} artifacts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Continue Learning & Generated Artifacts (1 Col on Desktop) */}
        <div className="space-y-6">
          {/* Continue Learning Card */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={16} className="text-violet-500" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Continue Learning & Review
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Strengthen memory retention with active recall study cards and interview evaluations.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('learning_review')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-left transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
                    <Layers size={14} />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Flashcard Decks</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Active recall spaced practice</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--text-muted)]" />
              </button>

              <button
                onClick={() => onNavigate('learning_review')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-left transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                    <BrainCircuit size={14} />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Interactive Quizzes</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Multiple choice self-testing</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--text-muted)]" />
              </button>

              <button
                onClick={() => onNavigate('learning_review')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-left transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Briefcase size={14} />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Technical Interview Q&A</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Rubrics & model answers</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Recently Generated Artifacts */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Generated Artifacts
                </h3>
              </div>
              <button
                onClick={() => onNavigate('creation_studio')}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Studio &rarr;
              </button>
            </div>

            {recentArtifacts.length > 0 ? (
              <div className="space-y-2">
                {recentArtifacts.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onNavigate('creation_studio')}
                    className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                        {art.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                        {art.artifactType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {art.notebookTitle} &bull; {art.modelUsed}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                No artifacts created yet. Open the Creation Studio to generate summaries or study guides.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

