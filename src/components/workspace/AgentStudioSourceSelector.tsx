'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Youtube,
  Globe,
  Mic,
  FileSpreadsheet,
  FileCode,
  Search,
  CheckSquare,
  Square,
  X,
  Plus,
  BookMarked,
  ChevronDown,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { NoteSource, SourceType, Notebook } from '@/types';

export type SourceCategoryFilter =
  | 'all'
  | 'pdf_doc'
  | 'word'
  | 'excel'
  | 'youtube'
  | 'web'
  | 'notebook'
  | 'indexed';

interface AgentStudioSourceSelectorProps {
  sources: NoteSource[];
  selectedSourceIds: string[];
  notebooks: Notebook[];
  activeNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onToggleSource: (sourceId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenAddSource: () => void;
  enableWebResearch: boolean;
  onToggleWebResearch: (enabled: boolean) => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AgentStudioSourceSelector: React.FC<AgentStudioSourceSelectorProps> = ({
  sources,
  selectedSourceIds,
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onToggleSource,
  onSelectAll,
  onDeselectAll,
  onOpenAddSource,
  enableWebResearch,
  onToggleWebResearch,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SourceCategoryFilter>('all');
  const [isNotebookDropdownOpen, setIsNotebookDropdownOpen] = useState(false);

  // Classify source into granular requested categories
  const getSourceCategory = (src: NoteSource): SourceCategoryFilter => {
    const titleLower = src.title.toLowerCase();
    const urlLower = (src.sourceUrl || '').toLowerCase();

    if (src.sourceType === 'youtube' || urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    }
    if (titleLower.endsWith('.docx') || titleLower.endsWith('.doc')) {
      return 'word';
    }
    if (titleLower.endsWith('.xlsx') || titleLower.endsWith('.xls') || titleLower.endsWith('.csv')) {
      return 'excel';
    }
    if (src.sourceType === 'pdf' || titleLower.endsWith('.pdf')) {
      return 'pdf_doc';
    }
    if (src.sourceType === 'web' || urlLower.startsWith('http')) {
      return 'web';
    }
    if (src.sourceType === 'document' || src.sourceType === 'presentation') {
      return 'pdf_doc';
    }
    return 'indexed';
  };

  const getSourceIcon = (src: NoteSource) => {
    const cat = getSourceCategory(src);
    switch (cat) {
      case 'youtube':
        return <Youtube size={14} className="text-red-500 shrink-0" />;
      case 'word':
        return <FileText size={14} className="text-blue-600 shrink-0" />;
      case 'excel':
        return <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />;
      case 'pdf_doc':
        return <FileText size={14} className="text-rose-500 shrink-0" />;
      case 'web':
        return <Globe size={14} className="text-sky-500 shrink-0" />;
      default:
        return <Layers size={14} className="text-purple-500 shrink-0" />;
    }
  };

  // Filter sources by search query & category
  const filteredSources = useMemo(() => {
    return sources.filter((src) => {
      if (categoryFilter !== 'all') {
        const cat = getSourceCategory(src);
        if (cat !== categoryFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          src.title.toLowerCase().includes(q) ||
          (src.sourceUrl && src.sourceUrl.toLowerCase().includes(q)) ||
          src.sourceType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sources, categoryFilter, searchQuery]);

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId) || notebooks[0] || null;
  const selectedSources = useMemo(() => {
    return sources.filter((s) => selectedSourceIds.includes(s.id));
  }, [sources, selectedSourceIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<SourceCategoryFilter, number> = {
      all: sources.length,
      pdf_doc: 0,
      word: 0,
      excel: 0,
      youtube: 0,
      web: 0,
      notebook: 0,
      indexed: 0,
    };
    sources.forEach((s) => {
      const cat = getSourceCategory(s);
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [sources]);

  return (
    <div
      className={`flex flex-col h-full bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] select-none transition-all ${className}`}
    >
      {/* 1. Header & Notebook Switcher */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
            <Layers size={14} className="text-[var(--accent-primary)]" />
            <span>Agent Source Selector</span>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
            {selectedSourceIds.length} / {sources.length} Grounded
          </span>
        </div>

        {/* Notebook Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotebookDropdownOpen(!isNotebookDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-xs text-left transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <BookMarked size={13} className="text-[var(--accent-primary)] shrink-0" />
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {activeNotebook?.title || 'Active Notebook'}
              </span>
            </div>
            <ChevronDown size={13} className="text-[var(--text-muted)] shrink-0" />
          </button>

          {isNotebookDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotebookDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-2xl z-50 p-1.5 max-h-56 overflow-y-auto animate-in fade-in">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                  Switch Research Notebook
                </div>
                {notebooks.map((nb) => (
                  <button
                    key={nb.id}
                    onClick={() => {
                      onSelectNotebook(nb.id);
                      setIsNotebookDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                      nb.id === activeNotebookId
                        ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <span className="truncate">{nb.title}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-2 shrink-0">
                      {nb.sources?.length || 0} src
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Selected Sources Removable Chips Bar */}
      {selectedSources.length > 0 && (
        <div className="px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-between">
            <span>Selected Grounding Context ({selectedSources.length})</span>
            <button
              onClick={onDeselectAll}
              className="text-[10px] font-semibold text-rose-500 hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {selectedSources.map((src) => (
              <span
                key={src.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--accent-primary-light)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 truncate max-w-[200px]"
              >
                {getSourceIcon(src)}
                <span className="truncate">{src.title}</span>
                <button
                  onClick={() => onToggleSource(src.id)}
                  className="hover:text-rose-600 ml-0.5 p-0.5 rounded-full"
                  title="Remove source"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Search and Category Filter Tabs */}
      <div className="p-3 space-y-2 border-b border-[var(--border-subtle)] shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search sources by title or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              categoryFilter === 'all'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All ({categoryCounts.all})
          </button>
          <button
            onClick={() => setCategoryFilter('pdf_doc')}
            className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              categoryFilter === 'pdf_doc'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            PDF & Docs ({categoryCounts.pdf_doc})
          </button>
          <button
            onClick={() => setCategoryFilter('youtube')}
            className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              categoryFilter === 'youtube'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            YouTube ({categoryCounts.youtube})
          </button>
          <button
            onClick={() => setCategoryFilter('web')}
            className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              categoryFilter === 'web'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Web ({categoryCounts.web})
          </button>
          <button
            onClick={() => setCategoryFilter('word')}
            className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              categoryFilter === 'word'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Word ({categoryCounts.word})
          </button>
          <button
            onClick={() => setCategoryFilter('excel')}
            className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
              categoryFilter === 'excel'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Excel ({categoryCounts.excel})
          </button>
        </div>

        {/* Select All / Deselect All Controls */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-[11px] font-bold text-[var(--accent-primary)] hover:underline"
            >
              Select All
            </button>
            <span className="text-[var(--text-muted)]">&bull;</span>
            <button
              onClick={onDeselectAll}
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:underline"
            >
              Deselect All
            </button>
          </div>

          <button
            onClick={onOpenAddSource}
            className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent-primary)] hover:underline"
          >
            <Plus size={12} />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      {/* 4. Sources List Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sources.length === 0 ? (
          /* Empty State Requirement: Two Clear Actions */
          <div className="p-6 text-center space-y-3 my-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center mx-auto">
              <Layers size={22} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[var(--text-primary)]">No Sources in This Notebook</h4>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto mt-1 leading-relaxed">
                Agent Studio requires evidence sources to synthesize grounded answers with verifiable citations.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={onOpenAddSource}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                <span>Add a New Source</span>
              </button>
              <button
                onClick={() => {
                  const anotherWithSources = notebooks.find((n) => (n.sources || []).length > 0);
                  if (anotherWithSources) {
                    onSelectNotebook(anotherWithSources.id);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-all"
              >
                Select from Another Notebook
              </button>
            </div>
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-muted)]">
            No sources match the filter &ldquo;{searchQuery || categoryFilter}&rdquo;.
          </div>
        ) : (
          filteredSources.map((src) => {
            const isSelected = selectedSourceIds.includes(src.id);
            return (
              <div
                key={src.id}
                onClick={() => onToggleSource(src.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-[var(--accent-primary-light)]/40 border-[var(--accent-primary)]/40 shadow-xs'
                    : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {isSelected ? (
                    <CheckSquare size={16} className="text-[var(--accent-primary)]" />
                  ) : (
                    <Square size={16} className="text-[var(--text-muted)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {getSourceIcon(src)}
                    <h5 className="font-semibold text-xs text-[var(--text-primary)] truncate leading-tight">
                      {src.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <span className="capitalize">{src.sourceType}</span>
                    <span>&bull;</span>
                    {src.processingStatus === 'completed' ? (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 size={10} />
                        Indexed
                      </span>
                    ) : src.processingStatus === 'processing' ? (
                      <span className="flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-medium animate-pulse">
                        <Clock size={10} />
                        Parsing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-rose-500 font-medium">
                        <AlertCircle size={10} />
                        Failed
                      </span>
                    )}

                    {src.fileSizeBytes && (
                      <>
                        <span>&bull;</span>
                        <span>{(src.fileSizeBytes / 1024).toFixed(0)} KB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Grounding Rules & Web Research Toggle Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-header)] space-y-2 shrink-0">
        <label className="flex items-center justify-between text-xs cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors">
          <div className="flex items-center gap-2">
            <Globe size={14} className={enableWebResearch ? 'text-sky-500' : 'text-[var(--text-muted)]'} />
            <span className="font-semibold text-[var(--text-primary)]">External Web Research</span>
          </div>
          <input
            type="checkbox"
            checked={enableWebResearch}
            onChange={(e) => onToggleWebResearch(e.target.checked)}
            className="w-4 h-4 rounded text-[var(--accent-primary)] accent-[var(--accent-primary)] cursor-pointer"
          />
        </label>

        {/* Strict Grounding Notice */}
        {selectedSourceIds.length === 0 && !enableWebResearch ? (
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
            <AlertCircle size={13} className="shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Zero sources selected:</strong> Answers require selected sources or external research enabled.
            </span>
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-200 flex items-start gap-1.5">
            <Sparkles size={13} className="shrink-0 text-emerald-600 mt-0.5" />
            <span>
              <strong>Strict Grounding Enforced:</strong> Responses will cite {selectedSourceIds.length} source{selectedSourceIds.length === 1 ? '' : 's'}.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

