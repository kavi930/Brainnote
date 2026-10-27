'use client';

import React from 'react';
import { 
  Home, 
  BookOpen, 
  Mic, 
  FileText, 
  Video, 
  MessageSquare, 
  GraduationCap, 
  Settings, 
  Folder as FolderIcon, 
  Tag as TagIcon, 
  Cpu 
} from 'lucide-react';
import { Folder, Tag, UsageRecord, SourceType, PrimaryNavSection } from '@/types';

interface SidebarProps {
  currentSection: PrimaryNavSection;
  onSelectSection: (section: PrimaryNavSection) => void;
  folders: Folder[];
  tags: Tag[];
  usage: UsageRecord;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  notesCount: number;
  meetingsCount: number;
  documentsCount: number;
  videosCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  folders,
  tags,
  usage,
  activeFilter,
  onSelectFilter,
  notesCount,
  meetingsCount,
  documentsCount,
  videosCount,
}) => {
  const tokenPercent = Math.min(100, Math.round((usage.aiTokensConsumed / usage.aiTokensLimit) * 100));
  const storageMB = (usage.storageBytesConsumed / (1024 * 1024)).toFixed(0);
  const storageLimitMB = (usage.storageBytesLimit / (1024 * 1024)).toFixed(0);
  const storagePercent = Math.min(100, Math.round((usage.storageBytesConsumed / usage.storageBytesLimit) * 100));

  const navSectionItem = (
    section: PrimaryNavSection,
    label: string,
    icon: React.ReactNode,
    count?: number
  ) => {
    const isActive = currentSection === section;
    return (
      <button
        onClick={() => {
          onSelectSection(section);
          if (section === 'library') onSelectFilter('all');
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '8px',
          background: isActive ? '#EDE9FE' : 'transparent',
          color: isActive ? '#6D28D9' : '#334155',
          border: isActive ? '1px solid #DDD6FE' : '1px solid transparent',
          fontWeight: isActive ? 700 : 500,
          fontSize: '0.85rem',
          cursor: 'pointer',
          textAlign: 'left',
          marginBottom: '3px',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon}
          <span>{label}</span>
        </div>
        {typeof count === 'number' && count > 0 && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: isActive ? '#DDD6FE' : '#F1F5F9',
            color: isActive ? '#5B21B6' : '#64748B',
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside style={{
      width: '280px',
      height: 'calc(100vh - 67px)',
      background: '#FFFFFF',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 16px',
      overflowY: 'auto',
    }}>
      <div>
        {/* 8 Primary Navigation Sections */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 14px 10px',
          }}>
            Navigation
          </div>

          {navSectionItem('home', 'Home', <Home size={16} color={currentSection === 'home' ? '#6D28D9' : '#475569'} />)}
          {navSectionItem('library', 'My Library', <BookOpen size={16} color={currentSection === 'library' ? '#6D28D9' : '#475569'} />, notesCount)}
          {navSectionItem('meetings', 'Meetings', <Mic size={16} color={currentSection === 'meetings' ? '#059669' : '#475569'} />, meetingsCount)}
          {navSectionItem('documents', 'Documents', <FileText size={16} color={currentSection === 'documents' ? '#DC2626' : '#475569'} />, documentsCount)}
          {navSectionItem('videos', 'Videos', <Video size={16} color={currentSection === 'videos' ? '#E11D48' : '#475569'} />, videosCount)}
          {navSectionItem('ai_chat', 'AI Chat', <MessageSquare size={16} color={currentSection === 'ai_chat' ? '#0284C7' : '#475569'} />)}
          {navSectionItem('study_tools', 'Study Tools', <GraduationCap size={16} color={currentSection === 'study_tools' ? '#D97706' : '#475569'} />)}
          {navSectionItem('settings', 'Settings', <Settings size={16} color={currentSection === 'settings' ? '#6D28D9' : '#475569'} />)}
        </div>

        {/* Folders (visible when inside library or home) */}
        {(currentSection === 'library' || currentSection === 'home') && folders.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ padding: '0 14px 10px', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Folders
            </div>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFilter(`folder:${f.id}`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: activeFilter === `folder:${f.id}` ? '#EDE9FE' : 'transparent',
                  border: activeFilter === `folder:${f.id}` ? '1px solid #DDD6FE' : '1px solid transparent',
                  color: activeFilter === `folder:${f.id}` ? '#6D28D9' : '#334155',
                  fontSize: '0.84rem',
                  fontWeight: activeFilter === `folder:${f.id}` ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: '3px',
                }}
              >
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: f.color }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {(currentSection === 'library' || currentSection === 'home') && tags.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 14px 10px' }}>
              Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 14px' }}>
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectFilter(`tag:${t.id}`)}
                  style={{
                    border: activeFilter === `tag:${t.id}` ? '1px solid #7C3AED' : '1px solid #CBD5E1',
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: activeFilter === `tag:${t.id}` ? '#EDE9FE' : '#FFFFFF',
                    color: activeFilter === `tag:${t.id}` ? '#6D28D9' : '#475569',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage & Quota Bar Bottom Container */}
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#1E293B',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Cpu size={14} color="var(--accent-purple)" />
          <span>Tenant Quota Usage</span>
        </div>

        {/* AI Tokens */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginBottom: '5px' }}>
            <span>AI Tokens</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>
              {usage.aiTokensConsumed.toLocaleString()} / {usage.aiTokensLimit.toLocaleString()}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${tokenPercent}%`,
              height: '100%',
              background: tokenPercent > 85 ? 'linear-gradient(90deg, #D97706, #E11D48)' : 'linear-gradient(90deg, #7C3AED, #0284C7)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Storage */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginBottom: '5px' }}>
            <span>Storage</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>
              {storageMB} MB / {storageLimitMB} MB
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${storagePercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #059669, #0284C7)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>
    </aside>
  );
};
