'use client';

import React from 'react';
import { Search, Pin, Youtube, FileUp, Mic, Globe, Sparkles, Plus } from 'lucide-react';
import { Note, SourceType } from '@/types';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterTitle: string;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  searchQuery,
  onSearchChange,
  filterTitle,
}) => {
  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube size={13} color="#E11D48" />;
      case 'pdf':
        return <FileUp size={13} color="#DC2626" />;
      case 'audio':
      case 'meeting':
        return <Mic size={13} color="#059669" />;
      case 'web':
        return <Globe size={13} color="#0284C7" />;
      default:
        return null;
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      width: '360px',
      height: 'calc(100vh - 67px)',
      background: '#F8FAFC',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header & Search */}
      <div style={{ padding: '20px 20px 16px', background: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
            {filterTitle}
          </h2>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#64748B',
            background: '#F1F5F9',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: '10px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Search size={15} color="#64748B" style={{ marginRight: '10px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search notes, tags, transcripts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#0F172A',
              fontSize: '0.84rem',
              fontWeight: 500,
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Note List Scroll View */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
        {notes.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '260px',
            textAlign: 'center',
            padding: '24px',
            color: '#64748B',
          }}>
            <p style={{ fontSize: '0.88rem', marginBottom: '16px', color: '#475569' }}>
              No notes found matching your filter.
            </p>
            <button onClick={onNewNote} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
              <Plus size={15} />
              <span>Create Note</span>
            </button>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            const primarySource = note.sources?.[0];
            const aiCount = note.aiArtifacts?.length || 0;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                style={{
                  padding: '16px 18px',
                  marginBottom: '12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #7C3AED' : '1px solid #E2E8F0',
                  borderLeft: isSelected ? '4px solid #7C3AED' : '1px solid #E2E8F0',
                  background: isSelected ? '#FAF5FF' : '#FFFFFF',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  transition: 'all 0.18s ease',
                }}
              >
                {/* Note Title & Pin */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                  <h3 style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: isSelected ? '#6D28D9' : '#0F172A',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {note.title || 'Untitled Note'}
                  </h3>
                  {note.isPinned && <Pin size={14} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />}
                </div>

                {/* Content snippet */}
                <p style={{
                  fontSize: '0.8rem',
                  color: '#475569',
                  lineHeight: '1.55',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: '12px',
                }}>
                  {note.content.replace(/#+\s/g, '').slice(0, 130)}
                </p>

                {/* Badges footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>{formatDate(note.updatedAt)}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {primarySource && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#F1F5F9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        color: '#334155',
                        fontWeight: 600,
                        border: '1px solid #E2E8F0',
                      }}>
                        {getSourceIcon(primarySource.sourceType)}
                        <span style={{ textTransform: 'capitalize' }}>{primarySource.sourceType}</span>
                      </span>
                    )}

                    {aiCount > 0 && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#EDE9FE',
                        color: '#6D28D9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        border: '1px solid #DDD6FE',
                      }}>
                        <Sparkles size={11} />
                        <span>{aiCount} AI</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
