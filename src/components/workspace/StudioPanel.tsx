'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckSquare, 
  ListOrdered, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  BrainCircuit, 
  GitCompare, 
  Network, 
  Clock, 
  Headphones, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  X,
  Share2,
  FolderOpen
} from 'lucide-react';
import { AIArtifact, AIArtifactType, NoteSource } from '@/types';

interface StudioPanelProps {
  artifacts: AIArtifact[];
  selectedSourceIds: string[];
  sources: NoteSource[];
  onGenerateTool: (toolId: string) => void;
  onDeleteArtifact?: (artifactId: string) => void;
  isGenerating?: boolean;
  generatingToolId?: string | null;
}

interface ToolCardDef {
  id: string;
  artifactType?: AIArtifactType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GROUP_A_NOTES: ToolCardDef[] = [
  { id: 'summary', artifactType: 'summary', title: 'Summary', description: 'Executive brief and core essence of selected sources.', icon: <FileText size={15} className="text-[var(--accent-primary)]" /> },
  { id: 'structured_notes', artifactType: 'summary', title: 'Structured Notes', description: 'Organized hierarchical notes by section and topic.', icon: <ListOrdered size={15} className="text-[var(--accent-cyan)]" /> },
  { id: 'key_takeaways', artifactType: 'summary', title: 'Key Takeaways', description: 'High-signal bullet points for rapid review.', icon: <CheckSquare size={15} className="text-emerald-500" /> },
  { id: 'meeting_minutes', artifactType: 'meeting_minutes', title: 'Meeting Minutes', description: 'Discussion points, attendees, and key decisions.', icon: <Clock size={15} className="text-amber-500" /> },
  { id: 'action_items', artifactType: 'action_items', title: 'Action Items', description: 'Actionable tasks, owners, and next steps.', icon: <CheckSquare size={15} className="text-rose-500" /> },
];

const GROUP_B_LEARNING: ToolCardDef[] = [
  { id: 'study_guide', artifactType: 'study_guide', title: 'Study Guide', description: 'Comprehensive guide covering core themes and terms.', icon: <BookOpen size={15} className="text-indigo-500" /> },
  { id: 'faq', artifactType: 'qa', title: 'Frequently Asked Questions', description: 'Anticipated questions with grounded answers.', icon: <HelpCircle size={15} className="text-teal-500" /> },
  { id: 'flashcards', artifactType: 'flashcards', title: 'Flashcards', description: 'Active recall question & answer memory cards.', icon: <Layers size={15} className="text-violet-500" /> },
  { id: 'quiz', artifactType: 'quiz', title: 'Quiz', description: 'Multiple-choice test with answer explanations.', icon: <BrainCircuit size={15} className="text-sky-500" /> },
  { id: 'revision_notes', artifactType: 'study_guide', title: 'Revision Notes', description: 'Fast cheat-sheet for exam and sprint prep.', icon: <FileText size={15} className="text-purple-500" /> },
];

const GROUP_C_RESEARCH: ToolCardDef[] = [
  { id: 'compare_sources', artifactType: 'summary', title: 'Compare Sources', description: 'Cross-reference themes, contrasts, and consensus.', icon: <GitCompare size={15} className="text-blue-500" /> },
  { id: 'mind_map', artifactType: 'study_guide', title: 'Mind Map', description: 'Visual hierarchy of interconnected concepts.', icon: <Network size={15} className="text-fuchsia-500" /> },
  { id: 'concept_map', artifactType: 'study_guide', title: 'Concept Map', description: 'Relational diagrams connecting key principles.', icon: <Network size={15} className="text-emerald-500" /> },
  { id: 'timeline', artifactType: 'summary', title: 'Timeline', description: 'Chronological progression of events and milestones.', icon: <Clock size={15} className="text-amber-500" /> },
  { id: 'glossary', artifactType: 'study_guide', title: 'Glossary', description: 'Alphabetical reference of domain terms & definitions.', icon: <BookOpen size={15} className="text-cyan-500" /> },
];

const GROUP_D_AUDIO: ToolCardDef[] = [
  { id: 'audio_overview', artifactType: 'summary', title: 'Audio Overview', description: 'Deep-dive conversational podcast overview of sources.', icon: <Headphones size={15} className="text-rose-500" /> },
];

export const StudioPanel: React.FC<StudioPanelProps> = ({
  artifacts,
  selectedSourceIds,
  sources,
  onGenerateTool,
  onDeleteArtifact,
  isGenerating = false,
  generatingToolId = null,
}) => {
  const [selectedArtifact, setSelectedArtifact] = useState<AIArtifact | null>(null);
  const selectedCount = selectedSourceIds.length;

  return (
    <aside className="w-full md:w-[330px] lg:w-[350px] flex-shrink-0 flex flex-col h-full bg-[var(--bg-panel)] overflow-hidden">
      {/* Studio Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-header)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
            <Sparkles size={15} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[var(--text-primary)]">Studio</h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Transform sources into artifacts
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
          {artifacts.length} saved
        </span>
      </div>

      {/* Tool Categories & Artifacts Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Saved Notebook Artifacts Section (if any exist) */}
        {artifacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
              <span className="flex items-center gap-1.5">
                <FolderOpen size={13} className="text-[var(--accent-primary)]" />
                Saved Artifacts ({artifacts.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {artifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className="p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {art.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--text-muted)] shrink-0">
                    <span className="text-[10px] hidden group-hover:inline">View</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUP A — NOTES */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Group A — Notes
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {GROUP_A_NOTES.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                disabled={selectedCount === 0 || isGenerating}
                isGenerating={generatingToolId === tool.id}
                onSelect={() => onGenerateTool(tool.id)}
              />
            ))}
          </div>
        </div>

        {/* GROUP B — LEARNING */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Group B — Learning
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {GROUP_B_LEARNING.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                disabled={selectedCount === 0 || isGenerating}
                isGenerating={generatingToolId === tool.id}
                onSelect={() => onGenerateTool(tool.id)}
              />
            ))}
          </div>
        </div>

        {/* GROUP C — RESEARCH AND ANALYSIS */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Group C — Research & Analysis
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {GROUP_C_RESEARCH.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                disabled={selectedCount === 0 || isGenerating}
                isGenerating={generatingToolId === tool.id}
                onSelect={() => onGenerateTool(tool.id)}
              />
            ))}
          </div>
        </div>

        {/* GROUP D — AUDIO */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
            Group D — Audio
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {GROUP_D_AUDIO.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                disabled={selectedCount === 0 || isGenerating}
                isGenerating={generatingToolId === tool.id}
                onSelect={() => onGenerateTool(tool.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Artifact Viewer Drawer */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-panel)] h-full border-l border-[var(--border-subtle)] shadow-2xl flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent-primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)] truncate max-w-[320px]">
                  {selectedArtifact.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-input)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
              <div className="p-3.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] whitespace-pre-wrap font-sans">
                {selectedArtifact.content.summaryText ||
                  JSON.stringify(selectedArtifact.content, null, 2)}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              {onDeleteArtifact && (
                <button
                  onClick={() => {
                    onDeleteArtifact(selectedArtifact.id);
                    setSelectedArtifact(null);
                  }}
                  className="btn text-rose-500 hover:bg-rose-500/10 text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={() => setSelectedArtifact(null)}
                className="btn btn-secondary text-xs px-4 py-1.5 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

interface ToolCardProps {
  tool: ToolCardDef;
  disabled: boolean;
  isGenerating: boolean;
  onSelect: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  disabled,
  isGenerating,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
        disabled
          ? 'bg-[var(--bg-card)] border-[var(--border-subtle)] opacity-60 cursor-not-allowed'
          : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] shadow-sm'
      }`}
    >
      <div className="p-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)] shrink-0 mt-0.5">
        {tool.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
            {tool.title}
          </p>
          {isGenerating && (
            <span className="text-[10px] text-[var(--accent-primary)] animate-pulse font-medium">
              Generating...
            </span>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
          {tool.description}
        </p>
      </div>
    </button>
  );
};
