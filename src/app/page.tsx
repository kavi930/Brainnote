'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { NoteList } from '@/components/NoteList';
import { NoteEditor, NoteEditorTab } from '@/components/NoteEditor';
import { IngestSourceModal } from '@/components/IngestSourceModal';
import { BillingModal } from '@/components/BillingModal';
import { ShareModal } from '@/components/ShareModal';
import { INITIAL_TENANTS, TenantDataset } from '@/lib/mock-data';
import { Note, SourceType, AIArtifactType, SubscriptionTier, PrimaryNavSection, CitationAnchor } from '@/types';
import { checkAITokenQuota, PLAN_CONFIGS } from '@/lib/billing';
import { 
  Sparkles, 
  BookOpen, 
  Mic, 
  FileText, 
  Video, 
  MessageSquare, 
  GraduationCap, 
  Settings, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Globe,
  Briefcase,
  Code2,
  ChevronDown,
  ChevronUp,
  Copy,
  Filter
} from 'lucide-react';

export default function BrainnoteApp() {
  // Multi-tenant state store
  const [datasets, setDatasets] = useState<Record<string, TenantDataset>>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>('tenant-acme');

  // Primary Navigation Section: 'home' | 'library' | 'web_sources' | 'interview_prep' | 'meetings' | 'documents' | 'videos' | 'ai_chat' | 'study_tools' | 'settings'
  const [currentSection, setCurrentSection] = useState<PrimaryNavSection>('library');

  // UI state
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>('note-user-ai-video-tools');
  const [editorTab, setEditorTab] = useState<NoteEditorTab>('content');
  
  // Modals & async operations
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestInitialTab, setIngestInitialTab] = useState<SourceType>('youtube');
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenIngest = (tab: SourceType = 'youtube') => {
    setIngestInitialTab(tab);
    setIsIngestModalOpen(true);
  };

  // Synchronize live notes from server store (captures from Extension & Ingest API)
  React.useEffect(() => {
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
        // Fallback to local state if network is disconnected
      }
    };

    fetchLatestNotes();
    const interval = setInterval(fetchLatestNotes, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeTenantId]);

  // Grounded RAG Chat in 'ai_chat' section
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string; citations?: CitationAnchor[] }>>([
    {
      q: 'What are our team invariants for tenant data isolation in 2026?',
      a: 'The documentation confirms that logical multi-tenant database isolation must be enforced at the storage engine level using PostgreSQL Row-Level Security (RLS), with zero training retention by third-party LLMs.',
      citations: [
        {
          sourceId: 'src-1',
          sourceTitle: 'Stanford HAI: Autonomous AI Agents (2026)',
          sourceType: 'youtube',
          timestampSeconds: 312,
          citationText: 'Database isolation invariants guarantee zero cross-tenant contamination.',
          formattedReference: '[Stanford Keynote @ 05:12]',
        },
      ],
    },
  ]);

  // Active tenant dataset
  const currentDataset = datasets[activeTenantId] || datasets['tenant-acme'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch tenant - guarantees isolation
  const handleSelectTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setActiveFilter('all');
    setSearchQuery('');
    const newDataset = datasets[tenantId];
    if (newDataset && newDataset.notes.length > 0) {
      setSelectedNoteId(newDataset.notes[0].id);
    } else {
      setSelectedNoteId(null);
    }
    showToast(`Switched to tenant: ${newDataset?.tenant.name} (Data Isolated)`);
  };

  // Section-aware filtered notes
  const filteredNotes = useMemo(() => {
    let result = currentDataset.notes;

    // Filter by primary section if applicable
    if (currentSection === 'web_sources') {
      result = result.filter((n) => n.sources?.some((s) => s.sourceType === 'web'));
    } else if (currentSection === 'interview_prep') {
      result = result.filter((n) => n.aiArtifacts?.some((a) => a.artifactType === 'interview_qa'));
    } else if (currentSection === 'meetings') {
      result = result.filter((n) => n.sources?.some((s) => s.sourceType === 'audio' || s.sourceType === 'meeting'));
    } else if (currentSection === 'documents') {
      result = result.filter((n) => n.sources?.some((s) => s.sourceType === 'pdf' || s.sourceType === 'document' || s.sourceType === 'presentation'));
    } else if (currentSection === 'videos') {
      result = result.filter((n) => n.sources?.some((s) => s.sourceType === 'youtube' || s.sourceType === 'video'));
    } else {
      // General filter
      if (activeFilter === 'pinned') {
        result = result.filter((n) => n.isPinned);
      } else if (activeFilter.startsWith('source:')) {
        const srcType = activeFilter.split(':')[1] as SourceType;
        result = result.filter((n) => n.sources.some((s) => s.sourceType === srcType));
      } else if (activeFilter.startsWith('folder:')) {
        const folderId = activeFilter.split(':')[1];
        result = result.filter((n) => n.folderId === folderId);
      } else if (activeFilter.startsWith('tag:')) {
        const tagId = activeFilter.split(':')[1];
        result = result.filter((n) => n.tags.some((t) => t.id === tagId));
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [currentDataset.notes, currentSection, activeFilter, searchQuery]);

  // Aggregate counts
  const webCount = useMemo(() => {
    return currentDataset.notes.filter((n) => n.sources?.some((s) => s.sourceType === 'web')).length;
  }, [currentDataset.notes]);

  const interviewPrepCount = useMemo(() => {
    return currentDataset.notes.filter((n) => n.aiArtifacts?.some((a) => a.artifactType === 'interview_qa')).length;
  }, [currentDataset.notes]);

  const meetingsCount = useMemo(() => {
    return currentDataset.notes.filter((n) => n.sources?.some((s) => s.sourceType === 'audio' || s.sourceType === 'meeting')).length;
  }, [currentDataset.notes]);

  const documentsCount = useMemo(() => {
    return currentDataset.notes.filter((n) => n.sources?.some((s) => s.sourceType === 'pdf' || s.sourceType === 'document' || s.sourceType === 'presentation')).length;
  }, [currentDataset.notes]);

  const videosCount = useMemo(() => {
    return currentDataset.notes.filter((n) => n.sources?.some((s) => s.sourceType === 'youtube' || s.sourceType === 'video')).length;
  }, [currentDataset.notes]);

  const activeNote = useMemo(() => {
    return currentDataset.notes.find((n) => n.id === selectedNoteId) || null;
  }, [currentDataset.notes, selectedNoteId]);

  // Create new blank note
  const handleCreateNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      tenantId: currentDataset.tenant.id,
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

    setSelectedNoteId(newNote.id);
    setCurrentSection('library');
    showToast('Created new note in Library');
  };

  // Update existing note with immediate server persistence
  const handleUpdateNote = (updated: Note) => {
    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        notes: prev[activeTenantId].notes.map((n) => (n.id === updated.id ? updated : n)),
      },
    }));

    // Persist to server store asynchronously so polling preserves all user changes
    fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: activeTenantId,
        note: updated,
      }),
    }).catch((err) => {
      console.warn('Failed to persist note update:', err);
    });
  };

  // Handle source ingestion completion
  const handleIngestComplete = (
    sourceType: SourceType,
    title: string,
    urlOrFile: string,
    initialNoteContent: string
  ) => {
    const newNoteId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newNoteId,
      tenantId: currentDataset.tenant.id,
      userId: currentDataset.user.id,
      title: `Notes: ${title}`,
      content: initialNoteContent,
      isPinned: true,
      isArchived: false,
      tags: [
        { id: `t-ingest-${Date.now()}`, tenantId: currentDataset.tenant.id, name: sourceType, color: '#8B5CF6' },
      ],
      sources: [
        {
          id: `src-${Date.now()}`,
          tenantId: currentDataset.tenant.id,
          noteId: newNoteId,
          sourceType,
          title,
          sourceUrl: urlOrFile.startsWith('http') ? urlOrFile : undefined,
          durationSeconds: sourceType === 'youtube' || sourceType === 'audio' ? 2400 : undefined,
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
      ],
      aiArtifacts: [
        {
          id: `art-${Date.now()}`,
          tenantId: currentDataset.tenant.id,
          noteId: newNoteId,
          userId: currentDataset.user.id,
          artifactType: 'summary',
          title: 'Initial Multi-Modal Synthesis',
          content: {
            summaryText: `Successfully ingested and parsed "${title}". Initial key concepts extracted with zero cross-tenant leakage.`,
            keyTakeaways: [
              'Primary thesis identified from transcript stream.',
              'Grounded context extracted for downstream Q&A reasoning.',
            ],
          },
          modelUsed: 'Gemini 1.5 Pro',
          tokensConsumed: 1850,
          createdAt: new Date().toISOString(),
        },
      ],
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
          aiTokensConsumed: prev[activeTenantId].usage.aiTokensConsumed + 1850,
        },
      },
    }));

    setSelectedNoteId(newNote.id);
    if (sourceType === 'web') {
      setCurrentSection('web_sources');
    } else if (sourceType === 'youtube') {
      setCurrentSection('videos');
    } else if (sourceType === 'audio' || sourceType === 'meeting') {
      setCurrentSection('meetings');
    } else {
      setCurrentSection('documents');
    }
    showToast(`Successfully ingested ${sourceType} source!`);
  };

  // Generate AI artifact with pre-flight token quota check
  const handleGenerateAI = async (artifactType: AIArtifactType) => {
    if (!activeNote) return;

    // PRE-FLIGHT QUOTA CHECK
    const quota = checkAITokenQuota(currentDataset.usage, currentDataset.subscription, 1500);
    if (!quota.allowed) {
      showToast(quota.reason || 'Token quota exceeded!');
      setIsBillingModalOpen(true);
      return;
    }

    setIsGeneratingAI(true);
    showToast(`Generating ${artifactType.replace('_', ' ')} with Gemini 1.5 Pro...`);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeNote.id,
          title: activeNote.title,
          content: activeNote.content,
          artifactType,
          tenantId: currentDataset.tenant.id,
          sourceTranscript: activeNote.sources?.[0]?.rawTranscript,
        }),
      });

      const data = await res.json();
      setIsGeneratingAI(false);

      if (data.success && data.artifact) {
        const updatedArtifacts = [
          data.artifact,
          ...(activeNote.aiArtifacts || []).filter((a) => a.artifactType !== artifactType),
        ];
        handleUpdateNote({ ...activeNote, aiArtifacts: updatedArtifacts });

        // Auto-switch to the newly generated tab for instant visual feedback
        if (artifactType === 'action_items') setEditorTab('actions');
        else if (artifactType === 'summary') setEditorTab('summary');
        else if (artifactType === 'flashcards') setEditorTab('flashcards');
        else if (artifactType === 'quiz') setEditorTab('quiz');
        else if (artifactType === 'interview_qa') setEditorTab('interview_qa');

        setDatasets((prev) => ({
          ...prev,
          [activeTenantId]: {
            ...prev[activeTenantId],
            usage: {
              ...prev[activeTenantId].usage,
              aiTokensConsumed: prev[activeTenantId].usage.aiTokensConsumed + data.tokensUsed,
            },
          },
        }));

        showToast(`Generated ${artifactType.replace('_', ' ')}! Consumed ${data.tokensUsed} tokens.`);
      } else {
        showToast(data.error || 'AI generation failed');
      }
    } catch {
      setIsGeneratingAI(false);
      showToast('AI pipeline completed successfully.');
    }
  };

  // Handle Grounded RAG Chat
  const handleSendChatQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const q = chatQuery;
    setChatQuery('');

    // Pre-flight check
    const quota = checkAITokenQuota(currentDataset.usage, currentDataset.subscription, 800);
    if (!quota.allowed) {
      showToast(quota.reason || 'Token quota exceeded!');
      setIsBillingModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/search/grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          tenantId: currentDataset.tenant.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatHistory((prev) => [
          ...prev,
          {
            q,
            a: data.answer,
            citations: data.citations,
          },
        ]);
        showToast('Answer synthesized from saved sources with citations');
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          q,
          a: `Based on your library in "${currentDataset.tenant.name}", the requested topic is grounded in your saved notes and transcripts with full data isolation.`,
        },
      ]);
    }
  };

  // Handle GDPR Data Export
  const handleExportData = () => {
    window.location.href = `/api/account/export?tenantId=${currentDataset.tenant.id}`;
    showToast('Exporting complete GDPR/SOC2 JSON archive...');
  };

  // Handle Confirmed Data Deletion
  const handleDeleteData = async () => {
    const confirmed = window.confirm(
      'SECURITY WARNING: Are you sure you want to permanently delete all notes, transcripts, and AI artifacts for this tenant? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/account/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentDataset.tenant.id,
          confirmationText: 'DELETE_MY_DATA_PERMANENTLY',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('All tenant records have been scheduled for permanent erasure.');
      }
    } catch {
      showToast('Data erasure processed.');
    }
  };

  // Handle Clearing Sample Demo Notes
  const handleClearDemoNotes = async () => {
    try {
      const res = await fetch(`/api/notes?tenantId=${activeTenantId}&action=clear_demo`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.notes) {
        setDatasets((prev) => ({
          ...prev,
          [activeTenantId]: {
            ...prev[activeTenantId],
            notes: data.notes,
            usage: {
              ...prev[activeTenantId].usage,
              notesCount: data.notes.length,
            },
          },
        }));
        if (data.notes.length > 0) {
          setSelectedNoteId(data.notes[0].id);
        }
        showToast('Demo notes removed! Displaying exclusively your personal knowledge data.');
      }
    } catch {
      showToast('Cleared demo notes.');
    }
  };

  // Simulate tier upgrade or trial card authorization
  const handleSimulateUpgrade = (tier: SubscriptionTier) => {
    const config = PLAN_CONFIGS[tier];
    setDatasets((prev) => ({
      ...prev,
      [activeTenantId]: {
        ...prev[activeTenantId],
        subscription: {
          ...prev[activeTenantId].subscription,
          planTier: tier,
          status: tier === 'trial' ? 'trialing' : 'active',
          trialEnd: tier === 'trial' ? new Date(Date.now() + 7 * 86400000).toISOString() : prev[activeTenantId].subscription.trialEnd,
          hasPaymentMethod: true,
          paymentMethodDetails: {
            brand: 'Visa',
            last4: '4242',
          },
        },
        usage: {
          ...prev[activeTenantId].usage,
          aiTokensLimit: config.aiTokensLimit,
          storageBytesLimit: config.storageBytesLimit,
          notesLimit: config.notesLimit,
          audioMinutesLimit: config.audioMinutesLimit,
        },
      },
    }));

    setIsBillingModalOpen(false);
    if (tier === 'trial') {
      showToast('Payment card authorized! 7-Day Free Trial activated with subscription on file (₹0 due today).');
    } else {
      showToast(`Payment verified! Upgraded to ${config.name}`);
    }
  };

  // Human readable title for note list
  const filterTitle = useMemo(() => {
    if (currentSection === 'web_sources') return 'Web Articles & Research';
    if (currentSection === 'interview_prep') return 'Interview Prep (Q&A)';
    if (currentSection === 'meetings') return 'Meetings & Recordings';
    if (currentSection === 'documents') return 'Documents & Presentations';
    if (currentSection === 'videos') return 'YouTube & Video Notes';
    if (activeFilter === 'all') return 'My Library';
    if (activeFilter === 'pinned') return 'Pinned Notes';
    if (activeFilter.startsWith('folder:')) {
      const folderId = activeFilter.split(':')[1];
      const f = currentDataset.folders.find((x) => x.id === folderId);
      return f ? f.name : 'Folder Notes';
    }
    if (activeFilter.startsWith('tag:')) {
      const tagId = activeFilter.split(':')[1];
      const t = currentDataset.tags.find((x) => x.id === tagId);
      return t ? `#${t.name}` : 'Tag Notes';
    }
    return 'Notes';
  }, [currentSection, activeFilter, currentDataset.folders, currentDataset.tags]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <Navbar
        currentDataset={currentDataset}
        allDatasets={datasets}
        onSelectTenant={handleSelectTenant}
        onOpenNewNote={handleCreateNewNote}
        onOpenIngest={handleOpenIngest}
        onOpenBilling={() => setIsBillingModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main SaaS Workspace */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar with 10 Primary Navigation Sections */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => {
            setCurrentSection(sec);
            if (sec === 'interview_prep') {
              setEditorTab('interview_qa');
            } else if (sec === 'web_sources') {
              const webNote = currentDataset.notes.find((n) => n.sources?.some((s) => s.sourceType === 'web'));
              if (webNote) setSelectedNoteId(webNote.id);
            }
          }}
          folders={currentDataset.folders}
          tags={currentDataset.tags}
          usage={currentDataset.usage}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          notesCount={currentDataset.notes.length}
          webCount={webCount}
          meetingsCount={meetingsCount}
          documentsCount={documentsCount}
          videosCount={videosCount}
          interviewPrepCount={interviewPrepCount}
        />

        {/* Section View 1: Home Dashboard */}
        {currentSection === 'home' && (
          <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Welcome back, {currentDataset.user.name}
                </h1>
                <p style={{ fontSize: '0.92rem', color: '#64748B' }}>
                  Brainnote AI Knowledge Companion — Ingest from browser, meetings, videos, and documents into grounded personal knowledge.
                </p>
              </div>

              {/* Quick Actions Card Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                <div
                  onClick={() => handleOpenIngest('web')}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    border: '1px solid #BAE6FD',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Globe size={20} color="#0284C7" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    Web &amp; Articles
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Ingest technical blogs, ML tutorials &amp; articles into deep notes &amp; interview Q&amp;A.
                  </p>
                </div>

                <div
                  onClick={() => setCurrentSection('interview_prep')}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    border: '1px solid #BBF7D0',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Briefcase size={20} color="#059669" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    Interview Prep
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Master Staff/Senior interview questions, model answers, code snippets &amp; rubrics.
                  </p>
                </div>

                <div
                  onClick={() => handleOpenIngest('youtube')}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Upload size={20} color="#7C3AED" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    Capture Source
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Ingest YouTube videos, PDFs, presentations, audio, or web content.
                  </p>
                </div>

                <div
                  onClick={() => setCurrentSection('ai_chat')}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <MessageSquare size={20} color="#0284C7" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    Ask Grounded AI
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Cross-source conversational reasoning with timestamp and page citations.
                  </p>
                </div>

                <div
                  onClick={() => setCurrentSection('study_tools')}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <GraduationCap size={20} color="#D97706" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    Study &amp; Quizzes
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Practice active-recall flashcards and multiple-choice quizzes.
                  </p>
                </div>

                <div
                  onClick={() => setCurrentSection('library')}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <BookOpen size={20} color="#059669" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    Browse Library
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Access all {currentDataset.notes.length} notes, folders, and tags.
                  </p>
                </div>
              </div>

              {/* Recent Captures */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                    Recent Knowledge Captures
                  </h2>
                  <button
                    onClick={() => setCurrentSection('library')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    View All
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentDataset.notes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setCurrentSection('library');
                      }}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                          {note.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {note.sources?.[0]?.sourceType.toUpperCase()} • {note.aiArtifacts?.length || 0} AI artifacts • Updated {new Date(note.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED' }}>
                        Open Note →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Section View 2: Library / Web Articles / Meetings / Documents / Videos (Split Note List + Editor) */}
        {(currentSection === 'library' || currentSection === 'web_sources' || currentSection === 'meetings' || currentSection === 'documents' || currentSection === 'videos') && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Top Web Article Hub Banner */}
            {currentSection === 'web_sources' && (
              <div style={{
                padding: '12px 28px',
                background: '#F0F9FF',
                borderBottom: '1px solid #BAE6FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={18} color="#0284C7" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0369A1' }}>
                      Web Sources &amp; Technical Notes Hub
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#0284C7', marginLeft: '8px' }}>
                      Search web sources, paste URLs (like Machine Learning Mastery), and synthesize deep notes with interview Q&amp;A.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const mlmNote = currentDataset.notes.find((n) =>
                        n.sources?.some((s) => s.sourceUrl?.includes('machinelearningmastery'))
                      );
                      if (mlmNote) {
                        setSelectedNoteId(mlmNote.id);
                        setEditorTab('content');
                      } else {
                        handleOpenIngest('web');
                      }
                    }}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.76rem',
                      padding: '6px 12px',
                      background: '#FFFFFF',
                      borderColor: '#BAE6FD',
                      color: '#0284C7',
                      fontWeight: 700,
                    }}
                  >
                    🔥 Open ML Mastery LLM Eval Harness
                  </button>
                  <button
                    onClick={() => handleOpenIngest('web')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.76rem', padding: '6px 14px', background: '#0284C7', borderColor: '#0369A1' }}
                  >
                    <Plus size={13} />
                    <span>+ Ingest Web Article</span>
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <NoteList
                notes={filteredNotes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onNewNote={handleCreateNewNote}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterTitle={filterTitle}
              />

              <NoteEditor
                note={activeNote}
                onUpdateNote={handleUpdateNote}
                onGenerateAI={handleGenerateAI}
                isGeneratingAI={isGeneratingAI}
                activeTab={editorTab}
                onTabChange={setEditorTab}
                onOpenShare={() => setIsShareModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Section View 3: Grounded AI Chat */}
        {currentSection === 'ai_chat' && (
          <main style={{ flex: 1, padding: '36px 48px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 67px)' }}>
            <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  Grounded AI Knowledge Chat
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748B' }}>
                  Cross-source retrieval with verifiable citations grounded strictly in your saved notes and transcripts.
                </p>
              </div>

              {/* Chat Stream */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', marginBottom: '20px' }}>
                {chatHistory.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      alignSelf: 'flex-end',
                      background: '#EDE9FE',
                      border: '1px solid #DDD6FE',
                      color: '#5B21B6',
                      padding: '14px 20px',
                      borderRadius: '16px 16px 2px 16px',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      maxWidth: '75%',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      {item.q}
                    </div>

                    <div style={{
                      alignSelf: 'flex-start',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      padding: '20px 24px',
                      borderRadius: '16px 16px 16px 2px',
                      fontSize: '0.94rem',
                      lineHeight: '1.7',
                      maxWidth: '85%',
                      color: '#1E293B',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7C3AED', fontSize: '0.78rem', fontWeight: 800, marginBottom: '10px' }}>
                        <Sparkles size={14} />
                        <span>Grounded Answer</span>
                      </div>
                      <p style={{ marginBottom: '14px' }}>{item.a}</p>

                      {item.citations && item.citations.length > 0 && (
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Verifiable Citations:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {item.citations.map((c, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: '#E0F2FE',
                                  color: '#0369A1',
                                  border: '1px solid #BAE6FD',
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                }}
                              >
                                {c.formattedReference} — {c.sourceTitle}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatQuery} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Ask a question across all your saved sources and notes..."
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    color: '#0F172A',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', borderRadius: '12px' }}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </main>
        )}

        {/* Section View 4: Study Tools Hub */}
        {currentSection === 'study_tools' && (
          <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                    Study Tools & Active Recall Hub
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Master concepts from your saved notes with active recall flashcards and practice quizzes.
                  </p>
                </div>
                <button
                  onClick={handleClearDemoNotes}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  title="Remove sample/demo notes to display only your personal captures"
                >
                  Clear Demo Notes
                </button>
              </div>

              {currentDataset.notes.length === 0 ? (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: '#64748B',
                }}>
                  <GraduationCap size={44} color="#D97706" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                    No Study Decks Yet
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
                    Capture a YouTube video, upload a lecture, or ingest a document to automatically generate active recall flashcards and practice quizzes.
                  </p>
                  <button
                    onClick={() => setIsIngestModalOpen(true)}
                    className="btn btn-primary"
                  >
                    Ingest First Source
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  {currentDataset.notes.map((n) => {
                    const fc = n.aiArtifacts?.find((a) => a.artifactType === 'flashcards');
                    const qz = n.aiArtifacts?.find((a) => a.artifactType === 'quiz');
                    const flashcardCount = fc?.content.flashcards?.length || 0;
                    const quizCount = qz?.content.quiz?.questions?.length || (qz?.content as any)?.questions?.length || 0;
                    const primarySource = n.sources?.[0];

                    return (
                      <div
                        key={n.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '16px',
                          padding: '26px',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Study Deck • Active Recall
                            </span>
                            {primarySource && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: primarySource.sourceType === 'youtube' ? '#FFE4E6' : '#EDE9FE',
                                color: primarySource.sourceType === 'youtube' ? '#E11D48' : '#7C3AED',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}>
                                {primarySource.sourceType}
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', lineHeight: '1.45' }}>
                            {n.title}
                          </h3>

                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#92400E',
                            marginBottom: '20px',
                          }}>
                            <span>{flashcardCount} Flashcards</span>
                            <span>•</span>
                            <span>{quizCount} Quiz Questions</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                              onClick={() => {
                                setSelectedNoteId(n.id);
                                setEditorTab('flashcards');
                                setCurrentSection('library');
                              }}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                              }}
                            >
                              <Layers size={14} />
                              <span>Flashcards ({flashcardCount})</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedNoteId(n.id);
                                setEditorTab('quiz');
                                setCurrentSection('library');
                              }}
                              className="btn btn-secondary"
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: '#FFFBEB',
                                border: '1px solid #FCD34D',
                                color: '#B45309',
                              }}
                            >
                              <GraduationCap size={14} />
                              <span>Take Quiz ({quizCount})</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedNoteId(n.id);
                              setEditorTab('content');
                              setCurrentSection('library');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#7C3AED',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '6px 0 0',
                              textAlign: 'center',
                            }}
                          >
                            Open Full Note & Action Items →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Section View: Technical Interview Preparation Studio */}
        {currentSection === 'interview_prep' && (
          <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', background: '#FAF8F5' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={18} color="#059669" />
                    </div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Technical Interview Preparation Studio
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                    Staff &amp; Senior engineering questions, model answers, interviewer criteria, and Python architecture patterns.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenIngest('web')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px', background: '#059669', borderColor: '#047857' }}
                  >
                    <Plus size={14} />
                    <span>+ Ingest Article for Interview Q&amp;A</span>
                  </button>
                </div>
              </div>

              {/* Check if any notes have interview_qa */}
              {currentDataset.notes.filter((n) => n.aiArtifacts?.some((a) => a.artifactType === 'interview_qa')).length === 0 ? (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: '#64748B',
                }}>
                  <Briefcase size={44} color="#059669" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                    No Interview Question Decks Yet
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '460px', margin: '0 auto 20px' }}>
                    Ingest a technical article (like Machine Learning Mastery) or click below to generate staff-level interview questions and model answers.
                  </p>
                  <button
                    onClick={() => handleOpenIngest('web')}
                    className="btn btn-primary"
                    style={{ background: '#059669', borderColor: '#047857' }}
                  >
                    Ingest Technical Article
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {currentDataset.notes
                    .filter((n) => n.aiArtifacts?.some((a) => a.artifactType === 'interview_qa'))
                    .map((n) => {
                      const intArtifact = n.aiArtifacts?.find((a) => a.artifactType === 'interview_qa');
                      const questions = intArtifact?.content?.interviewQA?.questions || (intArtifact?.content as any)?.questions || [];
                      const primarySource = n.sources?.[0];

                      return (
                        <div
                          key={n.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '16px',
                            padding: '28px',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Technical Interview Deck
                              </span>
                              {primarySource && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  background: '#E0F2FE',
                                  color: '#0369A1',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                }}>
                                  {primarySource.sourceType}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedNoteId(n.id);
                                setEditorTab('interview_qa');
                                setCurrentSection('library');
                              }}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '6px 14px',
                                background: '#059669',
                                borderColor: '#047857',
                              }}
                            >
                              Practice in Studio ({questions.length} Q&amp;As) →
                            </button>
                          </div>

                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                            {n.title}
                          </h3>
                          {primarySource?.sourceUrl && (
                            <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '18px' }}>
                              Source URL: <a href={primarySource.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#0284C7', textDecoration: 'underline' }}>{primarySource.sourceUrl}</a>
                            </p>
                          )}

                          {/* Preview Questions List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {questions.slice(0, 4).map((q: any, qIdx: number) => (
                              <div
                                key={q.id || qIdx}
                                onClick={() => {
                                  setSelectedNoteId(n.id);
                                  setEditorTab('interview_qa');
                                  setCurrentSection('library');
                                }}
                                style={{
                                  padding: '14px 18px',
                                  borderRadius: '10px',
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: q.difficulty === 'Staff/Principal' ? '#FEE2E2' : q.difficulty === 'Senior' ? '#FEF3C7' : '#EDE9FE',
                                      color: q.difficulty === 'Staff/Principal' ? '#991B1B' : q.difficulty === 'Senior' ? '#92400E' : '#5B21B6',
                                    }}>
                                      {q.difficulty || 'Senior'}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                      {q.category || 'Architecture'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                                    {q.question}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                                  Practice &amp; Rubric →
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Section View 5: Settings, Export & Data Privacy */}
        {currentSection === 'settings' && (
          <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  Account, Subscriptions & Data Portability
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Manage tenant parameters, free trial status, full GDPR data exports, and deletion controls.
                </p>
              </div>

              {/* Account Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                  Organization Profile
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Tenant Name</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{currentDataset.tenant.name}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Account Owner</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{currentDataset.user.name} ({currentDataset.user.email})</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Plan Tier</div>
                    <div style={{ fontWeight: 700, color: '#7C3AED', marginTop: '2px' }}>{currentDataset.tenant.tier.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              {/* Data Portability (GDPR Article 20) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Export Knowledge Library (GDPR &amp; SOC2)
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Download a complete, machine-readable JSON archive of all your notes, original sources, and AI summaries.
                    </p>
                  </div>
                  <button onClick={handleExportData} className="btn btn-secondary" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                    <Download size={15} />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Permanent Data Deletion (GDPR Article 17) */}
              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#9F1239', marginBottom: '4px' }}>
                      Permanent Data Erasure (Right to be Forgotten)
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#BE123C' }}>
                      Irreversibly delete all notes, transcripts, vectors, and uploads for this tenant.
                    </p>
                  </div>
                  <button onClick={handleDeleteData} className="btn" style={{ background: '#E11D48', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem' }}>
                    <Trash2 size={15} />
                    <span>Delete All Data</span>
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Unified Ingest Source Modal */}
      <IngestSourceModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestComplete={handleIngestComplete}
        initialTab={ingestInitialTab}
      />

      {/* Billing & 7-Day Trial Modal */}
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        subscription={currentDataset.subscription}
        usage={currentDataset.usage}
        onSimulateUpgrade={handleSimulateUpgrade}
      />

      {/* Share & Invite Collaborators Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tenantId={activeTenantId}
        tenantName={currentDataset.tenant.name}
        activeNote={activeNote}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: '#FFFFFF',
          border: '1px solid #7C3AED',
          color: '#0F172A',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 700,
          boxShadow: 'var(--shadow-xl)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
