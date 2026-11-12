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
  Share2
} from 'lucide-react';
import { AIArtifact, NoteSource, AIArtifactType } from '@/types';

interface CreationStudioViewProps {
  artifacts: AIArtifact[];
  selectedSourceIds: string[];
  sources: NoteSource[];
  activeNotebookTitle: string;
  onGenerateTool: (toolId: string) => void;
  onDeleteArtifact?: (artifactId: string) => void;
  isGenerating?: boolean;
  generatingToolId?: string | null;
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
        artifactType: 'summary',
        title: 'Structured Notes',
        description: 'Hierarchical breakdown arranged logically by topic and section.',
        icon: <ListOrdered size={18} className="text-cyan-500" />,
        tokensEst: 1100,
      },
      {
        id: 'key_takeaways',
        artifactType: 'summary',
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
        artifactType: 'summary',
        title: 'Compare Sources',
        description: 'Analyze points of consensus and contradiction across sources.',
        icon: <GitCompare size={18} className="text-blue-500" />,
        tokensEst: 1200,
      },
      {
        id: 'mind_map',
        artifactType: 'study_guide',
        title: 'Mind Map Blueprint',
        description: 'Hierarchical node outline for spatial memory visualization.',
        icon: <Network size={18} className="text-fuchsia-500" />,
        tokensEst: 850,
      },
      {
        id: 'concept_map',
        artifactType: 'study_guide',
        title: 'Concept Map',
        description: 'Relational concept connections and structural dependencies.',
        icon: <Network size={18} className="text-emerald-500" />,
        tokensEst: 900,
      },
      {
        id: 'timeline',
        artifactType: 'summary',
        title: 'Timeline & Milestones',
        description: 'Chronological progression of historical or technical events.',
        icon: <Clock size={18} className="text-amber-500" />,
        tokensEst: 700,
      },
      {
        id: 'glossary',
        artifactType: 'study_guide',
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
        artifactType: 'meeting_minutes',
        title: 'Key Decisions Log',
        description: 'Explicit log of agreed architecture, design, and roadmap choices.',
        icon: <CheckSquare size={18} className="text-emerald-500" />,
        tokensEst: 700,
      },
      {
        id: 'audio_overview',
        artifactType: 'summary',
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
  isGenerating = false,
  generatingToolId = null,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<AIArtifact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedCount = selectedSourceIds.length;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCategories = activeCategory === 'all'
    ? TOOL_CATEGORIES
    : TOOL_CATEGORIES.filter((c) => c.id === activeCategory);

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
            Notebook: <span className="font-semibold text-[var(--text-primary)]">{activeNotebookTitle}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            selectedCount > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}>
            {selectedCount > 0 ? `${selectedCount} sources selected for synthesis` : '0 sources selected'}
          </span>
        </div>
      </div>

      {/* 2. Category Tab Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            activeCategory === 'all'
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
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              activeCategory === cat.id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* 3. Tool Cards Grid Section */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">{category.title}</h3>
              <p className="text-xs text-[var(--text-muted)]">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.tools.map((tool) => {
                const isThisToolGenerating = isGenerating && generatingToolId === tool.id;
                return (
                  <div
                    key={tool.id}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--accent-primary)] hover:shadow-sm transition-all flex flex-col justify-between text-left group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] group-hover:scale-105 transition-transform">
                          {tool.icon}
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">
                          ~{tool.tokensEst} tokens
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-[var(--text-primary)] mb-1">
                        {tool.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3">
                        {tool.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onGenerateTool(tool.id)}
                      disabled={isGenerating || selectedCount === 0}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--accent-primary-light)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-white disabled:opacity-40 transition-colors"
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
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Saved Artifacts Section */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            Saved Artifacts in this Notebook ({artifacts.length})
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            Stored in PostgreSQL with full Markdown export
          </span>
        </div>

        {artifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm hover:border-[var(--border-medium)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                      {art.artifactType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
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
                    onClick={() => setSelectedArtifact(art)}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    <Eye size={13} />
                    <span>View & Export</span>
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
            No artifacts generated in this notebook yet. Choose a tool above to synthesize notes or learning materials.
          </div>
        )}
      </div>

      {/* Artifact Full Preview Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                  {selectedArtifact.artifactType.replace('_', ' ')}
                </span>
                <h3 className="font-bold text-sm text-[var(--text-primary)] mt-1">
                  {selectedArtifact.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 text-xs text-[var(--text-primary)] leading-relaxed space-y-3">
              {/* Content rendering based on artifact type */}
              {selectedArtifact.content?.summaryText && (
                <div className="whitespace-pre-wrap">{selectedArtifact.content.summaryText}</div>
              )}
              {selectedArtifact.content?.studyGuide?.topics && (
                <div className="space-y-3">
                  {selectedArtifact.content.studyGuide.topics.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                      <h4 className="font-bold text-xs text-[var(--text-primary)] mb-1">{t.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{t.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
              {selectedArtifact.content?.actionItems && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Action Items ({selectedArtifact.content.actionItems.length})
                  </h4>
                  {selectedArtifact.content.actionItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-start gap-2">
                      <CheckSquare size={14} className="text-[var(--accent-primary)] mt-0.5" />
                      <div>
                        <div className="font-semibold text-xs text-[var(--text-primary)]">{item.task}</div>
                        {item.assignee && (
                          <div className="text-[10px] text-[var(--text-muted)]">Owner: {item.assignee}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedArtifact.content?.flashcards && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Flashcard Questions ({selectedArtifact.content.flashcards.length})
                  </h4>
                  {selectedArtifact.content.flashcards.map((fc, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                      <div className="font-bold text-xs text-[var(--text-primary)]">Q: {fc.front}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">A: {fc.back}</div>
                    </div>
                  ))}
                </div>
              )}
              {selectedArtifact.content?.quiz && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Quiz Questions ({selectedArtifact.content.quiz.questions.length})
                  </h4>
                  {selectedArtifact.content.quiz.questions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1.5">
                      <div className="font-bold text-xs text-[var(--text-primary)]">{idx + 1}. {q.question}</div>
                      <div className="space-y-1 pl-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`text-[11px] ${oIdx === q.correctOptionIndex ? 'font-bold text-emerald-600' : 'text-[var(--text-secondary)]'}`}>
                            {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctOptionIndex && '(Correct)'}
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] italic pt-1 border-t border-[var(--border-subtle)]">
                        Explanation: {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!selectedArtifact.content?.summaryText && 
               !selectedArtifact.content?.studyGuide?.topics && 
               !selectedArtifact.content?.actionItems && 
               !selectedArtifact.content?.flashcards && 
               !selectedArtifact.content?.quiz && (
                <pre className="p-3 rounded-lg bg-[var(--bg-input)] font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedArtifact.content, null, 2)}
                </pre>
              )}
            </div>

            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between">
              <button
                onClick={() => {
                  const contentStr = selectedArtifact.content?.summaryText || 
                                     JSON.stringify(selectedArtifact.content, null, 2);
                  handleCopy(selectedArtifact.id, contentStr);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {copiedId === selectedArtifact.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedId === selectedArtifact.id ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={() => setSelectedArtifact(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
