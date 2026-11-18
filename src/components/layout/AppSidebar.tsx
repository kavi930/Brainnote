'use client';

import React from 'react';
import {
  Home,
  BookOpen,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Mic,
  Settings as SettingsIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Crown,
  ChevronDown,
  FileText,
  Bot,
  Network,
  User as UserIcon,
  HardDrive,
  LogOut,
  Compass,
  Layers
} from 'lucide-react';
import { PrimaryNavSection, Notebook } from '@/types';
import { ThemeToggle } from '../workspace/ThemeToggle';

interface AppSidebarProps {
  currentSection: PrimaryNavSection;
  onSelectSection: (section: PrimaryNavSection) => void;
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: () => void;
  onOpenCapture: () => void;
  onOpenSettings: () => void;
  onOpenBilling: () => void;
  onLogout?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalSourcesCount: number;
  notesCount?: number;
  trialDaysRemaining: number;
  planTier: string;
  userName: string;
  tenantName: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentSection,
  onSelectSection,
  notebooks,
  activeNotebook,
  onSelectNotebook,
  onCreateNotebook,
  onOpenCapture,
  onOpenSettings,
  onOpenBilling,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  totalSourcesCount,
  notesCount,
  trialDaysRemaining,
  planTier,
  userName,
  tenantName,
}) => {
  const [isNotebookMenuOpen, setIsNotebookMenuOpen] = React.useState(false);

  // Group 1: WORKSPACE
  const workspaceItems: { section: PrimaryNavSection; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { section: 'home', label: 'Home', icon: <Home size={16} /> },
    { section: 'my_research', label: 'My Research', icon: <Compass size={16} /> },
    { section: 'my_notes', label: 'My Notes', icon: <FileText size={16} />, badge: notesCount },
    { section: 'library', label: 'Research Library', icon: <BookOpen size={16} />, badge: totalSourcesCount },
    { section: 'ai_chat', label: 'AI Chat Studio', icon: <MessageSquare size={16} /> },
    { section: 'agent_studio', label: 'Agent Studio', icon: <Bot size={16} /> },
  ];

  // Group 2: AI TOOLS
  const aiToolItems: { section: PrimaryNavSection; label: string; icon: React.ReactNode }[] = [
    { section: 'creation_studio', label: 'AI Creation Studio', icon: <Sparkles size={16} /> },
    { section: 'learning_review', label: 'Learning & Active Recall', icon: <GraduationCap size={16} /> },
    { section: 'research_visualization', label: 'Research & Visualization', icon: <Network size={16} /> },
    { section: 'meetings', label: 'Meeting Intelligence', icon: <Mic size={16} /> },
  ];

  // Group 3: ACCOUNT
  const accountItems: { section: PrimaryNavSection; label: string; icon: React.ReactNode }[] = [
    { section: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
    { section: 'settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
    { section: 'retention', label: 'Storage & Retention', icon: <HardDrive size={16} /> },
  ];

  const renderNavButton = (
    section: PrimaryNavSection,
    label: string,
    icon: React.ReactNode,
    badge?: string | number
  ) => {
    const isActive = currentSection === section;
    return (
      <button
        key={section}
        onClick={() => onSelectSection(section)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          isActive
            ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
        } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
        title={isCollapsed ? label : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}>
            {icon}
          </span>
          {!isCollapsed && <span className="truncate">{label}</span>}
        </div>

        {!isCollapsed && typeof badge !== 'undefined' && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              isActive
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`relative h-full flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-[68px]' : 'w-64 lg:w-72'
      }`}
    >
      {/* 1. Header / Brand Identity */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-[var(--border-subtle)] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-sm shrink-0 font-bold text-base">
              B
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                  Brainnote<span className="text-[var(--accent-primary)]">.ai</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                  {planTier}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">
                Capture. Understand. Remember.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-sm font-bold text-base">
              B
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* 2. Prominent Capture Action Button */}
      <div className="p-3 shrink-0">
        <button
          onClick={onOpenCapture}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-xs text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.98] transition-all shadow-sm ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Capture Source (URL, Document, YouTube, Audio)"
        >
          <Plus size={16} className="shrink-0" />
          {!isCollapsed && <span>Capture Source</span>}
        </button>
      </div>

      {/* 3. Active Notebook Switcher */}
      {!isCollapsed ? (
        <div className="px-3 pb-2 shrink-0 relative">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 mb-1">
            Active Notebook
          </div>
          <button
            onClick={() => setIsNotebookMenuOpen(!isNotebookMenuOpen)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-left transition-colors text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <BookMarked size={14} className="text-[var(--accent-primary)] shrink-0" />
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {activeNotebook?.title || 'Untitled Notebook'}
              </span>
            </div>
            <ChevronDown size={13} className="text-[var(--text-muted)] shrink-0" />
          </button>

          {/* Notebook Dropdown */}
          {isNotebookMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsNotebookMenuOpen(false)} 
              />
              <div className="absolute left-3 right-3 top-full mt-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-lg z-50 p-1.5 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border-subtle)] mb-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                    All Notebooks ({notebooks.length})
                  </span>
                  <button
                    onClick={() => {
                      setIsNotebookMenuOpen(false);
                      onCreateNotebook();
                    }}
                    className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> New
                  </button>
                </div>
                {notebooks.map((nb) => (
                  <button
                    key={nb.id}
                    onClick={() => {
                      onSelectNotebook(nb.id);
                      setIsNotebookMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                      activeNotebook?.id === nb.id
                        ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <span className="truncate">{nb.title}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-1">
                      {nb.sources?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-center pb-2 shrink-0">
          <button
            onClick={onCreateNotebook}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            title="Create New Notebook"
          >
            <BookMarked size={16} />
          </button>
        </div>
      )}

      {/* 4. Primary Navigation Items (Structured into 3 exact groups) */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {/* GROUP 1: WORKSPACE */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1">
              Workspace
            </div>
          )}
          {workspaceItems.map((item) => renderNavButton(item.section, item.label, item.icon, item.badge))}
        </div>

        {/* GROUP 2: AI TOOLS */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1">
              AI Tools
            </div>
          )}
          {aiToolItems.map((item) => renderNavButton(item.section, item.label, item.icon))}
        </div>

        {/* GROUP 3: ACCOUNT */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1">
              Account
            </div>
          )}
          {accountItems.map((item) => renderNavButton(item.section, item.label, item.icon))}
          
          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ${
                isCollapsed ? 'justify-center px-0' : 'justify-start'
              }`}
              title={isCollapsed ? 'Log out' : undefined}
            >
              <LogOut size={16} />
              {!isCollapsed && <span>Log out</span>}
            </button>
          )}
        </div>
      </nav>

      {/* 5. Subscription Status & Trial Bar */}
      {!isCollapsed && planTier === 'trial' && (
        <div className="m-3 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Crown size={12} />
              Trial Mode
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-bold">
              {trialDaysRemaining}d remaining
            </span>
          </div>
          <div className="w-full bg-[var(--border-subtle)] h-1.5 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.max(10, Math.min(100, (trialDaysRemaining / 7) * 100))}%` }}
            />
          </div>
          <button
            onClick={onOpenBilling}
            className="w-full py-1 text-center rounded text-[11px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
          >
            Upgrade Workspace &rarr;
          </button>
        </div>
      )}

      {/* 6. Settings & Profile Footer */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] shrink-0 flex items-center justify-between gap-1">
        {!isCollapsed ? (
          <>
            <div 
              className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onSelectSection('profile')}
              title="View Profile"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                {userName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {userName}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {tenantName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                title="Settings & Retention"
              >
                <SettingsIcon size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-2 py-1">
            <ThemeToggle />
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              title="Settings & Retention"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
