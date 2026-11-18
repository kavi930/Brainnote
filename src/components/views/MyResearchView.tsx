'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  BookMarked,
  FolderTree,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  Youtube,
  Globe,
  Mic,
  BookmarkCheck,
  Archive,
  Trash2,
  Edit2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Notebook, NoteSource, AIArtifact, PrimaryNavSection } from '@/types';

interface MyResearchViewProps {
  notebooks: Notebook[];
  activeNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onArchiveSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onTogglePermanent: (id: string) => void;
  onOpenArtifact: (artifactId: string) => void;
  onOpenCapture: () => void;
  onNavigate: (section: PrimaryNavSection) => void;
  onShowToast: (msg: string) => void;
}

export const MyResearchView: React.FC<MyResearchViewProps> = ({
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onCreateSession,
  onRenameSession,
  onArchiveSession,
  onDeleteSession,
  onTogglePermanent,
  onOpenArtifact,
  onOpenCapture,
  onNavigate,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'activity' | 'created' | 'title'>('activity');
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});
  const [sessionToRename, setSessionToRename] = useState<{ id: string; currentTitle: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);

  // Auto-expand active session
  React.useEffect(() => {
    if (activeNotebookId) {
      setExpandedSessionIds((prev) => ({ ...prev, [activeNotebookId]: true }));
    }
  }, [activeNotebookId]);

  const toggleExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSessions = useMemo(() => {
    return notebooks
      .filter((nb) => {
        if (sourceTypeFilter !== 'all') {
          const hasMatchingSource = (nb.sources || []).some((s) => s.sourceType === sourceTypeFilter);
          if (!hasMatchingSource) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = nb.title.toLowerCase().includes(q);
          const descMatch = (nb.description || '').toLowerCase().includes(q);
          const sourceMatch = (nb.sources || []).some((s) => s.title.toLowerCase().includes(q));
          const artifactMatch = (nb.artifacts || []).some((a) => a.title.toLowerCase().includes(q));
          if (!titleMatch && !descMatch && !sourceMatch && !artifactMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notebooks, sourceTypeFilter, searchQuery, sortBy]);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube size={13} className="text-red-500 shrink-0" />;
      case 'web': return <Globe size={13} className="text-blue-500 shrink-0" />;
      case 'pdf':
      case 'document': return <FileText size={13} className="text-rose-500 shrink-0" />;
      case 'audio':
      case 'meeting': return <Mic size={13} className="text-purple-500 shrink-0" />;
      default: return <FileText size={13} className="text-[var(--text-muted)] shrink-0" />;
    }
  };

  const handleStartRename = (id: string, title: string) => {
    setSessionToRename({ id, currentTitle: title });
    setRenameInput(title);
  };

  const handleConfirmRename = () => {
    if (sessionToRename && renameInput.trim()) {
      onRenameSession(sessionToRename.id, renameInput.trim());
      setSessionToRename(null);
      onShowToast('Research session renamed.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-workspace)] overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree size={18} className="text-[var(--accent-primary)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              My Research Sessions
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
              {notebooks.length} Isolated Sessions
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Hierarchically organized research sessions with dedicated sources, conversations, and generated documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreateSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>New Research Session</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search research sessions, sources, or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Source Type Filter */}
          <select
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] font-medium text-xs focus:outline-none"
          >
            <option value="all">All Source Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="youtube">YouTube Videos</option>
            <option value="web">Web URLs</option>
            <option value="audio">Audio / Recordings</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] font-medium text-xs focus:outline-none"
          >
            <option value="activity">Sort: Recent Activity</option>
            <option value="created">Sort: Date Created</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 3. Research Sessions Tree Listing */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)]">
            <BookMarked size={36} className="text-[var(--text-muted)] mx-auto opacity-40" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">No Research Sessions Found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              {searchQuery
                ? `No sessions match "${searchQuery}". Try clearing the search.`
                : 'Start a new research query or upload a source document to generate your first isolated session.'}
            </p>
            <button
              onClick={onCreateSession}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
            >
              Start Research Session
            </button>
          </div>
        ) : (
          filteredSessions.map((session, sIdx) => {
            const isExpanded = expandedSessionIds[session.id] ?? false;
            const isCurrentActive = session.id === activeNotebookId;
            const sources = session.sources || [];
            const artifacts = session.artifacts || [];
            const conversations = session.conversation || [];
            const lastActivity = new Date(session.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className={`rounded-2xl border transition-all ${isCurrentActive
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-panel)] shadow-sm'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-medium)]'
                  }`}
              >
                {/* Session Card Header */}
                <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleExpand(session.id)}
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] mt-0.5 shrink-0"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-primary-light)] text-[var(--accent-primary)] shrink-0">
                          SESSION {String(sIdx + 1).padStart(3, '0')}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                          {session.title}
                        </h3>
                        {session.isArchived && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Active: {lastActivity}
                        </span>
                        <span>&bull;</span>
                        <span>{sources.length} Source{sources.length === 1 ? '' : 's'}</span>
                        <span>&bull;</span>
                        <span>{artifacts.length} Document{artifacts.length === 1 ? '' : 's'}</span>
                        <span>&bull;</span>
                        <span>{conversations.length} Chat Messages</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onSelectNotebook(session.id);
                        onNavigate('ai_chat');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                      title="Open in AI Chat Studio"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      onClick={() => handleStartRename(session.id, session.title)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                      title="Rename Session"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => onArchiveSession(session.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                      title={session.isArchived ? 'Unarchive' : 'Archive Session'}
                    >
                      <Archive size={14} />
                    </button>

                    <button
                      onClick={() => setSessionToDelete({ id: session.id, title: session.title })}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Session Tree Branches (Expanded View) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-[var(--bg-card)]/50 rounded-b-2xl animate-in fade-in">
                    {/* Branch 1: Sources */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} className="text-blue-500" />
                          Evidence Sources ({sources.length})
                        </span>
                        <button
                          onClick={() => {
                            onSelectNotebook(session.id);
                            onOpenCapture();
                          }}
                          className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-0.5"
                        >
                          <Plus size={11} /> Add Source
                        </button>
                      </div>

                      {sources.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic pl-5">
                          No sources uploaded yet. Add a PDF, YouTube URL, or web link to ground this session.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                          {sources.map((src) => (
                            <div
                              key={src.id}
                              className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {getSourceIcon(src.sourceType)}
                                <span className="font-semibold text-[var(--text-primary)] truncate">
                                  {src.title}
                                </span>
                              </div>
                              {src.sourceUrl && (
                                <a
                                  href={src.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] shrink-0"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Branch 2: Generated Documents */}
                    <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[var(--accent-primary)]" />
                          Generated Documents & Artifacts ({artifacts.length})
                        </span>
                        <button
                          onClick={() => {
                            onSelectNotebook(session.id);
                            onNavigate('creation_studio');
                          }}
                          className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-0.5"
                        >
                          <Plus size={11} /> Generate New Document
                        </button>
                      </div>

                      {artifacts.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] italic pl-5">
                          No documents generated yet. Use the Studio to synthesize comprehensive notes, flashcards, or study guides.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
                          {artifacts.map((art) => (
                            <button
                              key={art.id}
                              onClick={() => onOpenArtifact(art.id)}
                              className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] text-left space-y-1.5 transition-all shadow-xs group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                                  {art.artifactType.replace('_', ' ')}
                                </span>
                                <ExternalLink size={11} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
                              </div>
                              <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1">
                                {art.title}
                              </h4>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {new Date(art.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Branch 3: AI Conversations Summary */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <MessageSquare size={13} className="text-purple-500" />
                        <span>Conversational Threads: {conversations.length} grounded interactions</span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectNotebook(session.id);
                          onNavigate('ai_chat');
                        }}
                        className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                      >
                        Resume Chat &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Rename Modal */}
      {sessionToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Rename Research Session</h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSessionToRename(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle size={16} />
              <span>Delete Research Session</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete <strong>{sessionToDelete.title}</strong>? All associated notes, sources, and artifacts strictly linked to this session will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                  onShowToast(`Deleted research session "${sessionToDelete.title}"`);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

