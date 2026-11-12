'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  BookmarkPlus, 
  RotateCw, 
  SlidersHorizontal, 
  Layers, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  BookMarked, 
  ChevronDown, 
  Lightbulb, 
  Eye, 
  X,
  FileText,
  Youtube,
  Mic,
  Globe
} from 'lucide-react';
import { NotebookMessage, NoteSource, NotebookPersona, CitationAnchor, SourceType } from '@/types';

interface ChatStudioViewProps {
  notebookTitle: string;
  messages: NotebookMessage[];
  sources: NoteSource[];
  selectedSourceIds: string[];
  activePersona: NotebookPersona;
  customInstructions?: string;
  onSendMessage: (query: string) => void;
  onSaveAsNote: (content: string) => void;
  onSelectPersona: (persona: NotebookPersona, customText?: string) => void;
  onToggleSource: (sourceId: string) => void;
  onSelectAllSources: () => void;
  onDeselectAllSources: () => void;
  isGenerating?: boolean;
}

const PERSONA_LABELS: Record<NotebookPersona, { title: string; desc: string }> = {
  default: { title: 'Standard Assistant', desc: 'Balanced, accurate responses strictly grounded in your sources.' },
  teacher: { title: 'Explain Like a Teacher', desc: 'Pedagogical, step-by-step explanations with analogies.' },
  technical: { title: 'Technical & Scientific', desc: 'Rigorous engineering depth with formal terminology.' },
  executive: { title: 'Executive Summary', desc: 'High-level bullet points, business impacts, and decisions.' },
  beginner: { title: 'Beginner-Friendly', desc: 'Accessible language with minimal technical jargon.' },
  exam_prep: { title: 'Exam Preparation', desc: 'Key concepts, practice questions, and memory aids.' },
  research: { title: 'Research Analysis', desc: 'Methodological critique, cross-referencing, and synthesis.' },
  custom: { title: 'Custom Instructions', desc: 'User-specified system behavior and output styling.' },
};

const SUGGESTED_PROMPTS = [
  'Summarize the core arguments across my selected sources',
  'What are the key technical trade-offs discussed?',
  'Generate 3 interview-ready questions with model answers',
  'Create a concise study guide from this material',
];

export const ChatStudioView: React.FC<ChatStudioViewProps> = ({
  notebookTitle,
  messages,
  sources,
  selectedSourceIds,
  activePersona,
  customInstructions,
  onSendMessage,
  onSaveAsNote,
  onSelectPersona,
  onToggleSource,
  onSelectAllSources,
  onDeselectAllSources,
  isGenerating = false,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(false);
  const [activeCitationModal, setActiveCitationModal] = useState<CitationAnchor | null>(null);
  const [customText, setCustomText] = useState(customInstructions || '');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isGenerating) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (id: string, text: string) => {
    onSaveAsNote(text);
    setSavedNoteId(id);
    setTimeout(() => setSavedNoteId(null), 2000);
  };

  const selectedCount = selectedSourceIds.length;

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube': return <Youtube size={13} className="text-red-500" />;
      case 'web': return <Globe size={13} className="text-blue-500" />;
      case 'pdf':
      case 'document': return <FileText size={13} className="text-rose-500" />;
      case 'audio':
      case 'meeting': return <Mic size={13} className="text-purple-500" />;
      default: return <FileText size={13} className="text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-workspace)] overflow-hidden">
      {/* 1. Context & Grounding Header Bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 z-10">
        {/* Left: Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
          >
            <SlidersHorizontal size={14} className="text-[var(--accent-primary)]" />
            <span>Persona: {PERSONA_LABELS[activePersona]?.title || 'Standard'}</span>
            <ChevronDown size={13} className="text-[var(--text-muted)]" />
          </button>

          {isPersonaMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPersonaMenuOpen(false)} />
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl z-50 p-1.5 animate-in fade-in max-h-80 overflow-y-auto">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                  Reasoning Persona
                </div>
                {(Object.keys(PERSONA_LABELS) as NotebookPersona[]).map((pKey) => {
                  const p = PERSONA_LABELS[pKey];
                  const isCur = activePersona === pKey;
                  return (
                    <button
                      key={pKey}
                      onClick={() => {
                        setIsPersonaMenuOpen(false);
                        if (pKey === 'custom') {
                          setShowCustomModal(true);
                        } else {
                          onSelectPersona(pKey);
                        }
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                        isCur
                          ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <div className="font-semibold text-[var(--text-primary)]">{p.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: Grounding Status Pill & Source Selector Popover */}
        <div className="relative">
          <button
            onClick={() => setIsSourceSelectorOpen(!isSourceSelectorOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              selectedCount > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${selectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {selectedCount > 0 ? `${selectedCount} of ${sources.length} sources grounded` : 'No sources grounded'}
            </span>
            <ChevronDown size={13} />
          </button>

          {/* Source Grounding Selector Popover */}
          {isSourceSelectorOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSourceSelectorOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-80 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl z-50 p-2 animate-in fade-in">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border-subtle)] mb-1">
                  <span className="text-[11px] font-bold text-[var(--text-primary)]">
                    Grounded Sources ({selectedCount}/{sources.length})
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={onSelectAllSources}
                      className="text-[var(--accent-primary)] font-semibold hover:underline"
                    >
                      All
                    </button>
                    <span>&bull;</span>
                    <button
                      onClick={onDeselectAllSources}
                      className="text-[var(--text-muted)] font-semibold hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {sources.map((src) => {
                    const isChecked = selectedSourceIds.includes(src.id);
                    return (
                      <button
                        key={src.id}
                        onClick={() => onToggleSource(src.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          isChecked ? 'bg-[var(--accent-primary-light)]/40' : 'hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare size={14} className="text-[var(--accent-primary)] shrink-0" />
                        ) : (
                          <Square size={14} className="text-[var(--text-muted)] shrink-0" />
                        )}
                        <span className="shrink-0">{getSourceIcon(src.sourceType)}</span>
                        <span className="text-[var(--text-primary)] truncate flex-1">{src.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Messages Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center mx-auto shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                Ask anything about {notebookTitle}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
                Every response is mathematically grounded across your selected sources with verifiable page and slide citations.
              </p>
            </div>

            {/* Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto pt-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="p-3 text-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)] text-xs text-[var(--text-secondary)] transition-all shadow-sm"
                >
                  <Lightbulb size={13} className="text-amber-500 mb-1.5" />
                  <div>{prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[var(--accent-primary)] text-white font-medium rounded-tr-none'
                      : 'bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-tl-none space-y-3'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citations list for AI message */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                        <Sparkles size={11} className="text-[var(--accent-primary)]" />
                        <span>Verifiable Citations ({msg.citations.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveCitationModal(c)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-input)] hover:bg-[var(--accent-primary-light)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-subtle)] transition-colors"
                          >
                            <span>{c.formattedReference}</span>
                            <Eye size={10} className="opacity-70" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Action Toolbar (Assistant only) */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <span>&bull;</span>

                      <button
                        onClick={() => handleSave(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                        title="Save to Notebook Notes"
                      >
                        {savedNoteId === msg.id ? <Check size={12} className="text-emerald-500" /> : <BookmarkPlus size={12} />}
                        <span>{savedNoteId === msg.id ? 'Saved' : 'Save as Note'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner Indicator */}
        {isGenerating && (
          <div className="flex gap-3 justify-start items-center text-xs text-[var(--text-muted)] animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0">
              <Sparkles size={14} className="animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center gap-2">
              <span>Synthesizing answer with verified citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Composer / Input Bar */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-panel-header)] p-3 sm:p-4 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] focus-within:border-[var(--accent-primary)] focus-within:bg-[var(--bg-panel)] transition-all">
            <textarea
              rows={2}
              placeholder={
                selectedCount > 0
                  ? `Ask about ${selectedCount} grounded source${selectedCount > 1 ? 's' : ''}... (Shift+Enter for new line)`
                  : 'Select sources above to ask grounded questions...'
              }
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full p-2.5 text-xs bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none resize-none max-h-36"
            />
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isGenerating}
            className="p-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 text-white font-semibold shadow-sm transition-all shrink-0"
            title="Send query"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Citation Inspector Modal */}
      {activeCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent-primary)]" />
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  Evidence Citation
                </h4>
              </div>
              <button
                onClick={() => setActiveCitationModal(null)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Source Title</span>
                <span className="font-semibold text-[var(--text-primary)]">{activeCitationModal.sourceTitle}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Reference Location</span>
                <span className="font-semibold text-[var(--accent-primary)]">{activeCitationModal.formattedReference}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Verifiable Text Excerpt</span>
                <blockquote className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] italic text-[var(--text-secondary)] mt-1">
                  &ldquo;{activeCitationModal.citationText}&rdquo;
                </blockquote>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveCitationModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Persona Instructions Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-5">
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-2">
              Custom Persona Instructions
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Instruct the AI on tone, technical specificity, formatting rules, or target audience.
            </p>
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Always structure answers with an architectural diagram and treat me as a Senior Distributed Systems Engineer."
              className="w-full p-2.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] mb-4 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSelectPersona('custom', customText);
                  setShowCustomModal(false);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-white"
              >
                Save Persona
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

