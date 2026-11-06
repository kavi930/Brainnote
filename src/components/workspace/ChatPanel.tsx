'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  BookmarkPlus, 
  RotateCw, 
  Square, 
  AlertCircle, 
  GraduationCap, 
  Layers, 
  BookOpen, 
  ChevronDown, 
  SlidersHorizontal,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { NotebookMessage, NoteSource, NotebookPersona, CitationAnchor } from '@/types';

interface ChatPanelProps {
  notebookTitle: string;
  messages: NotebookMessage[];
  sources: NoteSource[];
  selectedSourceIds: string[];
  activePersona: NotebookPersona;
  customInstructions?: string;
  onSendMessage: (query: string) => void;
  onSaveAsNote: (content: string) => void;
  onSelectPersona: (persona: NotebookPersona, customText?: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
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

export const ChatPanel: React.FC<ChatPanelProps> = ({
  notebookTitle,
  messages,
  sources,
  selectedSourceIds,
  activePersona,
  customInstructions,
  onSendMessage,
  onSaveAsNote,
  onSelectPersona,
  isGenerating = false,
  onStopGeneration,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
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

  const handleSaveNote = (id: string, content: string) => {
    onSaveAsNote(content);
    setSavedNoteId(id);
    setTimeout(() => setSavedNoteId(null), 2000);
  };

  const selectedCount = selectedSourceIds.length;

  return (
    <main className="flex-1 flex flex-col h-full bg-[var(--bg-panel)] overflow-hidden relative border-r border-[var(--border-subtle)]">
      {/* Top Header: Title & Persona Selector */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <BookOpen size={15} />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-[var(--text-primary)] truncate">
              Chat with your sources
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {notebookTitle}
            </p>
          </div>
        </div>

        {/* Persona Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] text-xs text-[var(--text-secondary)] font-medium transition-colors"
          >
            <SlidersHorizontal size={13} className="text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">{PERSONA_LABELS[activePersona].title}</span>
            <ChevronDown size={13} className="text-[var(--text-muted)]" />
          </button>

          {isPersonaOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPersonaOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] shadow-xl z-50 p-1.5 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Notebook Instructions & Persona
                </div>
                <div className="py-1 max-h-64 overflow-y-auto">
                  {(Object.keys(PERSONA_LABELS) as NotebookPersona[]).map((pKey) => {
                    const isSelected = activePersona === pKey;
                    return (
                      <button
                        key={pKey}
                        onClick={() => {
                          if (pKey === 'custom') {
                            setIsPersonaOpen(false);
                            setShowCustomModal(true);
                          } else {
                            onSelectPersona(pKey);
                            setIsPersonaOpen(false);
                          }
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-semibold'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        <p className="text-xs font-semibold">{PERSONA_LABELS[pKey].title}</p>
                        <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                          {PERSONA_LABELS[pKey].desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grounding Source Context Banner */}
      <div className={`px-4 py-2 border-b text-xs flex items-center justify-between shrink-0 transition-colors ${
        selectedCount > 0 
          ? 'bg-[var(--bg-workspace)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          {selectedCount > 0 ? (
            <>
              <Layers size={13} className="text-[var(--accent-primary)]" />
              <span>
                Grounding answers in <strong>{selectedCount}</strong> selected source{selectedCount > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={13} className="text-amber-600 dark:text-amber-400" />
              <span>
                No sources selected. Check at least one source on the left to ground responses.
              </span>
            </>
          )}
        </div>
        <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
          Verifiable Citations Enabled
        </span>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm rounded-br-none font-medium'
                    : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-panel rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-[var(--accent-primary)]">
                    <Sparkles size={13} />
                    <span>Brainnote AI</span>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {msg.content}
                </div>

                {/* Supporting Evidence Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
                      Evidence:
                    </span>
                    {msg.citations.map((cite, idx) => (
                      <span
                        key={idx}
                        className="citation-pill"
                        title={cite.citationText}
                      >
                        {cite.formattedReference || `[Source ${idx + 1}]`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar on AI Messages */}
              {!isUser && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-muted)] px-1">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 rounded hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                    title="Copy answer"
                  >
                    {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleSaveNote(msg.id, msg.content)}
                    className="p-1 rounded hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                    title="Save response as note"
                  >
                    {savedNoteId === msg.id ? <Check size={12} className="text-emerald-500" /> : <BookmarkPlus size={12} />}
                    <span>{savedNoteId === msg.id ? 'Saved' : 'Save as Note'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Generation State */}
        {isGenerating && (
          <div className="flex items-start gap-2 max-w-[80%]">
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl rounded-bl-none px-4 py-3 shadow-panel text-xs text-[var(--text-secondary)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-xs">
                <Sparkles size={14} className="animate-spin" />
                <span>Reading selected sources & synthesizing answer...</span>
              </div>
              <div className="h-1.5 w-48 bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-primary)] rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (when few messages exist) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">
            <Lightbulb size={12} className="text-[var(--accent-amber)]" />
            <span>Suggested questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(prompt)}
                disabled={isGenerating || selectedCount === 0}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-left truncate max-w-full disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-header)] shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              selectedCount === 0 
                ? 'Select at least one source on the left to ask questions...'
                : 'Ask anything about your selected sources... (Enter to send)'
            }
            rows={2}
            className="w-full resize-none rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 pr-20 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-active)] transition-all"
          />

          <div className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="btn bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg text-xs"
                title="Stop generation"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputQuery.trim() || selectedCount === 0}
                className="btn btn-primary p-1.5 rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send query"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Custom Persona Instructions Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-xl max-w-md w-full p-4 space-y-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[var(--accent-primary)]" />
              Custom Notebook Instructions
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Define custom system instructions to tailor the tone, depth, and output formatting for this notebook.
            </p>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g., You are a senior machine learning researcher. Always provide Python code examples and evaluate edge cases..."
              rows={4}
              className="w-full p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-active)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="btn btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSelectPersona('custom', customText);
                  setShowCustomModal(false);
                }}
                className="btn btn-primary text-xs px-3.5 py-1.5"
              >
                Save Instructions
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
