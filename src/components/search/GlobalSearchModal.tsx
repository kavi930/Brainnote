'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  BookMarked,
  Sparkles,
  Layers,
  BrainCircuit,
  Briefcase,
  Clock,
  ExternalLink,
  Trash2,
  History,
  ArrowRight,
  Youtube,
  Globe,
  Mic,
  Presentation,
  CheckCircle2
} from 'lucide-react';
import { Notebook, Note, NoteSource, AIArtifact, PrimaryNavSection } from '@/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notebooks: Notebook[];
  notes: Note[];
  onSelectNotebook: (id: string) => void;
  onSelectNote: (noteId: string) => void;
  onOpenArtifact: (artifactId: string) => void;
  onNavigate: (section: PrimaryNavSection) => void;
  onStartResearchSession?: (query: string) => void;
}

const RECENT_SEARCHES_KEY = 'brainnote_recent_searches';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  notebooks,
  notes,
  onSelectNotebook,
  onSelectNote,
  onOpenArtifact,
  onNavigate,
  onStartResearchSession,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load & sanitize recent searches from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Strictly purge any deleted test artifact and source terms
          const cleaned = parsed.filter((term: string) => {
            const lower = term.toLowerCase();
            return (
              !lower.includes('study deck') &&
              !lower.includes('art-yt') &&
              !lower.includes('video generator') &&
              !lower.includes('top 5 free')
            );
          });
          setRecentSearches(cleaned);
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(cleaned));
        }
      }
    } catch {
      // Local storage unavailable
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Save query to recent searches
  const recordSearch = (q: string) => {
    const trimmed = q.trim();
    const lower = trimmed.toLowerCase();
    if (
      !trimmed ||
      lower.includes('study deck') ||
      lower.includes('video generator') ||
      lower.includes('top 5 free') ||
      lower.includes('art-yt')
    )
      return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch { }
  };

  const clearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch { }
  };

  const q = searchQuery.toLowerCase().trim();

  // 1. Search Artifacts across all notebooks (Strictly excluding deleted test artifacts)
  const matchedArtifacts = useMemo(() => {
    if (!q) return [];
    const results: (AIArtifact & { notebookTitle: string; notebookId: string })[] = [];

    notebooks.forEach((nb) => {
      (nb.artifacts || [])
        .filter(
          (a) =>
            !a.id.startsWith('art-yt-') &&
            a.id !== 'art-yt-study' &&
            a.title !== 'AI Video Tools Study Deck' &&
            !a.title.toLowerCase().includes('ai video tools study deck') &&
            !a.title.toLowerCase().includes('free ai video generator')
        )
        .forEach((art) => {
          const matchTitle = art.title.toLowerCase().includes(q);
          const matchType = art.artifactType.replace('_', ' ').toLowerCase().includes(q);
          const matchContent = art.content?.summaryText?.toLowerCase().includes(q) ||
            art.content?.formattedMarkdown?.toLowerCase().includes(q);

          if (matchTitle || matchType || matchContent) {
            results.push({ ...art, notebookTitle: nb.title, notebookId: nb.id });
          }
        });
    });

    return results.slice(0, 5);
  }, [notebooks, q]);

  // 2. Search Sources across all notebooks (Strictly excluding deleted test sources)
  const matchedSources = useMemo(() => {
    if (!q) return [];
    const results: (NoteSource & { notebookTitle: string; notebookId: string })[] = [];

    notebooks.forEach((nb) => {
      (nb.sources || [])
        .filter(
          (src) =>
            src.id !== 'src-yt-video-1' &&
            !src.title.toLowerCase().includes('top 5 free ai video generator')
        )
        .forEach((src) => {
          const matchTitle = src.title.toLowerCase().includes(q);
          const matchUrl = src.sourceUrl?.toLowerCase().includes(q);
          const matchTranscript = src.rawTranscript?.toLowerCase().includes(q);

          if (matchTitle || matchUrl || matchTranscript) {
            results.push({ ...src, notebookTitle: nb.title, notebookId: nb.id });
          }
        });
    });

    return results.slice(0, 5);
  }, [notebooks, q]);

  // 3. Search Notes (Excluding deleted test notebook notes)
  const matchedNotes = useMemo(() => {
    if (!q) return [];
    return notes
      .filter((n) => {
        if (n.id === 'note-user-ai-video-tools' || n.title.toLowerCase().includes('top 5 free ai video generator')) {
          return false;
        }
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        return matchTitle || matchContent;
      })
      .slice(0, 4);
  }, [notes, q]);

  // 4. Search Notebooks (Excluding deleted test notebooks)
  const matchedNotebooks = useMemo(() => {
    if (!q) return [];
    return notebooks
      .filter((nb) => {
        if (nb.id === 'note-user-ai-video-tools' || nb.title.toLowerCase().includes('top 5 free ai video generator')) {
          return false;
        }
        const matchTitle = nb.title.toLowerCase().includes(q);
        const matchDesc = (nb.description || '').toLowerCase().includes(q);
        return matchTitle || matchDesc;
      })
      .slice(0, 3);
  }, [notebooks, q]);

  const totalResults =
    matchedArtifacts.length + matchedSources.length + matchedNotes.length + matchedNotebooks.length;

  const handleSelectArtifact = (artId: string, nbId: string) => {
    recordSearch(searchQuery);
    onSelectNotebook(nbId);
    onOpenArtifact(artId);
    onClose();
  };

  const handleSelectSource = (nbId: string) => {
    recordSearch(searchQuery);
    onSelectNotebook(nbId);
    onNavigate('library');
    onClose();
  };

  const handleSelectNoteItem = (noteId: string) => {
    recordSearch(searchQuery);
    onSelectNote(noteId);
    onNavigate('my_notes');
    onClose();
  };

  const handleSelectNotebookItem = (nbId: string) => {
    recordSearch(searchQuery);
    onSelectNotebook(nbId);
    onClose();
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'youtube':
        return <Youtube size={14} className="text-red-500 shrink-0" />;
      case 'web':
        return <Globe size={14} className="text-blue-500 shrink-0" />;
      case 'pdf':
      case 'document':
        return <FileText size={14} className="text-rose-500 shrink-0" />;
      case 'audio':
      case 'meeting':
        return <Mic size={14} className="text-purple-500 shrink-0" />;
      default:
        return <FileText size={14} className="text-[var(--text-muted)] shrink-0" />;
    }
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'flashcards':
        return <Layers size={14} className="text-violet-500 shrink-0" />;
      case 'quiz':
        return <BrainCircuit size={14} className="text-sky-500 shrink-0" />;
      case 'interview_qa':
        return <Briefcase size={14} className="text-emerald-500 shrink-0" />;
      case 'meeting_minutes':
      case 'decisions':
        return <Clock size={14} className="text-amber-500 shrink-0" />;
      default:
        return <Sparkles size={14} className="text-[var(--accent-primary)] shrink-0" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[82vh] animate-in zoom-in-95">
        {/* 1. Header Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all notebooks, sources, notes, and artifacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && searchQuery.trim() && onStartResearchSession) {
                onStartResearchSession(searchQuery.trim());
                recordSearch(searchQuery.trim());
                onClose();
              }
            }}
            className="flex-1 bg-transparent border-none text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-faint)]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              title="Clear search input"
            >
              <X size={15} />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
            ESC
          </span>
        </div>

        {/* B. Launch Research Session Banner */}
        {searchQuery.trim() && onStartResearchSession && (
          <div className="px-4 py-2.5 bg-[var(--accent-primary-light)]/40 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={14} className="text-[var(--accent-primary)] shrink-0" />
              <span className="text-xs text-[var(--text-primary)] truncate">
                Launch dedicated research session: <strong className="text-[var(--accent-primary)]">{searchQuery.trim()}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                onStartResearchSession(searchQuery.trim());
                recordSearch(searchQuery.trim());
                onClose();
              }}
              className="px-3 py-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Start Session</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* 2. Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* A. If no query typed: show Recent Searches & Suggestions */}
          {!q && (
            <div className="space-y-4">
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <History size={13} />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-[11px] text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSearchChange(term)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1.5"
                      >
                        <Search size={11} className="text-[var(--text-muted)]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick suggestions */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--text-muted)]">
                  Suggested Explorations
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Evaluation Harness', desc: 'Custom Python LLM test harness' },
                    { label: 'Multi-Tenant RAG', desc: 'PostgreSQL Row-Level Security' },
                    { label: 'Python Architecture', desc: 'Modular LLM testing and scoring pipeline' },
                    { label: 'Decisions Log', desc: 'Key architecture choices' },
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSearchChange(sug.label)}
                      className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] text-left transition-all group"
                    >
                      <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                        {sug.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {sug.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. When query is typed: show filtered results */}
          {q && (
            <div className="space-y-4">
              {totalResults === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                    <Search size={18} />
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-primary)]">
                    No matching results found for &ldquo;{searchQuery}&rdquo;
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                    No active documents, sources, or artifacts match this term. Deleted test items are completely purged.
                  </p>
                </div>
              ) : (
                <>
                  {/* Category 1: Generated Artifacts */}
                  {matchedArtifacts.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                        Generated Artifacts ({matchedArtifacts.length})
                      </div>
                      <div className="space-y-1">
                        {matchedArtifacts.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => handleSelectArtifact(art.id, art.notebookId)}
                            className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {getArtifactIcon(art.artifactType)}
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] truncate">
                                  {art.title}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 truncate">
                                  <span className="capitalize">{art.artifactType.replace('_', ' ')}</span>
                                  <span>&bull;</span>
                                  <span className="truncate">{art.notebookTitle}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                              <span>Open</span>
                              <ArrowRight size={12} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Sources */}
                  {matchedSources.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                        Ingested Sources ({matchedSources.length})
                      </div>
                      <div className="space-y-1">
                        {matchedSources.map((src) => (
                          <div
                            key={src.id}
                            onClick={() => handleSelectSource(src.notebookId)}
                            className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {getSourceIcon(src.sourceType)}
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] truncate">
                                  {src.title}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] truncate">
                                  Source in {src.notebookTitle}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                              <span>View</span>
                              <ArrowRight size={12} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Notes */}
                  {matchedNotes.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                        Notes ({matchedNotes.length})
                      </div>
                      <div className="space-y-1">
                        {matchedNotes.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => handleSelectNoteItem(note.id)}
                            className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText size={14} className="text-indigo-500 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] truncate">
                                  {note.title}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                                  {note.content.slice(0, 90)}...
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                              <span>Open Note</span>
                              <ArrowRight size={12} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 4: Notebooks */}
                  {matchedNotebooks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                        Notebooks ({matchedNotebooks.length})
                      </div>
                      <div className="space-y-1">
                        {matchedNotebooks.map((nb) => (
                          <div
                            key={nb.id}
                            onClick={() => handleSelectNotebookItem(nb.id)}
                            className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <BookMarked size={14} className="text-[var(--accent-primary)] shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] truncate">
                                  {nb.title}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] truncate">
                                  {nb.sources?.length || 0} sources &bull; {nb.artifacts?.length || 0} artifacts
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                              <span>Switch</span>
                              <ArrowRight size={12} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. Footer */}
        <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] text-[11px] text-[var(--text-muted)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Click any result to navigate</span>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 size={11} />
              Grounded & Synced
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
