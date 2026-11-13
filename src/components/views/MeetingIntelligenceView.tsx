'use client';

import React from 'react';
import { 
  Mic, 
  Users, 
  Clock, 
  CheckSquare, 
  Play, 
  Plus, 
  Headphones, 
  Sparkles, 
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Notebook, NoteSource, AIArtifact, SourceType } from '@/types';
import { UniversalArtifactRenderer } from '../document/UniversalArtifactRenderer';

interface MeetingIntelligenceViewProps {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  onOpenCapture: (tab?: SourceType) => void;
  onGenerateTool: (toolId: string) => void;
  isGenerating?: boolean;
  onOpenArtifact?: (artifactId: string) => void;
}

export const MeetingIntelligenceView: React.FC<MeetingIntelligenceViewProps> = ({
  notebooks,
  activeNotebook,
  onOpenCapture,
  onGenerateTool,
  isGenerating = false,
  onOpenArtifact,
}) => {
  // Filter all audio and meeting sources
  const meetingSources: (NoteSource & { notebookTitle: string })[] = [];
  notebooks.forEach((nb) => {
    (nb.sources || []).forEach((src) => {
      if (['audio', 'meeting', 'video'].includes(src.sourceType)) {
        meetingSources.push({ ...src, notebookTitle: nb.title });
      }
    });
  });

  const meetingArtifacts: AIArtifact[] = (activeNotebook?.artifacts || []).filter(
    (a) => ['meeting_minutes', 'action_items', 'decisions', 'audio_overview'].includes(a.artifactType)
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* 1. Header & Live Meeting Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Mic size={18} className="text-purple-500" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Meeting Intelligence
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Ingest meeting recordings, multi-speaker transcripts, and extract automated action items with owner assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCapture('audio')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Mic size={14} />
            <span>Record / Upload Audio</span>
          </button>
        </div>
      </div>

      {/* 2. Meeting Action Tools Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col justify-between">
          <div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 w-fit mb-2">
              <Clock size={16} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-primary)] mb-1">
              Meeting Minutes
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-3">
              Synthesize structured minutes covering attendee topics, key arguments, and consensus.
            </p>
          </div>
          <button
            onClick={() => onGenerateTool('meeting_minutes')}
            disabled={isGenerating}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles size={13} />
            <span>Generate Minutes</span>
          </button>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col justify-between">
          <div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 w-fit mb-2">
              <CheckSquare size={16} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-primary)] mb-1">
              Action Items & Decisions
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-3">
              Detect explicit commitments, assignees, deadlines, and architectural decisions.
            </p>
          </div>
          <button
            onClick={() => onGenerateTool('action_items')}
            disabled={isGenerating}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles size={13} />
            <span>Extract Action Items</span>
          </button>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col justify-between">
          <div>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 w-fit mb-2">
              <Headphones size={16} />
            </div>
            <h4 className="font-bold text-xs text-[var(--text-primary)] mb-1">
              Audio Overview Script
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-3">
              Generate a conversational two-host deep dive narrative exploring the core themes.
            </p>
          </div>
          <button
            onClick={() => onGenerateTool('summary')}
            disabled={isGenerating}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--accent-primary-light)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles size={13} />
            <span>Create Audio Narrative</span>
          </button>
        </div>
      </div>

      {/* 3. Ingested Audio & Meeting Sources */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-[var(--text-primary)]">
          Ingested Recordings & Voice Notes ({meetingSources.length})
        </h3>

        {meetingSources.length > 0 ? (
          <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] overflow-hidden">
            {meetingSources.map((src) => (
              <div
                key={src.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                    <Mic size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[var(--text-primary)] truncate">
                      {src.title}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                      <span>{src.notebookTitle}</span>
                      <span>&bull;</span>
                      <span>{new Date(src.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    Ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] text-xs text-[var(--text-muted)]">
            No audio or meeting files in workspace. Click &ldquo;Record / Upload Audio&rdquo; to ingest a meeting.
          </div>
        )}
      </div>

      {/* 4. Generated Meeting Artifacts */}
      {meetingArtifacts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            Generated Meeting Artifacts ({meetingArtifacts.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meetingArtifacts.map((art) => (
              <div
                key={art.id}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)]">
                    {art.artifactType.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(art.createdAt).toLocaleDateString()}
                    </span>
                    {onOpenArtifact && (
                      <button
                        onClick={() => onOpenArtifact(art.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-primary)] hover:underline"
                      >
                        <FileText size={12} />
                        <span>Open</span>
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">{art.title}</h4>
                <div className="p-3 rounded-lg bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] max-h-56 overflow-y-auto leading-relaxed">
                  <UniversalArtifactRenderer artifact={art} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

