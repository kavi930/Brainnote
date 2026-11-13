'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  Eye, 
  Save, 
  Printer, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Clock, 
  Sparkles,
  BookMarked,
  Share2,
  BookmarkPlus
} from 'lucide-react';
import { AIArtifact } from '@/types';
import { UniversalArtifactRenderer } from './UniversalArtifactRenderer';
import { RichDocumentContent } from './RichDocumentContent';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Single or multiple artifacts generated
  artifacts: AIArtifact[];
  initialArtifactId?: string;
  notebookTitle?: string;
  onSaveArtifact?: (updatedArtifact: AIArtifact) => void;
  onSaveAsNote?: (title: string, markdown: string) => void;
  onShowToast?: (msg: string) => void;
}

/**
 * Professional Rich Document Viewer & Editor
 * Provides comfortable reading typography, multi-option document navigation,
 * edit mode, copy, Markdown/TXT download, and notebook save verification.
 */
export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  artifacts,
  initialArtifactId,
  notebookTitle = 'Active Notebook',
  onSaveArtifact,
  onSaveAsNote,
  onShowToast,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedText, setEditedText] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Synchronize initial artifact selection
  useEffect(() => {
    if (initialArtifactId && artifacts.length > 0) {
      const idx = artifacts.findIndex((a) => a.id === initialArtifactId);
      if (idx >= 0) setCurrentIdx(idx);
    } else {
      setCurrentIdx(0);
    }
  }, [initialArtifactId, artifacts]);

  const activeArtifact = artifacts[currentIdx] || artifacts[0];

  // Sync edit fields when active artifact changes
  useEffect(() => {
    if (activeArtifact) {
      setEditedTitle(activeArtifact.title || 'Untitled Document');
      // Extract string representation for editing
      const text =
        activeArtifact.content?.summaryText ||
        activeArtifact.content?.formattedMarkdown ||
        activeArtifact.content?.richText ||
        JSON.stringify(activeArtifact.content, null, 2);
      setEditedText(text);
      setIsEditMode(false);
      setIsSaved(true);
    }
  }, [activeArtifact?.id]);

  if (!isOpen || !activeArtifact) return null;

  // Convert current artifact into clean exportable text / markdown
  const getDocumentMarkdown = (art: AIArtifact): string => {
    const header = `# ${art.title}\n*Generated: ${new Date(art.createdAt).toLocaleString()} | Tool: ${art.artifactType.replace('_', ' ')}*\n\n`;

    if (art.content?.summaryText) {
      let body = `## Synthesis\n${art.content.summaryText}\n\n`;
      if (art.content.keyTakeaways && art.content.keyTakeaways.length > 0) {
        body += `## Key Takeaways\n${art.content.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n`;
      }
      return header + body;
    }

    if (art.content?.flashcards) {
      const body = art.content.flashcards
        .map((f, i) => `### Card ${i + 1}: ${f.front}\n**Answer:** ${f.back}\n${f.hint ? `*Hint:* ${f.hint}` : ''}`)
        .join('\n\n');
      return header + body;
    }

    if (art.content?.quiz) {
      const body = art.content.quiz.questions
        .map(
          (q, i) =>
            `### Question ${i + 1}: ${q.question}\n${q.options.map((o, oIdx) => `- [${String.fromCharCode(65 + oIdx)}] ${o} ${oIdx === q.correctOptionIndex ? '(Correct)' : ''}`).join('\n')}\n\n*Explanation:* ${q.explanation}`
        )
        .join('\n\n---\n\n');
      return header + body;
    }

    if (art.content?.interviewQA) {
      const body = art.content.interviewQA.questions
        .map(
          (q, i) =>
            `### Q${i + 1} (${q.difficulty} - ${q.category}): ${q.question}\n\n**Model Answer:**\n${q.answer}\n\n${q.keyCriteria ? `**Evaluation Criteria:**\n${q.keyCriteria.map((k) => `- ${k}`).join('\n')}\n\n` : ''}${q.codeSnippet ? `\`\`\`python\n${q.codeSnippet}\n\`\`\`\n\n` : ''}`
        )
        .join('\n\n---\n\n');
      return header + body;
    }

    if (art.content?.actionItems) {
      const body = art.content.actionItems
        .map((a) => `- [${a.completed ? 'x' : ' '}] ${a.task} ${a.assignee ? `(Owner: ${a.assignee})` : ''} ${a.dueDate ? `[Due: ${a.dueDate}]` : ''}`)
        .join('\n');
      return header + `## Action Items\n${body}`;
    }

    if (art.content?.meetingMinutes) {
      const mm = art.content.meetingMinutes;
      let body = '';
      if (mm.attendees) body += `**Attendees:** ${mm.attendees.join(', ')}\n\n`;
      if (mm.agenda) body += `### Agenda\n${mm.agenda.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n`;
      if (mm.discussionPoints) body += `### Discussion Highlights\n${mm.discussionPoints.map((p) => `- ${p}`).join('\n')}\n\n`;
      if (mm.decisions) body += `### Decisions Made\n${mm.decisions.map((d) => `- ${d}`).join('\n')}\n\n`;
      return header + body;
    }

    return header + (art.content?.formattedMarkdown || art.content?.richText || JSON.stringify(art.content, null, 2));
  };

  const handleCopy = () => {
    const md = getDocumentMarkdown(activeArtifact);
    navigator.clipboard.writeText(md);
    setCopiedStatus(true);
    if (onShowToast) onShowToast('Document copied to clipboard!');
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = getDocumentMarkdown(activeArtifact);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Downloaded Markdown document.');
  };

  const handleDownloadText = () => {
    const md = getDocumentMarkdown(activeArtifact);
    // Strip markdown formatting symbols for plain text
    const plainText = md
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Downloaded plain text document.');
  };

  const handleSaveEdits = () => {
    if (!onSaveArtifact) return;

    const updatedArtifact: AIArtifact = {
      ...activeArtifact,
      title: editedTitle,
      content: {
        ...activeArtifact.content,
        summaryText: editedText,
        formattedMarkdown: editedText,
      },
    };

    onSaveArtifact(updatedArtifact);
    setIsEditMode(false);
    setIsSaved(true);
    if (onShowToast) onShowToast('Saved changes to document!');
  };

  const handleSaveAsStandaloneNote = () => {
    if (!onSaveAsNote) return;
    const md = getDocumentMarkdown(activeArtifact);
    onSaveAsNote(activeArtifact.title, md);
    if (onShowToast) onShowToast('Created new note from this document!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl h-full max-h-[92vh] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* 1. TOP HEADER & DOCUMENT STATUS */}
        <header className="p-3.5 sm:p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                  {activeArtifact.artifactType.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={12} />
                  <span>Saved in {notebookTitle}</span>
                </span>
              </div>

              {!isEditMode ? (
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate mt-0.5">
                  {activeArtifact.title}
                </h2>
              ) : (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => {
                    setEditedTitle(e.target.value);
                    setIsSaved(false);
                  }}
                  className="mt-0.5 px-2 py-0.5 text-sm font-bold rounded-lg border border-[var(--accent-primary)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none w-full max-w-md"
                />
              )}
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Edit / Preview Toggle */}
            <button
              onClick={() => {
                if (isEditMode) {
                  handleSaveEdits();
                } else {
                  setIsEditMode(true);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isEditMode
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]'
              }`}
              title={isEditMode ? 'Save Edits' : 'Edit Document'}
            >
              {isEditMode ? (
                <>
                  <Save size={13} />
                  <span>Save Edits</span>
                </>
              ) : (
                <>
                  <Edit3 size={13} />
                  <span className="hidden sm:inline">Edit</span>
                </>
              )}
            </button>

            {/* Copy Content */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              title="Copy formatted markdown"
            >
              {copiedStatus ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            {/* Download Dropdown / Buttons */}
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              title="Download as Markdown (.md)"
            >
              <Download size={13} />
              <span className="hidden md:inline">.md</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              title="Download as Plain Text (.txt)"
            >
              <Download size={13} />
              <span>.txt</span>
            </button>

            {/* Save as Note */}
            {onSaveAsNote && (
              <button
                onClick={handleSaveAsStandaloneNote}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title="Save as standalone note in My Notes"
              >
                <BookmarkPlus size={13} />
                <span>Save to Notes</span>
              </button>
            )}

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              title="Print / Save as PDF"
            >
              <Printer size={15} />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors ml-1"
              title="Close Viewer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 2. MULTI-DOCUMENT TABS / NAVIGATION BAR (Requirement 3: Separate Document for Every Option) */}
        {artifacts.length > 1 && (
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-input)] flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1 shrink-0">
                Generated Options ({artifacts.length}):
              </span>
              {artifacts.map((art, idx) => (
                <button
                  key={art.id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setIsEditMode(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    currentIdx === idx
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-black/15">
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{art.title}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-card-hover)]"
                title="Previous Document"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-medium text-[var(--text-muted)] px-1">
                {currentIdx + 1}/{artifacts.length}
              </span>
              <button
                disabled={currentIdx === artifacts.length - 1}
                onClick={() => setCurrentIdx((prev) => Math.min(artifacts.length - 1, prev + 1))}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-card-hover)]"
                title="Next Document"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 3. DOCUMENT CANVAS & BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[var(--bg-workspace)]">
          {/* Professional Paper Sheet Container */}
          <article className="max-w-4xl mx-auto bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-sm p-6 sm:p-10 space-y-6">
            {/* Document Header & Metadata Block */}
            <div className="border-b border-[var(--border-subtle)] pb-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1 font-medium">
                  <Clock size={12} />
                  <span>
                    Generated on {new Date(activeArtifact.createdAt).toLocaleDateString()} at{' '}
                    {new Date(activeArtifact.createdAt).toLocaleTimeString()}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Sparkles size={12} className="text-[var(--accent-primary)]" />
                  <span>
                    Engine: {activeArtifact.modelUsed} &bull; {activeArtifact.tokensConsumed} tokens
                  </span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {activeArtifact.title}
              </h1>

              <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">Notebook:</span>
                <span>{notebookTitle}</span>
              </div>
            </div>

            {/* Document Body: Universal Renderer vs Markdown Editor */}
            {!isEditMode ? (
              <UniversalArtifactRenderer artifact={activeArtifact} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-semibold">Markdown Document Source Editor</span>
                  <span>Supports headings, lists, code, and tables</span>
                </div>
                <RichDocumentContent
                  content={editedText}
                  editable={true}
                  onContentChange={(val) => {
                    setEditedText(val);
                    setIsSaved(false);
                  }}
                />
              </div>
            )}
          </article>
        </div>

        {/* 4. FOOTER CONTROLS */}
        <footer className="p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[var(--text-muted)]">
            Artifact ID: <code className="font-mono text-[11px]">{activeArtifact.id}</code>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdits}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save & Apply Edits
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-xs"
              >
                Close Viewer
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
