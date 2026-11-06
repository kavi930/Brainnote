'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckSquare, 
  Square, 
  Trash2, 
  Eye, 
  ExternalLink, 
  Youtube, 
  Globe, 
  FileText, 
  Mic, 
  Video, 
  Users, 
  Presentation, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  X,
  FileCode,
  Layers,
  ChevronRight
} from 'lucide-react';
import { NoteSource, SourceType } from '@/types';

interface SourcesPanelProps {
  sources: NoteSource[];
  selectedSourceIds: string[];
  onToggleSource: (sourceId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenAddSource: () => void;
  onDeleteSource: (sourceId: string) => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  sources,
  selectedSourceIds,
  onToggleSource,
  onSelectAll,
  onDeselectAll,
  onOpenAddSource,
  onDeleteSource,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewSource, setPreviewSource] = useState<NoteSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<NoteSource | null>(null);

  // Filter sources by search query
  const filteredSources = sources.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.sourceUrl && s.sourceUrl.toLowerCase().includes(q));
  });

  const allSelected = filteredSources.length > 0 && filteredSources.every((s) => selectedSourceIds.includes(s.id));

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube size={15} className="text-red-500 shrink-0" />;
      case 'web':
        return <Globe size={15} className="text-[var(--accent-cyan)] shrink-0" />;
      case 'pdf':
        return <FileText size={15} className="text-rose-500 shrink-0" />;
      case 'audio':
        return <Mic size={15} className="text-[var(--accent-primary)] shrink-0" />;
      case 'video':
        return <Video size={15} className="text-amber-500 shrink-0" />;
      case 'meeting':
        return <Users size={15} className="text-emerald-500 shrink-0" />;
      case 'presentation':
        return <Presentation size={15} className="text-orange-500 shrink-0" />;
      default:
        return <FileCode size={15} className="text-[var(--text-muted)] shrink-0" />;
    }
  };

  const getStatusBadge = (status: NoteSource['processingStatus'], errorMsg?: string) => {
    if (status === 'completed') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={12} />
          Ready
        </span>
      );
    }
    if (status === 'processing' || status === 'pending') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          <Clock size={12} className="animate-spin" />
          Processing
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400" title={errorMsg}>
          <AlertCircle size={12} />
          Failed
        </span>
      );
    }
    return null;
  };

  return (
    <aside className="w-full md:w-[310px] lg:w-[320px] flex-shrink-0 flex flex-col h-full bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] overflow-hidden">
      {/* Header & Primary Action */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-3 shrink-0 bg-[var(--bg-panel-header)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Sources</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {selectedSourceIds.length}/{sources.length} selected
            </span>
          </div>
        </div>

        {/* Primary Action: + Add Sources */}
        <button
          onClick={onOpenAddSource}
          className="w-full btn btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-2 rounded-lg shadow-sm"
        >
          <Plus size={15} />
          Add Sources
        </button>

        {/* Search & Select All Controls */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-active)]"
            />
          </div>

          {sources.length > 0 && (
            <div className="flex items-center justify-between text-xs px-1 text-[var(--text-muted)]">
              <button
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="flex items-center gap-1.5 hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                {allSelected ? (
                  <CheckSquare size={13} className="text-[var(--accent-primary)]" />
                ) : (
                  <Square size={13} />
                )}
                <span>{allSelected ? 'Deselect All' : 'Select All Sources'}</span>
              </button>
              <span className="text-[11px]">Grounding Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Source Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {sources.length === 0 ? (
          <div className="p-6 text-center space-y-3 my-auto">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <Layers size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">No sources yet</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Add YouTube videos, web URLs, PDFs, DOCX, or audio to start asking grounded questions.
              </p>
            </div>
            <button
              onClick={onOpenAddSource}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
            >
              <Plus size={13} />
              Add your first source
            </button>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)]">
            No sources matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredSources.map((source) => {
            const isSelected = selectedSourceIds.includes(source.id);
            return (
              <div
                key={source.id}
                className={`group relative p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[var(--bg-panel)] border-[var(--accent-primary)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-subtle)] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Selective Grounding Checkbox */}
                  <button
                    onClick={() => onToggleSource(source.id)}
                    className="mt-0.5 text-[var(--accent-primary)] hover:opacity-80 transition-opacity"
                    title={isSelected ? 'Source used for AI grounding (Click to exclude)' : 'Source excluded (Click to include)'}
                  >
                    {isSelected ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} className="text-[var(--text-muted)]" />
                    )}
                  </button>

                  {/* Icon & Source Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewSource(source)}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {getSourceIcon(source.sourceType)}
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {source.sourceType}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
                      {source.title}
                    </p>

                    {source.sourceUrl && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 hover:text-[var(--accent-primary)]">
                        {source.sourceUrl.replace(/^https?:\/\//, '')}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                      <div>{getStatusBadge(source.processingStatus, source.errorMessage)}</div>
                      {source.durationSeconds ? (
                        <span>{Math.round(source.durationSeconds / 60)} min</span>
                      ) : source.fileSizeBytes ? (
                        <span>{(source.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions: Preview & Delete */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewSource(source)}
                      className="p-1 rounded hover:bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title="Preview extracted content"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => setSourceToDelete(source)}
                      className="p-1 rounded hover:bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-rose-500"
                      title="Remove source"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-xl max-w-sm w-full p-4 space-y-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Remove Source?</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to remove &quot;{sourceToDelete.title}&quot; from this notebook? This will exclude its citations from future retrieval.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSourceToDelete(null)}
                className="btn btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSource(sourceToDelete.id);
                  setSourceToDelete(null);
                }}
                className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Preview Drawer */}
      {previewSource && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-panel)] h-full border-l border-[var(--border-subtle)] shadow-2xl flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                {getSourceIcon(previewSource.sourceType)}
                <h3 className="font-bold text-sm text-[var(--text-primary)] truncate max-w-[280px]">
                  {previewSource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewSource(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-input)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
              {previewSource.sourceUrl && (
                <div className="p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="truncate text-[var(--text-muted)]">{previewSource.sourceUrl}</span>
                  <a
                    href={previewSource.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Visit</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Extracted Content / Transcript
                </span>
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] whitespace-pre-wrap font-sans text-xs max-h-96 overflow-y-auto">
                  {previewSource.rawTranscript || 'No raw transcript available for this source.'}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                onClick={() => setPreviewSource(null)}
                className="btn btn-secondary text-xs px-4 py-1.5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
