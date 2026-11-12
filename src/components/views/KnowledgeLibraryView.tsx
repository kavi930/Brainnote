'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  Youtube, 
  Globe, 
  FileText, 
  Mic, 
  Presentation, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ExternalLink, 
  RotateCw, 
  X,
  BookMarked,
  Layers,
  Sparkles
} from 'lucide-react';
import { NoteSource, SourceType, Notebook } from '@/types';

interface KnowledgeLibraryViewProps {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onSelectNotebook: (id: string) => void;
  selectedSourceIds: string[];
  onToggleSource: (sourceId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenCapture: (tab?: SourceType) => void;
  onDeleteSource: (sourceId: string) => void;
}

export const KnowledgeLibraryView: React.FC<KnowledgeLibraryViewProps> = ({
  notebooks,
  activeNotebook,
  onSelectNotebook,
  selectedSourceIds,
  onToggleSource,
  onSelectAll,
  onDeselectAll,
  onOpenCapture,
  onDeleteSource,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState<string>('all');
  const [previewSource, setPreviewSource] = useState<NoteSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<NoteSource | null>(null);

  // Collect all sources with their notebook metadata
  const allSources = useMemo(() => {
    const list: (NoteSource & { notebookTitle: string; notebookId: string })[] = [];
    notebooks.forEach((nb) => {
      (nb.sources || []).forEach((src) => {
        list.push({ ...src, notebookTitle: nb.title, notebookId: nb.id });
      });
    });
    return list;
  }, [notebooks]);

  // Filter sources
  const filteredSources = useMemo(() => {
    return allSources.filter((src) => {
      // 1. Notebook filter
      if (selectedNotebookFilter !== 'all' && src.notebookId !== selectedNotebookFilter) {
        return false;
      }
      // 2. Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'document' && !['pdf', 'document', 'presentation'].includes(src.sourceType)) return false;
        if (typeFilter === 'media' && !['audio', 'video', 'meeting', 'youtube'].includes(src.sourceType)) return false;
        if (typeFilter === 'web' && src.sourceType !== 'web') return false;
        if (typeFilter === 'youtube' && src.sourceType !== 'youtube') return false;
      }
      // 3. Status filter
      if (statusFilter !== 'all' && src.processingStatus !== statusFilter) {
        return false;
      }
      // 4. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = src.title.toLowerCase().includes(q);
        const matchUrl = src.sourceUrl?.toLowerCase().includes(q);
        const matchTranscript = src.rawTranscript?.toLowerCase().includes(q);
        if (!matchTitle && !matchUrl && !matchTranscript) return false;
      }
      return true;
    });
  }, [allSources, selectedNotebookFilter, typeFilter, statusFilter, searchQuery]);

  const allFilteredSelected = filteredSources.length > 0 && filteredSources.every((s) => selectedSourceIds.includes(s.id));

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube size={16} className="text-red-500 shrink-0" />;
      case 'web':
        return <Globe size={16} className="text-blue-500 shrink-0" />;
      case 'pdf':
      case 'document':
        return <FileText size={16} className="text-rose-500 shrink-0" />;
      case 'presentation':
        return <Presentation size={16} className="text-orange-500 shrink-0" />;
      case 'audio':
      case 'meeting':
        return <Mic size={16} className="text-purple-500 shrink-0" />;
      default:
        return <FileText size={16} className="text-[var(--text-muted)] shrink-0" />;
    }
  };

  const getStatusBadge = (status: NoteSource['processingStatus']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={11} />
            Ready
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock size={11} className="animate-spin" />
            Indexing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertCircle size={11} />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Knowledge Library
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your multi-source corpus. Selected sources are included in grounded AI reasoning and Studio synthesis.
          </p>
        </div>

        <button
          onClick={() => onOpenCapture('youtube')}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus size={15} />
          <span>Add New Source</span>
        </button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by title, URL or transcript excerpt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Notebook Filter */}
          <select
            value={selectedNotebookFilter}
            onChange={(e) => setSelectedNotebookFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all">All Notebooks ({allSources.length})</option>
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.title} ({nb.sources?.length || 0})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all">All Formats</option>
            <option value="document">Documents (PDF / PPTX / DOCX)</option>
            <option value="youtube">YouTube Videos</option>
            <option value="web">Websites & Articles</option>
            <option value="media">Audio & Meetings</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Ready</option>
            <option value="processing">Indexing</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Bulk Selection Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <button
              onClick={allFilteredSelected ? onDeselectAll : onSelectAll}
              className="flex items-center gap-1.5 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {allFilteredSelected ? (
                <CheckSquare size={14} className="text-[var(--accent-primary)]" />
              ) : (
                <Square size={14} />
              )}
              <span>{allFilteredSelected ? 'Deselect All' : 'Select All Filtered'}</span>
            </button>
            <span>&bull;</span>
            <span>
              {selectedSourceIds.length} of {allSources.length} sources grounded in AI
            </span>
          </div>

          <span className="text-[11px]">
            Showing {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* 3. Sources Table / Grid */}
      {filteredSources.length > 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {filteredSources.map((source) => {
              const isSelected = selectedSourceIds.includes(source.id);
              return (
                <div
                  key={source.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-primary-light)]/20 hover:bg-[var(--accent-primary-light)]/30'
                      : 'hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {/* Left: Checkbox & Title Details */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleSource(source.id)}
                      className="mt-0.5 sm:mt-0 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors shrink-0"
                      title={isSelected ? 'Remove from Grounded Context' : 'Include in Grounded Context'}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-[var(--accent-primary)]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    <div className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] shrink-0">
                      {getSourceIcon(source.sourceType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-[var(--text-primary)] truncate">
                          {source.title}
                        </h4>
                        {getStatusBadge(source.processingStatus)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                          <BookMarked size={12} className="text-[var(--accent-primary)]" />
                          {source.notebookTitle}
                        </span>
                        <span>&bull;</span>
                        <span className="capitalize">{source.sourceType}</span>
                        {source.sourceUrl && (
                          <>
                            <span>&bull;</span>
                            <a
                              href={source.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--accent-primary)] hover:underline truncate max-w-[200px] flex items-center gap-0.5"
                            >
                              <span>{source.sourceUrl.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink size={10} />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setPreviewSource(source)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-subtle)] transition-colors"
                      title="Inspect Extracted Content & Citations"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      onClick={() => setSourceToDelete(source)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Source"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-panel)]">
          <Layers size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
          <h3 className="font-bold text-sm text-[var(--text-primary)] mb-1">
            No sources matched your filters
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-4">
            Try adjusting your query or ingest new research sources, documents, or video links.
          </p>
          <button
            onClick={() => onOpenCapture('youtube')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-sm"
          >
            <Plus size={14} />
            <span>Ingest Source</span>
          </button>
        </div>
      )}

      {/* Source Preview Modal */}
      {previewSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel-header)]">
              <div className="flex items-center gap-2 min-w-0">
                {getSourceIcon(previewSource.sourceType)}
                <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {previewSource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewSource(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[11px]">
                <div>
                  <span className="text-[var(--text-muted)] block">Format</span>
                  <span className="font-semibold text-[var(--text-primary)] uppercase">{previewSource.sourceType}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{previewSource.processingStatus}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block">Date Ingested</span>
                  <span className="font-semibold text-[var(--text-primary)]">{new Date(previewSource.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Extracted Transcript / Content
                </h4>
                <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap text-[var(--text-secondary)]">
                  {previewSource.rawTranscript || 'No raw transcript available.'}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                onClick={() => setPreviewSource(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-5">
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-2">
              Remove source from workspace?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Are you sure you want to remove <strong>{sourceToDelete.title}</strong>? It will no longer be available for grounded AI reasoning.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSourceToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSource(sourceToDelete.id);
                  setSourceToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

