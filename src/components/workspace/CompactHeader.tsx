'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Plus, 
  Search, 
  Settings as SettingsIcon, 
  Crown, 
  BookMarked, 
  Chrome, 
  Clock,
  Layers,
  Check,
  Share2
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Notebook } from '@/types';

interface CompactHeaderProps {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onSelectNotebook: (notebookId: string) => void;
  onCreateNotebook: () => void;
  onOpenBilling: () => void;
  onOpenSettings: () => void;
  onOpenExtension: () => void;
  onOpenShare: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  trialDaysRemaining?: number;
  planTier?: string;
  userName?: string;
  tenantName?: string;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  notebooks,
  activeNotebook,
  onSelectNotebook,
  onCreateNotebook,
  onOpenBilling,
  onOpenSettings,
  onOpenExtension,
  onOpenShare,
  searchQuery,
  onSearchChange,
  trialDaysRemaining = 7,
  planTier = 'trial',
  userName = 'Workspace Owner',
  tenantName = 'My Knowledge Workspace',
}) => {
  const [isNotebookDropdownOpen, setIsNotebookDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-4 flex items-center justify-between gap-3 sticky top-0 z-30 select-none">
      {/* LEFT: Brand & Notebook Selector */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-sm">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <span className="font-bold text-base tracking-tight text-[var(--text-primary)] hidden sm:inline-block">
            Brainnote<span className="text-[var(--accent-primary)]">.ai</span>
          </span>
        </div>

        {/* Active Notebook Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotebookDropdownOpen(!isNotebookDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-left transition-all border border-transparent hover:border-[var(--border-subtle)] max-w-[200px] sm:max-w-[280px]"
          >
            <BookMarked size={16} className="text-[var(--accent-primary)] shrink-0" />
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {activeNotebook?.title || 'Select Notebook'}
            </span>
            <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" />
          </button>

          {/* Notebooks Dropdown Menu */}
          {isNotebookDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotebookDropdownOpen(false)} 
              />
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    My Notebooks ({notebooks.length})
                  </span>
                  <button
                    onClick={() => {
                      setIsNotebookDropdownOpen(false);
                      onCreateNotebook();
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    <Plus size={13} />
                    New
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {notebooks.map((nb) => {
                    const isSelected = activeNotebook?.id === nb.id;
                    return (
                      <button
                        key={nb.id}
                        onClick={() => {
                          onSelectNotebook(nb.id);
                          setIsNotebookDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          isSelected
                            ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-semibold'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BookMarked size={14} className="shrink-0" />
                          <span className="truncate">{nb.title}</span>
                        </div>
                        {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 mt-1 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => {
                      setIsNotebookDropdownOpen(false);
                      onCreateNotebook();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-all border border-[var(--border-subtle)]"
                  >
                    <Plus size={14} />
                    Create New Notebook
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CENTRE: Global Search Input */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notebook sources, notes & citations..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-active)] transition-all"
          />
        </div>
      </div>

      {/* RIGHT: Actions, Subscriptions, Theme, User */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Share Button */}
        <button
          onClick={onOpenShare}
          title="Share notebook"
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-all hidden sm:flex items-center gap-1.5 text-xs font-medium"
        >
          <Share2 size={14} />
          <span className="hidden lg:inline">Share</span>
        </button>

        {/* Extension Quick Launcher */}
        <button
          onClick={onOpenExtension}
          title="Browser Extension"
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-all hidden sm:flex items-center gap-1.5 text-xs font-medium"
        >
          <Chrome size={14} className="text-[var(--accent-primary)]" />
          <span className="hidden lg:inline">Extension</span>
        </button>

        {/* Subscription Status Pill */}
        <button
          onClick={onOpenBilling}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
            planTier === 'pro' || planTier === 'team'
              ? 'badge-pro'
              : 'badge-trial'
          }`}
          title="Manage subscription"
        >
          {planTier === 'trial' ? (
            <>
              <Clock size={12} className="pulse" />
              <span>{trialDaysRemaining}d trial</span>
            </>
          ) : (
            <>
              <Crown size={12} />
              <span className="capitalize">{planTier} Plan</span>
            </>
          )}
        </button>

        {/* Theme Switcher */}
        <ThemeToggle compact />

        {/* User Profile / Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-8 h-8 rounded-full bg-[var(--accent-primary-light)] text-[var(--accent-primary)] border border-[var(--border-subtle)] font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity"
            title={`${userName} (${tenantName})`}
          >
            {userName.slice(0, 2).toUpperCase()}
          </button>

          {isUserMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsUserMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 text-xs">
                <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                  <p className="font-bold text-sm text-[var(--text-primary)] truncate">{userName}</p>
                  <p className="text-[var(--text-muted)] truncate">{tenantName}</p>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <SettingsIcon size={14} className="text-[var(--text-muted)]" />
                    <span>Workspace Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenBilling();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <Crown size={14} className="text-[var(--accent-amber)]" />
                    <span>Billing & Subscription</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenExtension();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <Chrome size={14} className="text-[var(--accent-primary)]" />
                    <span>Chrome / Edge Extension</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[var(--border-subtle)] px-3 py-1.5 text-[11px] text-[var(--text-muted)]">
                  Brainnote AI v2.0 • 3-Panel
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
