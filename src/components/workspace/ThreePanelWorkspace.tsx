'use client';

import React, { useState } from 'react';
import { CompactHeader } from './CompactHeader';
import { SourcesPanel } from './SourcesPanel';
import { ChatPanel } from './ChatPanel';
import { StudioPanel } from './StudioPanel';
import { Notebook, NoteSource, NotebookPersona, AIArtifact } from '@/types';
import { Layers, MessageSquare, Sparkles } from 'lucide-react';

interface ThreePanelWorkspaceProps {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onSelectNotebook: (notebookId: string) => void;
  onCreateNotebook: () => void;
  onToggleSource: (sourceId: string) => void;
  onSelectAllSources: () => void;
  onDeselectAllSources: () => void;
  onOpenAddSource: () => void;
  onDeleteSource: (sourceId: string) => void;
  onSendMessage: (query: string) => void;
  onSaveAsNote: (content: string) => void;
  onSelectPersona: (persona: NotebookPersona, customText?: string) => void;
  onGenerateStudioTool: (toolId: string) => void;
  onDeleteArtifact?: (artifactId: string) => void;
  onOpenBilling: () => void;
  onOpenSettings: () => void;
  onOpenExtension: () => void;
  onOpenShare: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isGeneratingChat?: boolean;
  isGeneratingStudio?: boolean;
  generatingToolId?: string | null;
  trialDaysRemaining?: number;
  planTier?: string;
  userName?: string;
  tenantName?: string;
}

export type MobileTab = 'sources' | 'chat' | 'studio';

export const ThreePanelWorkspace: React.FC<ThreePanelWorkspaceProps> = ({
  notebooks,
  activeNotebook,
  onSelectNotebook,
  onCreateNotebook,
  onToggleSource,
  onSelectAllSources,
  onDeselectAllSources,
  onOpenAddSource,
  onDeleteSource,
  onSendMessage,
  onSaveAsNote,
  onSelectPersona,
  onGenerateStudioTool,
  onDeleteArtifact,
  onOpenBilling,
  onOpenSettings,
  onOpenExtension,
  onOpenShare,
  searchQuery,
  onSearchChange,
  isGeneratingChat = false,
  isGeneratingStudio = false,
  generatingToolId = null,
  trialDaysRemaining = 7,
  planTier = 'trial',
  userName = 'Workspace Owner',
  tenantName = 'My Knowledge Workspace',
}) => {
  // Mobile active tab: 'sources' | 'chat' | 'studio'
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');

  const sources = activeNotebook?.sources || [];
  const selectedSourceIds = activeNotebook?.selectedSourceIds || [];
  const messages = activeNotebook?.conversation || [];
  const artifacts = activeNotebook?.artifacts || [];
  const persona = activeNotebook?.persona || 'default';
  const customInstructions = activeNotebook?.customInstructions;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* 1. COMPACT HEADER */}
      <CompactHeader
        notebooks={notebooks}
        activeNotebook={activeNotebook}
        onSelectNotebook={onSelectNotebook}
        onCreateNotebook={onCreateNotebook}
        onOpenBilling={onOpenBilling}
        onOpenSettings={onOpenSettings}
        onOpenExtension={onOpenExtension}
        onOpenShare={onOpenShare}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        trialDaysRemaining={trialDaysRemaining}
        planTier={planTier}
        userName={userName}
        tenantName={tenantName}
      />

      {/* 2. MOBILE / TABLET TAB SWITCHER (Visible on < 1024px screens) */}
      <div className="flex lg:hidden items-center justify-around border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-2 py-1.5 shrink-0 z-20">
        <button
          onClick={() => setMobileTab('sources')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'sources'
              ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers size={14} />
          <span>Sources ({sources.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'chat'
              ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <MessageSquare size={14} />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setMobileTab('studio')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'studio'
              ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles size={14} />
          <span>Studio ({artifacts.length})</span>
        </button>
      </div>

      {/* 3. THREE-PANEL BODY WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PANEL 1: SOURCES (Fixed on Desktop, Switched on Mobile) */}
        <div
          className={`h-full ${
            mobileTab === 'sources' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-auto shrink-0`}
        >
          <SourcesPanel
            sources={sources}
            selectedSourceIds={selectedSourceIds}
            onToggleSource={onToggleSource}
            onSelectAll={onSelectAllSources}
            onDeselectAll={onDeselectAllSources}
            onOpenAddSource={onOpenAddSource}
            onDeleteSource={onDeleteSource}
          />
        </div>

        {/* PANEL 2: AI CHAT (Center, Widest Flex on Desktop, Switched on Mobile) */}
        <div
          className={`h-full flex-1 ${
            mobileTab === 'chat' ? 'flex w-full' : 'hidden'
          } lg:flex`}
        >
          <ChatPanel
            notebookTitle={activeNotebook?.title || 'Notebook Knowledge Workspace'}
            messages={messages}
            sources={sources}
            selectedSourceIds={selectedSourceIds}
            activePersona={persona}
            customInstructions={customInstructions}
            onSendMessage={onSendMessage}
            onSaveAsNote={onSaveAsNote}
            onSelectPersona={onSelectPersona}
            isGenerating={isGeneratingChat}
          />
        </div>

        {/* PANEL 3: STUDIO (Right, Fixed on Desktop, Switched on Mobile) */}
        <div
          className={`h-full ${
            mobileTab === 'studio' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-auto shrink-0`}
        >
          <StudioPanel
            artifacts={artifacts}
            selectedSourceIds={selectedSourceIds}
            sources={sources}
            onGenerateTool={onGenerateStudioTool}
            onDeleteArtifact={onDeleteArtifact}
            isGenerating={isGeneratingStudio}
            generatingToolId={generatingToolId}
          />
        </div>
      </div>
    </div>
  );
};
