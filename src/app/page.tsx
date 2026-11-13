'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { HomeDashboardView } from '@/components/views/HomeDashboardView';
import { KnowledgeLibraryView } from '@/components/views/KnowledgeLibraryView';
import { ChatStudioView } from '@/components/views/ChatStudioView';
import { CreationStudioView } from '@/components/views/CreationStudioView';
import { LearningReviewView } from '@/components/views/LearningReviewView';
import { MeetingIntelligenceView } from '@/components/views/MeetingIntelligenceView';
import { MyNotesView } from '@/components/views/MyNotesView';
import { ThreePanelWorkspace } from '@/components/workspace/ThreePanelWorkspace';
import { IngestSourceModal } from '@/components/IngestSourceModal';
import { BillingModal } from '@/components/BillingModal';
import { ShareModal } from '@/components/ShareModal';
import { ExtensionModal } from '@/components/ExtensionModal';
import { DocumentViewerModal } from '@/components/document/DocumentViewerModal';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { INITIAL_TENANTS, TenantDataset } from '@/lib/mock-data';
import {
  Note,
  NoteSource,
  SourceType,
  AIArtifact,
  AIArtifactType,
  SubscriptionTier,
  Notebook,
  NotebookMessage,
  NotebookPersona,
  PrimaryNavSection
} from '@/types';
import { checkAITokenQuota, PLAN_CONFIGS } from '@/lib/billing';

export default function BrainnoteApp() {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<PrimaryNavSection>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Multi-tenant state store
  const [datasets, setDatasets] = useState<Record<string, TenantDataset>>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant-acme');

  // Active notebook selection
  const [activeNotebookId, setActiveNotebookId] = useState<string>('note-custom-llm-eval-harness');

  // Active selected note for My Notes
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalViewerArtifactId, setGlobalViewerArtifactId] = useState<string | null>(null);

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

  // Ensure activeNotebookId is synced and falls back away from any deleted notebook
  useEffect(() => {
    if (notebooks.length > 0) {
      if (!activeNotebookId || activeNotebookId === 'note-user-ai-video-tools' || !notebooks.some((nb) => nb.id === activeNotebookId)) {
        setActiveNotebookId(notebooks[0].id);
      }
    }
  }, [notebooks, activeNotebookId]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K opens Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync live notes and artifacts from /api/notes on mount and tenant change
  useEffect(() => {
    // Purge any stale localStorage drafts or search history referencing deleted test items
    try {
      if (typeof window !== 'undefined') {
        const historyKey = 'brainnote_recent_searches';
        const rawHistory = localStorage.getItem(historyKey);
        if (rawHistory) {
          try {
            const parsed = JSON.parse(rawHistory);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((q: string) => {
                const lower = q.toLowerCase();
                return (
                  !lower.includes('study deck') &&
                  !lower.includes('art-yt') &&
                  !lower.includes('video generator') &&
                  !lower.includes('top 5 free')
                );
              });
              localStorage.setItem(historyKey, JSON.stringify(cleaned));
            }
          } catch {}
        }
      }
    } catch {}

    // Fetch authoritative state from server
    fetch(`/api/notes?tenantId=${encodeURIComponent(activeTenantId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.notes) {
          const cleanedNotes = data.notes
            .filter((n: Note) => n.id !== 'note-user-ai-video-tools' && !n.title.toLowerCase().includes('top 5 free ai video generator'))
            .map((n: Note) => ({
              ...n,
              sources: (n.sources || []).filter(
                (s) => s.id !== 'src-yt-video-1' && !s.title.toLowerCase().includes('top 5 free ai video generator')
              ),
              aiArtifacts: (n.aiArtifacts || []).filter(
                (a: AIArtifact) =>
                  !a.id.startsWith('art-yt-') &&
                  a.id !== 'art-yt-study' &&
                  a.title !== 'AI Video Tools Study Deck' &&
                  !a.title.toLowerCase().includes('free ai video generator')
              ),
            }));

          setDatasets((prev) => {
            const current = prev[activeTenantId] || prev['tenant-acme'];
            return {
              ...prev,
              [activeTenantId]: {
                ...current,
                notes: cleanedNotes,
                usage: data.usage || current.usage,
              },
            };
          });
        }
      })
      .catch(() => {});
  }, [activeTenantId]);

  // Total sources across all notebooks
  const totalSourcesCount = useMemo(() => {
    return notebooks.reduce((acc, nb) => acc + (nb.sources?.length || 0), 0);
  }, [notebooks]);

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
    }).catch(() => { });

    fetch(`/api/sources?tenantId=${encodeURIComponent(activeTenantId)}&sourceId=${encodeURIComponent(sourceId)}`, {
      method: 'DELETE',
    }).catch(() => { });

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
    }).catch(() => { });

    setActiveNotebookId(newId);
    showToast('Created new notebook.');
  };

  // Chat message send handler with Grounding
  const handleSendMessage = async (query: string) => {
    if (!activeNotebook || !query.trim()) return;

    // Check pre-flight subscription and token quota
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
    }).catch(() => { });

    showToast('Saved response to notebook notes!');
  };

  // Save note handler for My Notes view
  const handleSaveNote = async (note: Note) => {
    setDatasets((prev) => {
      const current = prev[activeTenantId] || prev['tenant-acme'];
      const existingIdx = current.notes.findIndex((n) => n.id === note.id);
      const updatedNotes = existingIdx >= 0
        ? current.notes.map((n) => (n.id === note.id ? note : n))
        : [note, ...current.notes];

      return {
        ...prev,
        [activeTenantId]: {
          ...current,
          notes: updatedNotes,
          usage: {
            ...current.usage,
            notesCount: updatedNotes.length,
          },
        },
      };
    });

    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          note,
        }),
      });
    } catch (err) {
      console.error('Failed to sync note:', err);
    }
  };

  // Delete note handler for My Notes view
  const handleDeleteNote = async (noteId: string) => {
    setDatasets((prev) => {
      const current = prev[activeTenantId] || prev['tenant-acme'];
      const updatedNotes = current.notes.filter((n) => n.id !== noteId);
      return {
        ...prev,
        [activeTenantId]: {
          ...current,
          notes: updatedNotes,
          usage: {
            ...current.usage,
            notesCount: updatedNotes.length,
          },
        },
      };
    });

    try {
      await fetch(`/api/notes?tenantId=${activeTenantId}&noteId=${noteId}`, {
        method: 'DELETE',
      });
      showToast('Note deleted');
    } catch {
      showToast('Note deleted locally');
    }
  };

  // Create Quick Note action accessible throughout app
  const handleCreateQuickNote = () => {
    const newNoteId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newNoteId,
      tenantId: activeTenantId,
      userId: currentDataset.user.id,
      title: 'Untitled Note',
      content: '',
      isPinned: false,
      isArchived: false,
      tags: [],
      sources: [],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => {
      const current = prev[activeTenantId] || prev['tenant-acme'];
      return {
        ...prev,
        [activeTenantId]: {
          ...current,
          notes: [newNote, ...current.notes],
          usage: {
            ...current.usage,
            notesCount: current.notes.length + 1,
          },
        },
      };
    });

    setSelectedNoteId(newNoteId);
    setCurrentSection('my_notes');
    showToast('New note created');
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

    const quota = checkAITokenQuota(currentDataset.usage, currentDataset.subscription, 1500);
    if (!quota.allowed) {
      showToast(quota.reason || 'AI Token Quota Exceeded or Trial Expired');
      setIsBillingModalOpen(true);
      return;
    }

    setIsGeneratingStudio(true);
    setGeneratingToolId(toolId);

    let artifactType: AIArtifactType = 'summary';
    if (toolId === 'structured_notes') artifactType = 'structured_notes';
    else if (toolId === 'key_takeaways') artifactType = 'key_takeaways';
    else if (toolId === 'action_items') artifactType = 'action_items';
    else if (toolId === 'flashcards') artifactType = 'flashcards';
    else if (toolId === 'quiz') artifactType = 'quiz';
    else if (toolId === 'faq') artifactType = 'qa';
    else if (toolId === 'interview_prep') artifactType = 'interview_qa';
    else if (toolId === 'study_guide' || toolId === 'revision_notes') artifactType = 'study_guide';
    else if (toolId === 'concept_map') artifactType = 'concept_map';
    else if (toolId === 'mind_map') artifactType = 'mind_map';
    else if (toolId === 'timeline') artifactType = 'timeline';
    else if (toolId === 'compare_sources') artifactType = 'compare_sources';
    else if (toolId === 'glossary') artifactType = 'glossary';
    else if (toolId === 'meeting_minutes') artifactType = 'meeting_minutes';
    else if (toolId === 'decisions') artifactType = 'decisions';
    else if (toolId === 'audio_overview') artifactType = 'audio_overview';

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
          splitOptions: true,
        }),
      });

      const data = await res.json();
      setIsGeneratingStudio(false);
      setGeneratingToolId(null);

      if (data.success && (data.artifact || data.artifacts)) {
        const newArtifacts: AIArtifact[] = (data.artifacts && data.artifacts.length > 0)
          ? data.artifacts
          : [data.artifact];

        const activeNote = activeNotebook.savedNotes[0];
        const newIds = new Set(newArtifacts.map((a: AIArtifact) => a.id));
        const updatedArtifacts = [
          ...newArtifacts,
          ...(activeNote.aiArtifacts || []).filter((a) => !newIds.has(a.id)),
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

        // AUTOMATIC DOCUMENT OPENING AFTER GENERATION (Requirement 2)
        setGlobalViewerArtifactId(newArtifacts[0].id);

        showToast(
          newArtifacts.length > 1
            ? `Generated ${newArtifacts.length} separate documents!`
            : `Generated ${newArtifacts[0].title}`
        );
      } else {
        showToast(data.error || 'Studio generation failed.');
      }
    } catch {
      setIsGeneratingStudio(false);
      setGeneratingToolId(null);
      showToast('Error generating studio artifact.');
    }
  };

  // Save edits to artifact
  const handleSaveArtifact = (updatedArtifact: AIArtifact) => {
    if (!activeNotebook) return;
    const activeNote = activeNotebook.savedNotes[0];
    const updatedArtifacts = (activeNote.aiArtifacts || []).map((a) =>
      a.id === updatedArtifact.id ? updatedArtifact : a
    );

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
    }).catch(() => { });

    showToast('Saved document edits.');
  };

  // Save artifact as standalone note in My Notes
  const handleSaveArtifactAsNote = (title: string, markdown: string) => {
    const newNoteId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newNoteId,
      tenantId: activeTenantId,
      userId: currentDataset.user.id,
      title: title || 'Saved Artifact Note',
      content: markdown,
      isPinned: false,
      isArchived: false,
      tags: [{ id: 'tag-artifact', tenantId: activeTenantId, name: 'AI Artifact', color: 'indigo' }],
      sources: [],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDatasets((prev) => {
      const current = prev[activeTenantId] || prev['tenant-acme'];
      return {
        ...prev,
        [activeTenantId]: {
          ...current,
          notes: [newNote, ...current.notes],
          usage: {
            ...current.usage,
            notesCount: current.notes.length + 1,
          },
        },
      };
    });

    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: newNote,
      }),
    }).catch(() => { });

    showToast(`Created note: "${title}"`);
  };

  // Delete Artifact
  const handleDeleteArtifact = (artifactId: string) => {
    const currentNotes = currentDataset.notes;
    const targetNote = currentNotes.find((n) => (n.aiArtifacts || []).some((a) => a.id === artifactId)) || activeNotebook?.savedNotes[0];
    if (!targetNote) return;

    const updatedArtifacts = (targetNote.aiArtifacts || []).filter((a) => a.id !== artifactId);

    const updatedNote: Note = {
      ...targetNote,
      aiArtifacts: updatedArtifacts,
      updatedAt: new Date().toISOString(),
    };

    if (globalViewerArtifactId === artifactId) {
      setGlobalViewerArtifactId(null);
    }

    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: prev[activeTenantId].notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      },
    }));

    fetch(`/api/notes?tenantId=${encodeURIComponent(activeTenantId)}&noteId=${encodeURIComponent(targetNote.id)}&artifactId=${encodeURIComponent(artifactId)}`, {
      method: 'DELETE',
    }).catch(() => { });

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
    }).catch(() => { });

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

  const handleSelectSection = (section: PrimaryNavSection) => {
    if (section === 'settings') {
      setIsBillingModalOpen(true);
    } else {
      setCurrentSection(section);
      setIsMobileSidebarOpen(false);
    }
  };

  // Calculate trial days remaining
  const trialEndMs = new Date(currentDataset.subscription.trialEnd).getTime();
  const trialDaysRemaining = Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* 1. DESKTOP SIDEBAR */}
      <div className="hidden md:flex h-full">
        <AppSidebar
          currentSection={currentSection}
          onSelectSection={handleSelectSection}
          notebooks={notebooks}
          activeNotebook={activeNotebook}
          onSelectNotebook={setActiveNotebookId}
          onCreateNotebook={handleCreateNotebook}
          onOpenCapture={() => handleOpenAddSource('youtube')}
          onOpenSettings={() => setIsBillingModalOpen(true)}
          onOpenBilling={() => setIsBillingModalOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          totalSourcesCount={totalSourcesCount}
          notesCount={currentDataset.notes.length}
          trialDaysRemaining={trialDaysRemaining}
          planTier={currentDataset.subscription.planTier}
          userName={currentDataset.user.name}
          tenantName={currentDataset.tenant.name}
        />
      </div>

      {/* 2. MOBILE SIDEBAR DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            <AppSidebar
              currentSection={currentSection}
              onSelectSection={handleSelectSection}
              notebooks={notebooks}
              activeNotebook={activeNotebook}
              onSelectNotebook={(id) => {
                setActiveNotebookId(id);
                setIsMobileSidebarOpen(false);
              }}
              onCreateNotebook={() => {
                handleCreateNotebook();
                setIsMobileSidebarOpen(false);
              }}
              onOpenCapture={() => {
                handleOpenAddSource('youtube');
                setIsMobileSidebarOpen(false);
              }}
              onOpenSettings={() => {
                setIsBillingModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenBilling={() => {
                setIsBillingModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              totalSourcesCount={totalSourcesCount}
              notesCount={currentDataset.notes.length}
              trialDaysRemaining={trialDaysRemaining}
              planTier={currentDataset.subscription.planTier}
              userName={currentDataset.user.name}
              tenantName={currentDataset.tenant.name}
            />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Universal Top Header */}
        <AppHeader
          currentSection={currentSection}
          activeNotebook={activeNotebook}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenCapture={() => handleOpenAddSource('youtube')}
          onOpenQuickNote={handleCreateQuickNote}
          onOpenShare={() => setIsShareModalOpen(true)}
          onOpenExtension={() => setIsExtensionModalOpen(true)}
          onOpenBilling={() => setIsBillingModalOpen(true)}
          planTier={currentDataset.subscription.planTier}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentSection === 'home' && (
            <HomeDashboardView
              userName={currentDataset.user.name}
              tenantName={currentDataset.tenant.name}
              notebooks={notebooks}
              activeNotebook={activeNotebook}
              onSelectNotebook={setActiveNotebookId}
              onCreateNotebook={handleCreateNotebook}
              onNavigate={setCurrentSection}
              onOpenCapture={handleOpenAddSource}
              onToggleSource={handleToggleSource}
            />
          )}

          {currentSection === 'library' && (
            <KnowledgeLibraryView
              notebooks={notebooks}
              activeNotebook={activeNotebook}
              onSelectNotebook={setActiveNotebookId}
              selectedSourceIds={activeNotebook?.selectedSourceIds || []}
              onToggleSource={handleToggleSource}
              onSelectAll={handleSelectAllSources}
              onDeselectAll={handleDeselectAllSources}
              onOpenCapture={handleOpenAddSource}
              onDeleteSource={handleDeleteSource}
            />
          )}

          {currentSection === 'my_notes' && (
            <MyNotesView
              notes={currentDataset.notes}
              notebooks={notebooks}
              activeNotebook={activeNotebook}
              initialSelectedNoteId={selectedNoteId || undefined}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onNavigateToChat={(noteTitle, content) => {
                setCurrentSection('ai_chat');
                showToast(`Context set to: ${noteTitle}`);
              }}
              onNavigateToLearning={() => setCurrentSection('learning_review')}
              onOpenShareModal={(note) => setIsShareModalOpen(true)}
              onShowToast={showToast}
              activeTenantId={activeTenantId}
            />
          )}

          {currentSection === 'ai_chat' && (
            <ChatStudioView
              notebookTitle={activeNotebook?.title || 'Notebook Knowledge Workspace'}
              messages={activeNotebook?.conversation || []}
              sources={activeNotebook?.sources || []}
              selectedSourceIds={activeNotebook?.selectedSourceIds || []}
              activePersona={activeNotebook?.persona || 'default'}
              customInstructions={activeNotebook?.customInstructions}
              onSendMessage={handleSendMessage}
              onSaveAsNote={handleSaveAsNote}
              onSelectPersona={handleSelectPersona}
              onToggleSource={handleToggleSource}
              onSelectAllSources={handleSelectAllSources}
              onDeselectAllSources={handleDeselectAllSources}
              isGenerating={isGeneratingChat}
            />
          )}

          {currentSection === 'creation_studio' && (
            <CreationStudioView
              artifacts={activeNotebook?.artifacts || []}
              selectedSourceIds={activeNotebook?.selectedSourceIds || []}
              sources={activeNotebook?.sources || []}
              activeNotebookTitle={activeNotebook?.title || 'Notebook'}
              onGenerateTool={handleGenerateStudioTool}
              onDeleteArtifact={handleDeleteArtifact}
              onSaveArtifact={handleSaveArtifact}
              onSaveAsNote={handleSaveArtifactAsNote}
              onShowToast={showToast}
              isGenerating={isGeneratingStudio}
              generatingToolId={generatingToolId}
              viewerArtifactId={globalViewerArtifactId}
              onCloseViewer={() => setGlobalViewerArtifactId(null)}
              onOpenArtifact={(id) => setGlobalViewerArtifactId(id)}
            />
          )}

          {currentSection === 'learning_review' && (
            <LearningReviewView
              notebooks={notebooks}
              activeNotebook={activeNotebook}
              onSelectNotebook={setActiveNotebookId}
              onGenerateTool={handleGenerateStudioTool}
              isGenerating={isGeneratingStudio}
              onOpenArtifact={(id) => setGlobalViewerArtifactId(id)}
            />
          )}

          {currentSection === 'meetings' && (
            <MeetingIntelligenceView
              notebooks={notebooks}
              activeNotebook={activeNotebook}
              onOpenCapture={handleOpenAddSource}
              onGenerateTool={handleGenerateStudioTool}
              isGenerating={isGeneratingStudio}
              onOpenArtifact={(id) => setGlobalViewerArtifactId(id)}
            />
          )}
        </main>
      </div>

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

      {/* MODAL 5: Universal Document Viewer Modal (Opens automatically on generation or user click) */}
      {globalViewerArtifactId && activeNotebook && (
        <DocumentViewerModal
          isOpen={Boolean(globalViewerArtifactId)}
          onClose={() => setGlobalViewerArtifactId(null)}
          artifacts={activeNotebook.artifacts || []}
          initialArtifactId={globalViewerArtifactId}
          notebookTitle={activeNotebook.title}
          onSaveArtifact={handleSaveArtifact}
          onSaveAsNote={handleSaveArtifactAsNote}
          onShowToast={showToast}
        />
      )}

      {/* MODAL 6: Global Command Search Modal (Cmd+K / Search Header) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notebooks={notebooks}
        notes={currentDataset.notes}
        onSelectNotebook={(id) => setActiveNotebookId(id)}
        onSelectNote={(noteId) => setSelectedNoteId(noteId)}
        onOpenArtifact={(artId) => setGlobalViewerArtifactId(artId)}
        onNavigate={(sec) => setCurrentSection(sec)}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[var(--text-primary)] text-[var(--bg-panel)] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-[var(--border-subtle)]">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
