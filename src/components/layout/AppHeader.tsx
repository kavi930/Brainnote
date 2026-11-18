'use client';

import React from 'react';
import {
  Menu,
  Search,
  Share2,
  Chrome,
  Crown,
  Plus,
  BookMarked,
  Sparkles,
  PenSquare
} from 'lucide-react';
import { Notebook, PrimaryNavSection } from '@/types';

interface AppHeaderProps {
  currentSection: PrimaryNavSection;
  activeNotebook: Notebook | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileSidebar: () => void;
  onOpenCapture: () => void;
  onOpenQuickNote?: () => void;
  onOpenShare: () => void;
  onOpenExtension: () => void;
  onOpenBilling: () => void;
  planTier: string;
  onOpenSearchModal?: () => void;
}

const SECTION_TITLES: Record<PrimaryNavSection, { title: string; subtitle: string }> = {
  home: { title: 'Workspace Home', subtitle: 'Overview, recent sources & learning activity' },
  my_research: { title: 'My Research', subtitle: 'Isolated research sessions, topic investigations & documents' },
  library: { title: 'Knowledge Library', subtitle: 'Search, manage and ground your ingested knowledge' },
  my_notes: { title: 'My Notes', subtitle: 'Distraction-free Markdown notepad with AI writing assistance' },
  ai_chat: { title: 'AI Chat Studio', subtitle: 'Conversational reasoning strictly grounded in selected sources' },
  agent_studio: { title: 'Agent Studio', subtitle: 'Multi-source selection & agentic reasoning canvas' },
  creation_studio: { title: 'AI Creation Studio', subtitle: 'Synthesize summaries, study guides, and visual knowledge' },
  learning_review: { title: 'Learning & Active Recall', subtitle: 'Active recall flashcards, practice quizzes, and interview prep' },
  research_visualization: { title: 'Research & Visualization', subtitle: 'Concept maps, timelines, and multi-source matrices' },
  meetings: { title: 'Meeting Intelligence', subtitle: 'Audio recordings, speaker notes, and meeting decisions' },
  profile: { title: 'User Profile', subtitle: 'Manage your profile and authentication credentials' },
  settings: { title: 'Workspace Settings', subtitle: 'Manage billing, team members, and preferences' },
  retention: { title: 'Storage & Retention', subtitle: 'Data retention policies, automated cleanup, and trash recovery' },
  web_sources: { title: 'Web Sources', subtitle: 'Web clippings and research articles' },
  documents: { title: 'Documents', subtitle: 'PDFs, PowerPoint slides and docs' },
  videos: { title: 'Video Intelligence', subtitle: 'YouTube and video lectures' },
  study_tools: { title: 'Study Hub', subtitle: 'Active recall and revision materials' },
  interview_prep: { title: 'Interview Preparation', subtitle: 'Technical interview Q&A studio' },
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentSection,
  activeNotebook,
  searchQuery,
  onSearchChange,
  onToggleMobileSidebar,
  onOpenCapture,
  onOpenQuickNote,
  onOpenShare,
  onOpenExtension,
  onOpenBilling,
  planTier,
  onOpenSearchModal,
}) => {
  const sectionMeta = SECTION_TITLES[currentSection] || SECTION_TITLES.home;

  return (
    <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-4 flex items-center justify-between gap-3 sticky top-0 z-20 shrink-0 select-none">
      {/* LEFT: Mobile Menu + Section Title & Active Notebook */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
              {sectionMeta.title}
            </h1>
            {activeNotebook && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] truncate max-w-[200px]">
                <BookMarked size={12} className="text-[var(--accent-primary)] shrink-0" />
                <span className="truncate">{activeNotebook.title}</span>
              </span>
            )}
          </div>
          <p className="hidden md:block text-[11px] text-[var(--text-muted)] truncate">
            {sectionMeta.subtitle}
          </p>
        </div>
      </div>

      {/* RIGHT: Search Bar & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Search Trigger Button */}
        <button
          onClick={onOpenSearchModal}
          className="sm:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]"
          title="Search Workspace"
        >
          <Search size={15} />
        </button>

        {/* Global Search Input (Desktop) */}
        <div
          onClick={onOpenSearchModal}
          className="relative hidden sm:flex items-center w-44 md:w-60 lg:w-72 cursor-pointer group"
        >
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] pointer-events-none transition-colors"
          />
          <input
            type="text"
            readOnly
            placeholder="Search sources, notes, artifacts..."
            value={searchQuery}
            className="w-full pl-8 pr-12 py-1.5 rounded-lg text-xs border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] group-hover:border-[var(--accent-primary)] cursor-pointer transition-all placeholder:text-[var(--text-faint)]"
          />
          <span className="absolute right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
            ⌘K
          </span>
        </div>

        {/* Quick Note Action */}
        {onOpenQuickNote && (
          <button
            onClick={onOpenQuickNote}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-all shadow-xs cursor-pointer shrink-0"
            title="Create a Quick Note"
          >
            <PenSquare size={13} />
            <span className="hidden sm:inline">Quick Note</span>
          </button>
        )}

        {/* Chrome Extension Shortcut */}
        <button
          onClick={onOpenExtension}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
          title="Browser Extension Companion"
        >
          <Chrome size={14} className="text-blue-500" />
          <span>Extension</span>
        </button>

        {/* Share Notebook Action */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors"
          title="Share Active Notebook"
        >
          <Share2 size={14} />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Quick Capture (Mobile/Header) */}
        <button
          onClick={onOpenCapture}
          className="flex sm:hidden items-center justify-center p-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-all"
          title="Capture Source"
        >
          <Plus size={16} />
        </button>

        {/* Plan Tier Pill */}
        <button
          onClick={onOpenBilling}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:opacity-90 transition-opacity"
        >
          <Crown size={13} />
          <span className="capitalize">{planTier}</span>
        </button>
      </div>
    </header>
  );
};

