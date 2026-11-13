'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  ListOrdered,
  CheckSquare,
  Clock,
  BookOpen,
  HelpCircle,
  Layers,
  BrainCircuit,
  GitCompare,
  Network,
  Headphones,
  Briefcase,
  Eye,
  Trash2,
  Copy,
  Check,
  Download,
  X,
  BookMarked,
  ChevronRight,
  Share2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { AIArtifact, NoteSource, AIArtifactType } from '@/types';
import { DocumentViewerModal } from '@/components/document/DocumentViewerModal';

interface CreationStudioViewProps {
  artifacts: AIArtifact[];
  selectedSourceIds: string[];
  sources: NoteSource[];
  activeNotebookTitle: string;
  onGenerateTool: (toolId: string) => void;
  onDeleteArtifact?: (artifactId: string) => void;
  onSaveArtifact?: (artifact: AIArtifact) => void;
  onSaveAsNote?: (title: string, content: string) => void;
  onShowToast?: (msg: string) => void;
  isGenerating?: boolean;
  generatingToolId?: string | null;
  viewerArtifactId?: string | null;
  onCloseViewer?: () => void;
  onOpenArtifact?: (artifactId: string) => void;
}

interface ToolCategory {
  id: string;
  title: string;
  description: string;
  tools: {
    id: string;
    artifactType: AIArtifactType;
    title: string;
    description: string;
    icon: React.ReactNode;
    tokensEst: number;
  }[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'notes_summaries',
    title: 'A. Notes & Summaries',
    description: 'Transform raw transcripts and literature into structured enterprise briefs',
    tools: [
      {
        id: 'summary',
        artifactType: 'summary',
        title: 'Executive Summary',
        description: 'Concise high-level overview highlighting core conclusions.',
        icon: <FileText size={18} className="text-[var(--accent-primary)]" />,
        tokensEst: 800,
      },
      {
        id: 'structured_notes',
        artifactType: 'structured_notes',
        title: 'Structured Notes',
        description: 'Hierarchical breakdown arranged logically by topic and section.',
        icon: <ListOrdered size={18} className="text-cyan-500" />,
        tokensEst: 1100,
      },
      {
        id: 'key_takeaways',
        artifactType: 'key_takeaways',
        title: 'Key Takeaways',
        description: 'High-signal bullet points engineered for fast retention.',
        icon: <CheckSquare size={18} className="text-emerald-500" />,
        tokensEst: 650,
      },
      {
        id: 'action_items',
        artifactType: 'action_items',
        title: 'Action Items',
        description: 'Actionable to-dos with suggested owners and priorities.',
        icon: <CheckSquare size={18} className="text-rose-500" />,
        tokensEst: 750,
      },
    ],
  },
  {
    id: 'learning',
    title: 'B. Learning & Active Recall',
    description: 'Pedagogical synthesis for rapid comprehension and memorization',
    tools: [
      {
        id: 'study_guide',
        artifactType: 'study_guide',
        title: 'Study Guide',
        description: 'Comprehensive curriculum with essential terms and summaries.',
        icon: <BookOpen size={18} className="text-indigo-500" />,
        tokensEst: 1400,
      },
      {
        id: 'faq',
        artifactType: 'qa',
        title: 'FAQs & Core Concepts',
        description: 'Anticipated learner questions answered with citations.',
        icon: <HelpCircle size={18} className="text-teal-500" />,
        tokensEst: 950,
      },
      {
        id: 'flashcards',
        artifactType: 'flashcards',
        title: 'Flashcards Study Deck',
        description: 'Question & answer active recall cards for memory reinforcement.',
        icon: <Layers size={18} className="text-violet-500" />,
        tokensEst: 1200,
      },
      {
        id: 'quiz',
        artifactType: 'quiz',
        title: 'Interactive Quiz',
        description: 'Multiple-choice test questions with answer explanations.',
        icon: <BrainCircuit size={18} className="text-sky-500" />,
        tokensEst: 1300,
      },
      {
        id: 'revision_notes',
        artifactType: 'study_guide',
        title: 'Revision Cheat-Sheet',
        description: 'Ultra-concentrated notes for sprint or exam prep.',
        icon: <FileText size={18} className="text-purple-500" />,
        tokensEst: 900,
      },
      {
        id: 'interview_prep',
        artifactType: 'interview_qa',
        title: 'Technical Interview Preparation',
        description: 'Domain interview questions with evaluation rubrics and answers.',
        icon: <Briefcase size={18} className="text-amber-500" />,
        tokensEst: 1500,
      },
    ],
  },
  {
    id: 'research',
    title: 'C. Research & Visualization',
    description: 'Cross-reference and structure complex relational domain knowledge',
    tools: [
      {
        id: 'compare_sources',
        artifactType: 'compare_sources',
        title: 'Compare Sources',
        description: 'Analyze points of consensus and contradiction across sources.',
        icon: <GitCompare size={18} className="text-blue-500" />,
        tokensEst: 1200,
      },
      {
        id: 'mind_map',
        artifactType: 'mind_map',
        title: 'Mind Map Blueprint',
        description: 'Hierarchical node outline for spatial memory visualization.',
        icon: <Network size={18} className="text-fuchsia-500" />,
        tokensEst: 850,
      },
      {
        id: 'concept_map',
        artifactType: 'concept_map',
        title: 'Concept Map',
        description: 'Relational concept connections and structural dependencies.',
        icon: <Network size={18} className="text-emerald-500" />,
        tokensEst: 900,
      },
      {
        id: 'timeline',
        artifactType: 'timeline',
        title: 'Timeline & Milestones',
        description: 'Chronological progression of historical or technical events.',
        icon: <Clock size={18} className="text-amber-500" />,
        tokensEst: 700,
      },
      {
        id: 'glossary',
        artifactType: 'glossary',
        title: 'Domain Glossary',
        description: 'Alphabetical reference guide of key terms and abbreviations.',
        icon: <BookOpen size={18} className="text-cyan-500" />,
        tokensEst: 800,
      },
    ],
  },
  {
    id: 'meetings',
    title: 'D. Meeting Intelligence',
    description: 'Transform discussions, standups, and lectures into actionable outcomes',
    tools: [
      {
        id: 'meeting_minutes',
        artifactType: 'meeting_minutes',
        title: 'Meeting Minutes',
        description: 'Executive notes, attendee contributions, and topics discussed.',
        icon: <Clock size={18} className="text-amber-500" />,
        tokensEst: 950,
      },
      {
        id: 'decisions',
        artifactType: 'decisions',
        title: 'Key Decisions Log',
        description: 'Explicit log of agreed architecture, design, and roadmap choices.',
        icon: <CheckSquare size={18} className="text-emerald-500" />,
        tokensEst: 700,
      },
      {
        id: 'audio_overview',
        artifactType: 'audio_overview',
        title: 'Audio Overview Narrative',
        description: 'Engaging, conversational deep-dive narrative script of sources.',
        icon: <Headphones size={18} className="text-rose-500" />,
        tokensEst: 1600,
      },
    ],
  },
];

export const CreationStudioView: React.FC<CreationStudioViewProps> = ({
  artifacts,
  selectedSourceIds,
  sources,
  activeNotebookTitle,
  onGenerateTool,
  onDeleteArtifact,
  onSaveArtifact,
  onSaveAsNote,
  onShowToast,
  isGenerating = false,
  generatingToolId = null,
  viewerArtifactId = null,
  onCloseViewer,
  onOpenArtifact,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeViewerId, setActiveViewerId] = useState<string | null>(viewerArtifactId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenArtifact = (id: string) => {
    if (onOpenArtifact) {
      onOpenArtifact(id);
    } else {
      setActiveViewerId(id);
    }
  };

  // Sync when viewerArtifactId changes from parent
  React.useEffect(() => {
    if (viewerArtifactId) {
      setActiveViewerId(viewerArtifactId);
    }
  }, [viewerArtifactId]);

  const selectedCount = selectedSourceIds.length;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) onShowToast('Copied content to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCategories = activeCategory === 'all'
    ? TOOL_CATEGORIES
    : TOOL_CATEGORIES.filter((c) => c.id === activeCategory);

  // Recent generated options (cluster of latest generated documents)
  const recentArtifacts = artifacts.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Source Grounding Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent-primary)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              AI Creation Studio
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Active Notebook: <span className="font-semibold text-[var(--text-primary)]">{activeNotebookTitle}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedCount > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}>
            {selectedCount > 0 ? `${selectedCount} sources selected for grounding` : '0 sources selected (Check sources in library)'}
          </span>
        </div>
      </div>

      {/* 2. RESULTS PANEL: Individual Document Cards for Generated Options (Requirement 3) */}
      {recentArtifacts.length > 0 && (
        <div className="p-4 rounded-2xl border-2 border-[var(--accent-primary)]/20 bg-gradient-to-r from-[var(--bg-panel)] via-[var(--bg-panel)] to-[var(--accent-primary-light)]/20 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                Generated Document Options ({recentArtifacts.length})
              </h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Each option is stored as an independent document
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentArtifacts.map((art, idx) => (
              <div
                key={art.id}
                onClick={() => handleOpenArtifact(art.id)}
                className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                      Option {idx + 1}: {art.artifactType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(art.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-primary)] transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1">
                    {art.content?.summaryText ||
                      (art.content?.flashcards ? `${art.content.flashcards.length} cards` : '') ||
                      (art.content?.quiz ? `${art.content.quiz.questions.length} quiz questions` : '') ||
                      'Formatted document ready for inspection & export.'}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--accent-primary)]">
                  <span className="flex items-center gap-1 group-hover:underline">
                    <Eye size={12} />
                    <span>Open Document</span>
                  </span>
                  <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Category Tab Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${activeCategory === 'all'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]'
            }`}
        >
          All Categories (18 Tools)
        </button>
        {TOOL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${activeCategory === cat.id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]'
              }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* 4. Categorized Tool Cards Grid */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                {category.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {category.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {category.tools.map((tool) => {
                const isThisToolGenerating = isGenerating && generatingToolId === tool.id;

                return (
                  <div
                    key={tool.id}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-medium)] transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center mb-3">
                        {tool.icon}
                      </div>

                      <h4 className="font-bold text-xs text-[var(--text-primary)] mb-1">
                        {tool.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                        {tool.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        ~{tool.tokensEst} tokens
                      </span>

                      <button
                        onClick={() => onGenerateTool(tool.id)}
                        disabled={isGenerating || selectedCount === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isThisToolGenerating
                            ? 'bg-[var(--accent-primary)] text-white opacity-80 cursor-wait'
                            : selectedCount === 0
                              ? 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-not-allowed opacity-60'
                              : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-xs cursor-pointer'
                          }`}
                        title={selectedCount === 0 ? 'Select at least one source first' : `Generate ${tool.title}`}
                      >
                        {isThisToolGenerating ? (
                          <>
                            <Sparkles size={13} className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Generate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 5. All Saved Artifacts Section */}
      <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              All Saved Documents & Artifacts ({artifacts.length})
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Persisted in PostgreSQL with rich document viewing, Markdown, and TXT export.
            </p>
          </div>
        </div>

        {artifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-xs hover:border-[var(--border-medium)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                      {art.artifactType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {new Date(art.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-[var(--text-primary)] line-clamp-1 mb-1">
                    {art.title}
                  </h4>
                  <div className="text-[10px] text-[var(--text-muted)] mb-2">
                    Engine: {art.modelUsed} &bull; {art.tokensConsumed} tokens
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => handleOpenArtifact(art.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    <Eye size={13} />
                    <span>View Document</span>
                  </button>

                  {onDeleteArtifact && (
                    <button
                      onClick={() => onDeleteArtifact(art.id)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Artifact"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs text-[var(--text-muted)]">
            No artifacts generated in this notebook yet. Select sources and click Generate on any tool above.
          </div>
        )}
      </div>

      {/* 6. Universal Professional Document Viewer Modal (Automatic Opening & Option Tabs) */}
      {!onOpenArtifact && activeViewerId && (
        <DocumentViewerModal
          isOpen={Boolean(activeViewerId)}
          onClose={() => {
            setActiveViewerId(null);
            if (onCloseViewer) onCloseViewer();
          }}
          artifacts={artifacts}
          initialArtifactId={activeViewerId}
          notebookTitle={activeNotebookTitle}
          onSaveArtifact={onSaveArtifact}
          onSaveAsNote={onSaveAsNote}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
