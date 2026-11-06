'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ThreePanelWorkspace } from '@/components/workspace/ThreePanelWorkspace';
import { IngestSourceModal } from '@/components/IngestSourceModal';
import { BillingModal } from '@/components/BillingModal';
import { ShareModal } from '@/components/ShareModal';
import { ExtensionModal } from '@/components/ExtensionModal';
import { INITIAL_TENANTS, TenantDataset } from '@/lib/mock-data';
import { 
  Note, 
  NoteSource, 
  SourceType, 
  AIArtifact, 
  AIArtifactType, 
  SubscriptionTier, 
  CitationAnchor,
  Notebook,
  NotebookMessage,
  NotebookPersona
} from '@/types';
import { checkAITokenQuota, PLAN_CONFIGS } from '@/lib/billing';

export default function BrainnoteApp() {
  // Multi-tenant state store
  const [datasets, setDatasets] = useState<Record<string, TenantDataset>>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant-acme');

  // Active notebook selection
  const [activeNotebookId, setActiveNotebookId] = useState<string>('note-custom-llm-eval-harness');

  // Per-notebook selective source grounding map: { [notebookId]: string[] }
  const [selectedSourceMap, setSelectedSourceMap] = useState<Record<string, string[]>>({});

  // Per-notebook conversation history map: { [notebookId]: NotebookMessage[] }
  const [conversationsMap, setConversationsMap] = useState<Record<string, NotebookMessage[]>>({});

  // Per-notebook persona instructions: { [notebookId]: NotebookPersona }
  const [personaMap, setPersonaMap] = useState<Record<string, NotebookPersona>>({});
  const [customInstructionsMap, setCustomInstructionsMap] = useState<Record<string, string>>({});

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestInitialTab, setIngestInitialTab] = useState<SourceType>('youtube');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  // Generation status
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  const [isGeneratingStudio, setIsGeneratingStudio] = useState(false);
  const [generatingToolId, setGeneratingToolId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize live notes & sources from server store (captures from Extension & Ingest API)
  useEffect(() => {
    let isMounted = true;
    const fetchLatestNotes = async () => {
      try {
        const res = await fetch(`/api/notes?tenantId=${activeTenantId}`);
        const data = await res.json();
        if (data.success && data.notes && isMounted) {
          setDatasets((prev) => {
            const current = prev[activeTenantId] || prev['tenant-acme'];
            return {
              ...prev,
              [activeTenantId]: {
                ...current,
                notes: data.notes,
                usage: {
                  ...current.usage,
                  notesCount: data.notes.length,
                },
              },
            };
          });
        }
      } catch {
        // Fallback to local state if offline
      }
    };

    fetchLatestNotes();
    const interval = setInterval(fetchLatestNotes, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTenantId]);

  // Current tenant dataset
  const currentDataset = datasets[activeTenantId] || datasets['tenant-acme'];

  // Map notes to first-class NotebookLM Notebook domain entities
  const notebooks: Notebook[] = useMemo(() => {
    return currentDataset.notes.map((note) => {
      const allSourceIds = (note.sources || []).map((s) => s.id);
      const selectedIds = selectedSourceMap[note.id] ?? allSourceIds;

      const conversation = conversationsMap[note.id] ?? [
        {
          id: `msg-welcome-${note.id}`,
          role: 'assistant',
          content: `I have analyzed your sources for **${note.title}**. Ask anything about this material or generate study guides and summaries in the Studio.`,
          timestamp: note.createdAt,
        },
      ];

      return {
        id: note.id,
        tenantId: note.tenantId,
        userId: note.userId,
        title: note.title,
        description: note.content ? note.content.slice(0, 200) : '',
        sources: note.sources || [],
        selectedSourceIds: selectedIds,
        conversation,
        artifacts: note.aiArtifacts || [],
        savedNotes: [note],
        persona: personaMap[note.id] || 'default',
        customInstructions: customInstructionsMap[note.id] || '',
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    });
  }, [
    currentDataset.notes, 
    selectedSourceMap, 
    conversationsMap, 
    personaMap, 
    customInstructionsMap
  ]);

  // Active Notebook
  const activeNotebook = useMemo(() => {
    const found = notebooks.find((nb) => nb.id === activeNotebookId);
    if (found) return found;
    return notebooks[0] || null;
  }, [notebooks, activeNotebookId]);

  // Ensure activeNotebookId is synced
  useEffect(() => {
    if (notebooks.length > 0 && (!activeNotebookId || !notebooks.some((nb) => nb.id === activeNotebookId))) {
      setActiveNotebookId(notebooks[0].id);
    }
  }, [notebooks, activeNotebookId]);

  // Toggle Source in Grounding Set
  const handleToggleSource = (sourceId: string) => {
    if (!activeNotebook) return;
    const currentSelected = activeNotebook.selectedSourceIds;
    let next: string[];
    if (currentSelected.includes(sourceId)) {
      next = currentSelected.filter((id) => id !== sourceId);
    } else {
      next = [...currentSelected, sourceId];
    }
    setSelectedSourceMap((prev) => ({
      ...prev,
      [activeNotebook.id]: next,
    }));
  };

  const handleSelectAllSources = () => {
    if (!activeNotebook) return;
    const allIds = activeNotebook.sources.map((s) => s.id);
    setSelectedSourceMap((prev) => ({
      ...prev,
      [activeNotebook.id]: allIds,
    }));
  };

  const handleDeselectAllSources = () => {
    if (!activeNotebook) return;
    setSelectedSourceMap((prev) => ({
      ...prev,
      [activeNotebook.id]: [],
    }));
  };

  const handleOpenAddSource = (tab: SourceType = 'youtube') => {
    setIngestInitialTab(tab);
    setIsIngestModalOpen(true);
  };

  // Remove a source from active notebook
  const handleDeleteSource = (sourceId: string) => {
    if (!activeNotebook) return;
    const updatedSources = activeNotebook.sources.filter((s) => s.id !== sourceId);
    const updatedNote: Note = {
      ...activeNotebook.savedNotes[0],
      sources: updatedSources,
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: prev[activeTenantId].notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      },
    }));

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: updatedNote,
      }),
    }).catch(() => {});

    showToast('Source removed from notebook.');
  };

  // Create New Notebook
  const handleCreateNotebook = () => {
    const newId = `nb-${Date.now()}`;
    const newNote: Note = {
      id: newId,
      tenantId: currentDataset.tenant.id,
      userId: currentDataset.user.id,
      title: 'Untitled Notebook',
      content: '',
      isPinned: false,
      isArchived: false,
      tags: [],
      sources: [],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: [newNote, ...prev[activeTenantId].notes],
        usage: {
          ...prev[activeTenantId].usage,
          notesCount: prev[activeTenantId].usage.notesCount + 1,
        },
      },
    }));

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: newNote,
      }),
    }).catch(() => {});

    setActiveNotebookId(newId);
    showToast('Created new notebook.');
  };

  // Chat message send handler with Grounding
  const handleSendMessage = async (query: string) => {
    if (!activeNotebook || !query.trim()) return;

    // Check pre-flight subscription and token quota (Condition 4)
    const quota = checkAITokenQuota(currentDataset.usage, currentDataset.subscription, 800);
    if (!quota.allowed) {
      showToast(quota.reason || 'AI Token Quota Exceeded or Trial Expired');
      setIsBillingModalOpen(true);
      return;
    }

    const userMsg: NotebookMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const currentConvo = activeNotebook.conversation;
    setConversationsMap((prev) => ({
      ...prev,
      [activeNotebook.id]: [...currentConvo, userMsg],
    }));

    setIsGeneratingChat(true);

    try {
      // Connect to Grounded Search API with selected source IDs (Condition 3)
      const res = await fetch('/api/search/grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          tenantId: activeTenantId,
          selectedSourceIds: activeNotebook.selectedSourceIds,
          persona: activeNotebook.persona,
          customInstructions: activeNotebook.customInstructions,
        }),
      });

      const data = await res.json();
      setIsGeneratingChat(false);

      if (data.success) {
        const aiMsg: NotebookMessage = {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          timestamp: new Date().toISOString(),
        };

        setConversationsMap((prev) => ({
          ...prev,
          [activeNotebook.id]: [...(prev[activeNotebook.id] || []), aiMsg],
        }));

        // Meter tokens in local usage state
        setDatasets((prev) => ({
          ...prev,
          [activeTenantId]: {
            ...prev[activeTenantId],
            usage: {
              ...prev[activeTenantId].usage,
              aiTokensConsumed: prev[activeTenantId].usage.aiTokensConsumed + 650,
            },
          },
        }));
      } else {
        showToast(data.error || 'Failed to generate grounded answer.');
      }
    } catch {
      setIsGeneratingChat(false);
      showToast('Error connecting to AI grounding service.');
    }
  };

  // Save AI response as a note in the notebook
  const handleSaveAsNote = (content: string) => {
    if (!activeNotebook) return;
    const activeNote = activeNotebook.savedNotes[0];
    const newContent = activeNote.content 
      ? `${activeNote.content}\n\n---\n**Saved Note (${new Date().toLocaleTimeString()}):**\n${content}`
      : `**Saved Note (${new Date().toLocaleTimeString()}):**\n${content}`;

    const updatedNote: Note = {
      ...activeNote,
      content: newContent,
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: prev[activeTenantId].notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      },
    }));

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: updatedNote,
      }),
    }).catch(() => {});

    showToast('Saved response to notebook notes!');
  };

  // Persona selection handler
  const handleSelectPersona = (persona: NotebookPersona, customText?: string) => {
    if (!activeNotebook) return;
    setPersonaMap((prev) => ({
      ...prev,
      [activeNotebook.id]: persona,
    }));
    if (customText !== undefined) {
      setCustomInstructionsMap((prev) => ({
        ...prev,
        [activeNotebook.id]: customText,
      }));
    }
    showToast(`Persona updated: ${persona.replace('_', ' ')}`);
  };

  // Studio tool generation
  const handleGenerateStudioTool = async (toolId: string) => {
    if (!activeNotebook) return;

    if (activeNotebook.selectedSourceIds.length === 0) {
      showToast('Please select at least one source to generate studio artifacts.');
      return;
    }

    // Check pre-flight subscription quota (Condition 4)
    const quota = checkAITokenQuota(currentDataset.usage, currentDataset.subscription, 1500);
    if (!quota.allowed) {
      showToast(quota.reason || 'AI Token Quota Exceeded or Trial Expired');
      setIsBillingModalOpen(true);
      return;
    }

    setIsGeneratingStudio(true);
    setGeneratingToolId(toolId);

    // Map toolId to backend AIArtifactType
    let artifactType: AIArtifactType = 'summary';
    if (toolId === 'meeting_minutes') artifactType = 'meeting_minutes';
    else if (toolId === 'action_items') artifactType = 'action_items';
    else if (toolId === 'flashcards') artifactType = 'flashcards';
    else if (toolId === 'quiz') artifactType = 'quiz';
    else if (toolId === 'faq') artifactType = 'qa';
    else if (toolId === 'study_guide' || toolId === 'revision_notes') artifactType = 'study_guide';

    const selectedSources = activeNotebook.sources.filter((s) => activeNotebook.selectedSourceIds.includes(s.id));
    const combinedTranscript = selectedSources.map((s) => s.rawTranscript || s.title).join('\n\n');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeNotebook.id,
          title: activeNotebook.title,
          content: activeNotebook.description || combinedTranscript.slice(0, 500),
          artifactType,
          tenantId: activeTenantId,
          sourceTranscript: combinedTranscript,
          question: toolId === 'faq' ? 'What are the essential concepts and FAQs from these sources?' : undefined,
        }),
      });

      const data = await res.json();
      setIsGeneratingStudio(false);
      setGeneratingToolId(null);

      if (data.success && data.artifact) {
        const activeNote = activeNotebook.savedNotes[0];
        const updatedArtifacts = [
          data.artifact,
          ...(activeNote.aiArtifacts || []).filter((a) => a.id !== data.artifact.id),
        ];

        const updatedNote: Note = {
          ...activeNote,
          aiArtifacts: updatedArtifacts,
          updatedAt: new Date().toISOString(),
        };

        setDatasets((prev) => ({
          ...prev,
          [activeTenantId]: {
            ...prev[activeTenantId],
            notes: prev[activeTenantId].notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
            usage: {
              ...prev[activeTenantId].usage,
              aiTokensConsumed: prev[activeTenantId].usage.aiTokensConsumed + (data.tokensUsed || 1000),
            },
          },
        }));

        showToast(`Generated ${toolId.replace('_', ' ')} successfully!`);
      } else {
        showToast(data.error || 'Studio generation failed.');
      }
    } catch {
      setIsGeneratingStudio(false);
      setGeneratingToolId(null);
      showToast('Error generating studio artifact.');
    }
  };

  // Delete Artifact
  const handleDeleteArtifact = (artifactId: string) => {
    if (!activeNotebook) return;
    const activeNote = activeNotebook.savedNotes[0];
    const updatedArtifacts = (activeNote.aiArtifacts || []).filter((a) => a.id !== artifactId);

    const updatedNote: Note = {
      ...activeNote,
      aiArtifacts: updatedArtifacts,
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: prev[activeTenantId].notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      },
    }));

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: updatedNote,
      }),
    }).catch(() => {});

    showToast('Artifact deleted.');
  };

  // Completion of Add Source Modal
  const handleIngestComplete = (
    sourceType: SourceType,
    title: string,
    urlOrFile: string,
    initialNoteContent: string
  ) => {
    if (!activeNotebook) return;
    const activeNote = activeNotebook.savedNotes[0];

    const newSource: NoteSource = {
      id: `src-${Date.now()}`,
      tenantId: activeTenantId,
      noteId: activeNote.id,
      sourceType,
      title,
      sourceUrl: urlOrFile.startsWith('http') ? urlOrFile : undefined,
      rawTranscript: initialNoteContent || `Extracted content for ${title}`,
      processingStatus: 'completed',
      createdAt: new Date().toISOString(),
    };

    const updatedSources = [newSource, ...(activeNote.sources || [])];
    const updatedNote: Note = {
      ...activeNote,
      sources: updatedSources,
      content: activeNote.content ? `${activeNote.content}\n\n${initialNoteContent}` : initialNoteContent,
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: prev[activeTenantId].notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      },
    }));

    // Auto-select the newly ingested source for grounding
    setSelectedSourceMap((prev) => ({
      ...prev,
      [activeNotebook.id]: [...(prev[activeNotebook.id] || []), newSource.id],
    }));

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: updatedNote,
      }),
    }).catch(() => {});

    setIsIngestModalOpen(false);
    showToast(`Added source: ${title}`);
  };

  // Subscription plan tier upgrade
  const handleUpgradeTier = (tier: SubscriptionTier) => {
    const limits = PLAN_CONFIGS[tier];
    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        tenant: { ...prev[activeTenantId].tenant, tier },
        subscription: {
          ...prev[activeTenantId].subscription,
          planTier: tier,
          status: 'active',
          trialEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        usage: {
          ...prev[activeTenantId].usage,
          aiTokensLimit: limits.aiTokensLimit,
          storageBytesLimit: limits.storageBytesLimit,
          notesLimit: limits.notesLimit,
          audioMinutesLimit: limits.audioMinutesLimit,
        },
      },
    }));
    setIsBillingModalOpen(false);
    showToast(`Upgraded workspace to ${tier.toUpperCase()} Plan!`);
  };

  // Calculate trial days remaining
  const trialEndMs = new Date(currentDataset.subscription.trialEnd).getTime();
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <>
      {/* 3-PANEL NOTEBOOK WORKSPACE */}
      <ThreePanelWorkspace
        notebooks={notebooks}
        activeNotebook={activeNotebook}
        onSelectNotebook={setActiveNotebookId}
        onCreateNotebook={handleCreateNotebook}
        onToggleSource={handleToggleSource}
        onSelectAllSources={handleSelectAllSources}
        onDeselectAllSources={handleDeselectAllSources}
        onOpenAddSource={() => handleOpenAddSource('youtube')}
        onDeleteSource={handleDeleteSource}
        onSendMessage={handleSendMessage}
        onSaveAsNote={handleSaveAsNote}
        onSelectPersona={handleSelectPersona}
        onGenerateStudioTool={handleGenerateStudioTool}
        onDeleteArtifact={handleDeleteArtifact}
        onOpenBilling={() => setIsBillingModalOpen(true)}
        onOpenSettings={() => setIsBillingModalOpen(true)}
        onOpenExtension={() => setIsExtensionModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isGeneratingChat={isGeneratingChat}
        isGeneratingStudio={isGeneratingStudio}
        generatingToolId={generatingToolId}
        trialDaysRemaining={trialDaysRemaining}
        planTier={currentDataset.subscription.planTier}
        userName={currentDataset.user.name}
        tenantName={currentDataset.tenant.name}
      />

      {/* MODAL 1: Ingest Source Modal (11 Source Types) */}
      <IngestSourceModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestComplete={handleIngestComplete}
        initialTab={ingestInitialTab}
      />

      {/* MODAL 2: Billing & Subscription Modal */}
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        subscription={currentDataset.subscription}
        usage={currentDataset.usage}
        onSimulateUpgrade={handleUpgradeTier}
      />

      {/* MODAL 3: Share Notebook Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tenantId={activeTenantId}
        tenantName={currentDataset.tenant.name}
        activeNote={activeNotebook?.savedNotes[0] || null}
        onShowToast={showToast}
      />

      {/* MODAL 4: Browser Extension Companion Modal */}
      <ExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[var(--text-primary)] text-[var(--bg-panel)] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-[var(--border-subtle)]">
          {toastMessage}
        </div>
      )}
    </>
  );
}
