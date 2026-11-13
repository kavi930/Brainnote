'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Copy,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
  Download,
  Printer,
  Share2,
  BookMarked,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Filter,
  Folder as FolderIcon,
  Tag as TagIcon,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  GraduationCap,
  X,
  FileText,
  FileCode,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Note, NoteSource, Notebook, Tag, Folder } from '@/types';

interface MyNotesViewProps {
  notes: Note[];
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  initialSelectedNoteId?: string;
  onSaveNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onNavigateToChat: (noteTitle: string, content: string) => void;
  onNavigateToLearning: () => void;
  onOpenShareModal: (note: Note) => void;
  onShowToast: (msg: string) => void;
  activeTenantId: string;
}

export type NoteSortOption = 'updated' | 'created' | 'title';

const DEFAULT_FOLDERS = [
  { id: 'f-all', name: 'All Notes', icon: 'all' },
  { id: 'f-engineering', name: 'Engineering & Architecture', icon: 'folder' },
  { id: 'f-research', name: 'Research & Literature', icon: 'folder' },
  { id: 'f-meetings', name: 'Meetings & Standups', icon: 'folder' },
];

export const MyNotesView: React.FC<MyNotesViewProps> = ({
  notes,
  notebooks,
  activeNotebook,
  initialSelectedNoteId,
  onSaveNote,
  onDeleteNote,
  onNavigateToChat,
  onNavigateToLearning,
  onOpenShareModal,
  onShowToast,
  activeTenantId,
}) => {
  // Active selected note
  const [selectedNoteId, setSelectedNoteId] = useState<string>(initialSelectedNoteId || notes[0]?.id || '');

  // Synchronize when initialSelectedNoteId changes externally
  useEffect(() => {
    if (initialSelectedNoteId && notes.some((n) => n.id === initialSelectedNoteId)) {
      setSelectedNoteId(initialSelectedNoteId);
      setMobileTab('editor');
    }
  }, [initialSelectedNoteId, notes]);

  // Note Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('f-all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<NoteSortOption>('updated');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Editor State
  const [activeTitle, setActiveTitle] = useState('');
  const [activeContent, setActiveContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // History State for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // AI Assistant Panel State
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiActionLabel, setAiActionLabel] = useState<string | null>(null);
  const [customAIQuestion, setCustomAIQuestion] = useState('');

  // Attached Sources Selector
  const [isAttachSourceOpen, setIsAttachSourceOpen] = useState(false);

  // Mobile layout switcher: 'list' | 'editor' | 'ai'
  const [mobileTab, setMobileTab] = useState<'list' | 'editor' | 'ai'>('editor');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Find currently active note
  const currentNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || notes[0] || null;
  }, [notes, selectedNoteId]);

  // Sync editor fields when note selection changes
  useEffect(() => {
    if (currentNote) {
      // Check for unsaved local draft in localStorage first
      const localDraft = localStorage.getItem(`brainnote_draft_${currentNote.id}`);
      if (localDraft && localDraft !== currentNote.content) {
        setActiveContent(localDraft);
      } else {
        setActiveContent(currentNote.content || '');
      }
      setActiveTitle(currentNote.title || '');
      setHistory([currentNote.content || '']);
      setHistoryIndex(0);
      setSaveStatus('saved');
    }
  }, [currentNote?.id]);

  // Word and character count calculations
  const stats = useMemo(() => {
    const chars = activeContent.length;
    const words = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;
    const readingTimeMins = Math.max(1, Math.ceil(words / 200));
    return { chars, words, readingTimeMins };
  }, [activeContent]);

  // Debounced Autosave Handler
  const triggerAutosave = (newTitle: string, newContent: string) => {
    if (!currentNote) return;

    setSaveStatus('saving');
    // Tier 1: Synchronous local buffer (zero loss guarantee)
    localStorage.setItem(`brainnote_draft_${currentNote.id}`, newContent);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const updatedNote: Note = {
          ...currentNote,
          title: newTitle.trim() || 'Untitled Note',
          content: newContent,
          updatedAt: new Date().toISOString(),
        };

        await onSaveNote(updatedNote);
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        setSaveStatus('offline');
      }
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setActiveTitle(val);
    triggerAutosave(val, activeContent);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setActiveContent(val);
    triggerAutosave(activeTitle, val);

    // Push to undo history (throttled)
    if (historyIndex >= 0 && val !== history[historyIndex]) {
      const nextHist = history.slice(0, historyIndex + 1);
      nextHist.push(val);
      if (nextHist.length > 50) nextHist.shift();
      setHistory(nextHist);
      setHistoryIndex(nextHist.length - 1);
    }
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const prevContent = history[nextIdx];
      setHistoryIndex(nextIdx);
      setActiveContent(prevContent);
      triggerAutosave(activeTitle, prevContent);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextContent = history[nextIdx];
      setHistoryIndex(nextIdx);
      setActiveContent(nextContent);
      triggerAutosave(activeTitle, nextContent);
    }
  };

  // Formatting Toolbar Helper
  const applyFormatting = (prefix: string, suffix: string = '', defaultText: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = activeContent.slice(start, end);
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`;

    const newContent = activeContent.slice(0, start) + replacement + activeContent.slice(end);
    setActiveContent(newContent);
    triggerAutosave(activeTitle, newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  // Create Blank Note
  const handleCreateBlankNote = () => {
    const newId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newId,
      tenantId: activeTenantId,
      userId: currentNote?.userId || 'user-default',
      title: 'Untitled Note',
      content: '',
      isPinned: false,
      isArchived: false,
      folderId: selectedFolder !== 'f-all' ? selectedFolder : undefined,
      tags: [],
      sources: [],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveNote(newNote);
    setSelectedNoteId(newId);
    setMobileTab('editor');
    onShowToast('Created blank note.');
  };

  // Duplicate Note
  const handleDuplicateNote = (noteToDuplicate: Note) => {
    const newId = `note-${Date.now()}`;
    const duplicated: Note = {
      ...noteToDuplicate,
      id: newId,
      title: `${noteToDuplicate.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveNote(duplicated);
    setSelectedNoteId(newId);
    onShowToast(`Duplicated note: ${duplicated.title}`);
  };

  // Toggle Note Pin
  const handleTogglePin = (noteToPin: Note) => {
    const updated: Note = {
      ...noteToPin,
      isPinned: !noteToPin.isPinned,
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updated);
    onShowToast(updated.isPinned ? 'Note pinned to top.' : 'Note unpinned.');
  };

  // AI Assistant Invocation
  const handleInvokeAIWriting = async (
    action: 'improve' | 'grammar' | 'expand' | 'key_points' | 'summarize' | 'faq' | 'flashcards' | 'study_guide',
    label: string
  ) => {
    if (!currentNote) return;

    // Check if user has text selected; otherwise use entire note content
    const textarea = textareaRef.current;
    let targetText = activeContent.trim();
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      targetText = activeContent.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    }

    if (!targetText) {
      onShowToast('Please write or select text in your note first.');
      return;
    }

    setIsGeneratingAI(true);
    setAiActionLabel(label);
    setIsAIAssistantOpen(true);

    try {
      if (action === 'flashcards' || action === 'study_guide') {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId: currentNote.id,
            title: currentNote.title,
            content: targetText,
            artifactType: action,
            tenantId: activeTenantId,
          }),
        });
        const data = await res.json();
        setIsGeneratingAI(false);

        if (data.success) {
          if (action === 'flashcards') {
            const count = data.artifact?.content?.flashcards?.length || 0;
            setAiSuggestion(`Generated ${count} flashcard active recall cards from your note. You can review them in the Learning Hub.`);
          } else {
            setAiSuggestion(data.artifact?.content?.studyGuide?.topics ? JSON.stringify(data.artifact.content.studyGuide.topics, null, 2) : 'Study guide synthesized successfully.');
          }
          onShowToast(`Created ${action.replace('_', ' ')} artifact!`);
        } else {
          onShowToast(data.error || 'AI generation failed.');
        }
        return;
      }

      // Standard Writing Assistant Actions
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: currentNote.id,
          title: currentNote.title,
          content: targetText,
          artifactType: 'writing_assist',
          writingAction: action,
          tenantId: activeTenantId,
        }),
      });

      const data = await res.json();
      setIsGeneratingAI(false);

      if (data.success && data.result) {
        setAiSuggestion(data.result);
      } else {
        onShowToast(data.error || 'Failed to process writing assistance.');
      }
    } catch {
      setIsGeneratingAI(false);
      onShowToast('Error connecting to AI writing assistant.');
    }
  };

  // Ask Question about Note
  const handleAskQuestionAboutNote = async () => {
    if (!customAIQuestion.trim() || !currentNote) return;

    setIsGeneratingAI(true);
    setAiActionLabel(`Q: ${customAIQuestion}`);
    setIsAIAssistantOpen(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: currentNote.id,
          title: currentNote.title,
          content: activeContent,
          artifactType: 'qa',
          question: customAIQuestion.trim(),
          tenantId: activeTenantId,
        }),
      });

      const data = await res.json();
      setIsGeneratingAI(false);

      if (data.success && data.artifact?.content?.answer) {
        setAiSuggestion(data.artifact.content.answer);
      } else {
        onShowToast(data.error || 'Could not answer query from note content.');
      }
    } catch {
      setIsGeneratingAI(false);
      onShowToast('Error answering question about note.');
    }
  };

  // Replace Selection or Insert Below
  const handleApplyAISuggestion = (mode: 'replace' | 'insert') => {
    if (!aiSuggestion) return;
    const textarea = textareaRef.current;

    if (mode === 'replace' && textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = activeContent.slice(0, start) + aiSuggestion + activeContent.slice(end);
      setActiveContent(newContent);
      triggerAutosave(activeTitle, newContent);
    } else {
      // Insert below note
      const newContent = `${activeContent.trim()}\n\n---\n${aiSuggestion}`;
      setActiveContent(newContent);
      triggerAutosave(activeTitle, newContent);
    }

    setAiSuggestion(null);
    onShowToast(mode === 'replace' ? 'Replaced selection with AI revision.' : 'Inserted AI text into note.');
  };

  // Export Handlers
  const handleDownloadMarkdown = () => {
    if (!currentNote) return;
    const blob = new Blob([activeContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Downloaded Markdown file.');
  };

  const handleDownloadTxt = () => {
    if (!currentNote) return;
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Downloaded TXT file.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered & Sorted Notes list
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (showPinnedOnly && !n.isPinned) return false;
        if (selectedFolder !== 'f-all' && n.folderId !== selectedFolder) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          if (!matchTitle && !matchContent) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned notes always on top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
  }, [notes, showPinnedOnly, selectedFolder, searchQuery, sortBy]);

  // Aggregate all sources in workspace for attaching
  const availableWorkspaceSources = useMemo(() => {
    const list: NoteSource[] = [];
    notebooks.forEach((nb) => {
      (nb.sources || []).forEach((s) => {
        if (!list.some((existing) => existing.id === s.id)) {
          list.push(s);
        }
      });
    });
    return list;
  }, [notebooks]);

  // Attach a source to active note
  const handleAttachSource = (src: NoteSource) => {
    if (!currentNote) return;
    const existing = currentNote.sources || [];
    if (existing.some((s) => s.id === src.id)) {
      onShowToast('Source is already attached to this note.');
      return;
    }

    const updated: Note = {
      ...currentNote,
      sources: [src, ...existing],
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updated);
    setIsAttachSourceOpen(false);
    onShowToast(`Attached "${src.title}" to note.`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-workspace)] overflow-hidden select-none">
      {/* MOBILE TAB SWITCHER (< 768px) */}
      <div className="flex md:hidden items-center justify-around border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-2 py-1.5 shrink-0 z-10 text-xs">
        <button
          onClick={() => setMobileTab('list')}
          className={`py-1.5 px-3 rounded-lg font-semibold ${mobileTab === 'list'
            ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
            : 'text-[var(--text-muted)]'
            }`}
        >
          Notes ({filteredNotes.length})
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={`py-1.5 px-3 rounded-lg font-semibold ${mobileTab === 'editor'
            ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
            : 'text-[var(--text-muted)]'
            }`}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileTab('ai')}
          className={`py-1.5 px-3 rounded-lg font-semibold ${mobileTab === 'ai'
            ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)]'
            : 'text-[var(--text-muted)]'
            }`}
        >
          AI Assistant
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* =========================================================================
            COLUMN 1: NOTES LIST & NAVIGATOR
           ========================================================================= */}
        <aside
          className={`w-full md:w-72 lg:w-80 h-full border-r border-[var(--border-subtle)] bg-[var(--bg-panel)] flex-col shrink-0 ${mobileTab === 'list' ? 'flex' : 'hidden md:flex'
            }`}
        >
          {/* Top Actions: New Blank Note & Search */}
          <div className="p-3 border-b border-[var(--border-subtle)] space-y-2 shrink-0 bg-[var(--bg-panel-header)]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                My Notes ({filteredNotes.length})
              </span>
              <button
                onClick={handleCreateBlankNote}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus size={13} />
                <span>Blank Note</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Folder & Sort Row */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="py-0.5 px-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-medium max-w-[140px] truncate"
              >
                {DEFAULT_FOLDERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                  className={`p-1 rounded ${showPinnedOnly
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  title={showPinnedOnly ? 'Show all notes' : 'Show pinned only'}
                >
                  <Pin size={13} />
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
                  className="py-0.5 px-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-secondary)] font-medium"
                >
                  <option value="updated">Recent</option>
                  <option value="created">Created</option>
                  <option value="title">A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => {
                const isSelected = note.id === currentNote?.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setMobileTab('editor');
                    }}
                    className={`p-3 cursor-pointer text-left transition-colors relative group ${isSelected
                      ? 'bg-[var(--accent-primary-light)]/40 border-l-2 border-[var(--accent-primary)]'
                      : 'hover:bg-[var(--bg-card-hover)]'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="font-semibold text-xs text-[var(--text-primary)] truncate flex-1">
                        {note.title || 'Untitled Note'}
                      </h4>

                      <div className="flex items-center gap-1 shrink-0">
                        {note.isPinned && (
                          <Pin size={12} className="text-amber-500 fill-amber-500" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(note);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-amber-500 transition-opacity"
                          title="Toggle pin"
                        >
                          <Pin size={11} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-1.5">
                      {note.content ? note.content.slice(0, 140) : 'Blank note...'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateNote(note);
                          }}
                          className="hover:text-[var(--text-primary)]"
                          title="Duplicate Note"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteToDelete(note);
                          }}
                          className="hover:text-rose-500"
                          title="Delete Note"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2">
                <FileText size={24} className="mx-auto opacity-40 mb-1" />
                <p>No notes found.</p>
                <button
                  onClick={handleCreateBlankNote}
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  Create your first note
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* =========================================================================
            COLUMN 2: MAIN WRITING EDITOR
           ========================================================================= */}
        <main
          className={`flex-1 h-full flex flex-col bg-[var(--bg-panel)] overflow-hidden ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'
            }`}
        >
          {currentNote ? (
            <>
              {/* Editor Top Bar: Autosave Pill, Word Count & Export Actions */}
              <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-4 flex items-center justify-between gap-2 shrink-0">
                {/* Autosave Status Pill */}
                <div className="flex items-center gap-2 text-xs">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock size={12} className="animate-spin" />
                      <span>Saving...</span>
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 size={12} />
                      <span>Saved ({lastSavedTime})</span>
                    </span>
                  )}
                  {saveStatus === 'offline' && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle size={12} />
                      <span>Saved locally (Offline)</span>
                    </span>
                  )}

                  <span className="text-[var(--border-medium)]">|</span>
                  <span className="text-[var(--text-muted)] text-[11px]">
                    {stats.words} words &bull; {stats.chars} chars &bull; {stats.readingTimeMins}m read
                  </span>
                </div>

                {/* Right Action Icons: AI Assist, Export, Share */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${isAIAssistantOpen
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white'
                      }`}
                    title="Toggle AI Writing Assistant"
                  >
                    <Sparkles size={13} />
                    <span className="hidden sm:inline">AI Assistant</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                    title="Download Markdown (.md)"
                  >
                    <Download size={15} />
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                    title="Print / Save PDF"
                  >
                    <Printer size={15} />
                  </button>

                  <button
                    onClick={() => onOpenShareModal(currentNote)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                    title="Share Note with Permissions"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="px-4 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-input)]/50 flex flex-wrap items-center gap-1 text-xs shrink-0">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={14} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo size={14} />
                </button>

                <span className="text-[var(--border-subtle)]">|</span>

                <button
                  onClick={() => applyFormatting('# ', '', 'Heading 1')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Heading 1"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('## ', '', 'Heading 2')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Heading 2"
                >
                  <Heading2 size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('### ', '', 'Heading 3')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Heading 3"
                >
                  <Heading3 size={14} />
                </button>

                <span className="text-[var(--border-subtle)]">|</span>

                <button
                  onClick={() => applyFormatting('**', '**', 'bold text')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold"
                  title="Bold (Ctrl+B)"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('*', '*', 'italic text')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] italic"
                  title="Italic (Ctrl+I)"
                >
                  <Italic size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('<u>', '</u>', 'underlined text')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
                  title="Underline"
                >
                  <Underline size={14} />
                </button>

                <span className="text-[var(--border-subtle)]">|</span>

                <button
                  onClick={() => applyFormatting('- ', '', 'list item')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Bullet List"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('1. ', '', 'ordered item')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Numbered List"
                >
                  <ListOrdered size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('- [ ] ', '', 'todo item')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Checklist"
                >
                  <CheckSquare size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('```\n', '\n```', 'code here')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Code Block"
                >
                  <Code size={14} />
                </button>
                <button
                  onClick={() => applyFormatting('[', '](https://example.com)', 'link text')}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Hyperlink"
                >
                  <LinkIcon size={14} />
                </button>
              </div>

              {/* Title & Attached Sources Bar */}
              <div className="px-6 sm:px-10 pt-4 pb-2 shrink-0">
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={activeTitle}
                  onChange={handleTitleChange}
                  className="w-full text-xl sm:text-2xl font-bold bg-transparent text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-faint)] tracking-tight"
                />

                {/* Attached Sources Bar */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Sources:
                  </span>
                  {(currentNote.sources || []).map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                    >
                      <span>{s.title}</span>
                    </span>
                  ))}
                  <button
                    onClick={() => setIsAttachSourceOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary-light)] transition-colors"
                  >
                    <Plus size={11} />
                    <span>Attach Source</span>
                  </button>
                </div>
              </div>

              {/* Main Writing Canvas */}
              <div className="flex-1 px-6 sm:px-10 pb-6 overflow-hidden flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={activeContent}
                  onChange={handleContentChange}
                  placeholder="Start writing or typing Markdown... (Select text to use AI Writing Assistant)"
                  className="w-full flex-1 bg-transparent text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none resize-none leading-relaxed font-sans placeholder:text-[var(--text-faint)]"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
              <FileText size={36} className="opacity-30 mb-2" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">No Note Selected</h3>
              <p className="text-xs max-w-sm mt-1 mb-4">
                Choose an existing note from the list or start fresh with a blank note.
              </p>
              <button
                onClick={handleCreateBlankNote}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
              >
                Create Blank Note
              </button>
            </div>
          )}
        </main>

        {/* =========================================================================
            COLUMN 3: AI WRITING ASSISTANT PANEL (Collapsible on right)
           ========================================================================= */}
        {isAIAssistantOpen && (
          <aside
            className={`w-full md:w-80 lg:w-96 h-full border-l border-[var(--border-subtle)] bg-[var(--bg-panel)] flex-col shrink-0 ${mobileTab === 'ai' ? 'flex' : 'hidden md:flex'
              }`}
          >
            {/* AI Panel Header */}
            <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent-primary)]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  AI Writing Assistant
                </h3>
              </div>
              <button
                onClick={() => setIsAIAssistantOpen(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={15} />
              </button>
            </div>

            {/* AI Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Highlight text in your note to target a specific paragraph, or execute actions on the full note.
              </p>

              {/* 1-Click Writing Actions */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Writing Enhancements
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleInvokeAIWriting('improve', 'Improve Writing')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    ✨ Improve Writing
                  </button>
                  <button
                    onClick={() => handleInvokeAIWriting('grammar', 'Correct Grammar')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    📝 Fix Grammar
                  </button>
                  <button
                    onClick={() => handleInvokeAIWriting('summarize', 'Summarize Note')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    📋 Summarize
                  </button>
                  <button
                    onClick={() => handleInvokeAIWriting('expand', 'Expand Explanation')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    🔍 Expand Detail
                  </button>
                  <button
                    onClick={() => handleInvokeAIWriting('key_points', 'Extract Key Points')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    💡 Key Takeaways
                  </button>
                  <button
                    onClick={() => handleInvokeAIWriting('faq', 'Generate FAQs')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    ❓ Generate FAQs
                  </button>
                </div>
              </div>

              {/* Learning Hub Integrations */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Learning & Memory Hub
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleInvokeAIWriting('flashcards', 'Create Flashcards')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    🗂 Create Flashcards
                  </button>
                  <button
                    onClick={() => handleInvokeAIWriting('study_guide', 'Create Study Guide')}
                    disabled={isGeneratingAI}
                    className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] text-left transition-colors font-medium text-[var(--text-primary)] text-[11px]"
                  >
                    📖 Study Guide
                  </button>
                </div>
              </div>

              {/* Ask Question about Note */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Ask Question about this Note
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Ask about this note..."
                    value={customAIQuestion}
                    onChange={(e) => setCustomAIQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestionAboutNote()}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <button
                    onClick={handleAskQuestionAboutNote}
                    disabled={!customAIQuestion.trim() || isGeneratingAI}
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold disabled:opacity-40"
                  >
                    Ask
                  </button>
                </div>
              </div>

              {/* Loading Indicator */}
              {isGeneratingAI && (
                <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] flex items-center gap-2 text-xs text-[var(--text-muted)] animate-pulse">
                  <Sparkles size={16} className="animate-spin text-[var(--accent-primary)]" />
                  <span>Synthesizing writing suggestion...</span>
                </div>
              )}

              {/* Non-Destructive Review Area */}
              {aiSuggestion && !isGeneratingAI && (
                <div className="p-4 rounded-xl border border-[var(--border-active)] bg-[var(--bg-card)] shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-[var(--accent-primary)]">
                      {aiActionLabel || 'AI Suggestion'}
                    </span>
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap text-[var(--text-primary)] font-mono text-[11px]">
                    {aiSuggestion}
                  </div>

                  {/* Safety Action Buttons */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      onClick={() => handleApplyAISuggestion('replace')}
                      className="w-full py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-semibold text-xs transition-colors"
                    >
                      Replace Selected Text
                    </button>
                    <button
                      onClick={() => handleApplyAISuggestion('insert')}
                      className="w-full py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition-colors"
                    >
                      Insert at End of Note
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiSuggestion);
                        onShowToast('Copied suggestion to clipboard.');
                      }}
                      className="w-full py-1 rounded text-center text-[11px] text-[var(--text-muted)] hover:underline"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* MODAL: Attach Source Picker */}
      {isAttachSourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Attach Source to Note
              </h4>
              <button
                onClick={() => setIsAttachSourceOpen(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Select an ingested YouTube video, PDF, or audio meeting from your workspace to reference in this note.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 mb-4">
              {availableWorkspaceSources.length > 0 ? (
                availableWorkspaceSources.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAttachSource(s)}
                    className="w-full p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-left flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[var(--text-primary)] truncate">{s.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] capitalize">{s.sourceType}</div>
                    </div>
                    <Plus size={14} className="text-[var(--accent-primary)] shrink-0" />
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                  No sources ingested in workspace yet.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsAttachSourceOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs font-semibold text-[var(--text-secondary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Note Confirmation */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-5">
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-2">
              Delete note?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete <strong>{noteToDelete.title}</strong>? This action will remove the note from Supabase and local storage.
            </p>
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setNoteToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteNote(noteToDelete.id);
                  setNoteToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
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
