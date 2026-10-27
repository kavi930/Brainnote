'use client';

import React, { useState } from 'react';
import { 
  X, 
  Youtube, 
  FileUp, 
  Mic, 
  Globe, 
  Sparkles, 
  Presentation, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { SourceType } from '@/types';

interface IngestSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestComplete: (
    sourceType: SourceType,
    title: string,
    urlOrFile: string,
    initialNoteContent: string
  ) => void;
}

export const IngestSourceModal: React.FC<IngestSourceModalProps> = ({
  isOpen,
  onClose,
  onIngestComplete,
}) => {
  const [activeTab, setActiveTab] = useState<SourceType>('youtube');
  const [urlInput, setUrlInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);

  // Meeting specific consent verification state
  const [meetingConsentConfirmed, setMeetingConsentConfirmed] = useState(false);
  const [meetingPlatform, setMeetingPlatform] = useState<'zoom' | 'google_meet' | 'microsoft_teams' | 'custom_recording'>('zoom');

  // Selected file state
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setUrlInput('');
    setCustomTitle('');
    setSelectedFileName(null);
    setSelectedFileSize(null);
    setErrorMessage(null);
    setErrorSuggestion(null);
    setIsProcessing(false);
    setMeetingConsentConfirmed(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleExecuteIngest = async (
    type: SourceType,
    options?: {
      overrideTitle?: string;
      overrideUrl?: string;
      overrideText?: string;
      overrideSize?: number;
      overrideMime?: string;
    }
  ) => {
    setErrorMessage(null);
    setErrorSuggestion(null);

    // Validation checks
    if (type === 'meeting' && !meetingConsentConfirmed) {
      setErrorMessage('Participant consent is required before ingesting meeting recordings.');
      setErrorSuggestion('Please check the confirmation box verifying all call attendees have provided explicit recording consent.');
      return;
    }

    if (type === 'youtube' && !urlInput.trim() && !options?.overrideUrl) {
      setErrorMessage('Please enter a valid YouTube video URL.');
      return;
    }

    setIsProcessing(true);
    setStepStatus('Initiating secure ingestion adapter...');

    const payloadTitle = options?.overrideTitle || customTitle || selectedFileName || (type === 'youtube' ? 'YouTube Keynote' : 'Captured Source');
    const payloadUrl = options?.overrideUrl || urlInput;

    try {
      setStepStatus(
        type === 'youtube' || type === 'audio' || type === 'meeting'
          ? 'Transcribing audio track with timestamps & speaker diarization...'
          : 'Validating MIME types, parsing sections, and checking tenant isolation...'
      );

      const res = await fetch('/api/sources/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: type,
          title: payloadTitle,
          url: payloadUrl,
          rawText: options?.overrideText,
          fileSizeBytes: options?.overrideSize || selectedFileSize || 2_500_000,
          fileMimeType: options?.overrideMime,
          meetingConsentConfirmed: type === 'meeting' ? meetingConsentConfirmed : undefined,
          meetingPlatform: type === 'meeting' ? meetingPlatform : undefined,
          tenantId: 'tenant-acme', // Scoped to active tenant
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsProcessing(false);
        setErrorMessage(data.error || 'Ingestion failed');
        setErrorSuggestion(data.suggestedAlternative || null);
        return;
      }

      setStepStatus('Structuring knowledge notes with verifiable citations...');

      setTimeout(() => {
        setIsProcessing(false);
        onIngestComplete(type, payloadTitle, payloadUrl || selectedFileName || 'File Upload', data.initialMarkdown);
        handleClose();
      }, 700);
    } catch {
      setIsProcessing(false);
      setErrorMessage('Failed to connect to ingestion service.');
      setErrorSuggestion('Ensure the server is operational and try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      setCustomTitle(file.name);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        borderRadius: '20px',
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#EDE9FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#7C3AED" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Capture Multi-Modal Knowledge
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                YouTube transcripts, PDFs, presentations, audio, and consented meetings
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Source Type Navigation Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
        }}>
          <button
            onClick={() => { setActiveTab('youtube'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: activeTab === 'youtube' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'youtube' ? '#E11D48' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              borderBottom: activeTab === 'youtube' ? '2px solid #E11D48' : 'none',
            }}
          >
            <Youtube size={16} />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => { setActiveTab('pdf'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: activeTab === 'pdf' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'pdf' ? '#DC2626' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              borderBottom: activeTab === 'pdf' ? '2px solid #DC2626' : 'none',
            }}
          >
            <FileUp size={16} />
            <span>Document</span>
          </button>

          <button
            onClick={() => { setActiveTab('presentation'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: activeTab === 'presentation' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'presentation' ? '#D97706' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              borderBottom: activeTab === 'presentation' ? '2px solid #D97706' : 'none',
            }}
          >
            <Presentation size={16} />
            <span>Slides (PPTX)</span>
          </button>

          <button
            onClick={() => { setActiveTab('meeting'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: activeTab === 'meeting' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'meeting' ? '#059669' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              borderBottom: activeTab === 'meeting' ? '2px solid #059669' : 'none',
            }}
          >
            <Mic size={16} />
            <span>Meeting</span>
          </button>

          <button
            onClick={() => { setActiveTab('web'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: activeTab === 'web' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'web' ? '#0284C7' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              borderBottom: activeTab === 'web' ? '2px solid #0284C7' : 'none',
            }}
          >
            <Globe size={16} />
            <span>Web Clip</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Error Banner with honest fallback suggestion */}
          {errorMessage && (
            <div style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#BE123C', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
              {errorSuggestion && (
                <p style={{ fontSize: '0.78rem', color: '#9F1239', lineHeight: '1.4', margin: 0 }}>
                  <strong>Alternative:</strong> {errorSuggestion}
                </p>
              )}
            </div>
          )}

          {isProcessing ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '3px solid #EDE9FE',
                borderTopColor: '#7C3AED',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>{stepStatus}</h4>
              <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                Extracted safely with tenant isolation and verifiable citations
              </p>
            </div>
          ) : (
            <>
              {/* Tab 1: YouTube */}
              {activeTab === 'youtube' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                    YouTube Video URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      outline: 'none',
                      marginBottom: '16px',
                    }}
                  />
                  <button
                    onClick={() => handleExecuteIngest('youtube')}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '20px' }}
                  >
                    Extract Timestamped Transcript
                  </button>

                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginBottom: '10px' }}>
                    Or try a sample video to test the pipeline:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleExecuteIngest('youtube', {
                        overrideTitle: 'Stanford HAI: Autonomous AI Agents & Reasoning (2026)',
                        overrideUrl: 'https://youtube.com/watch?v=hai2026agents',
                      })}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '10px 14px' }}
                    >
                      <Youtube size={15} color="#E11D48" />
                      <span>Stanford HAI: Autonomous AI Agents & Reasoning (2026)</span>
                    </button>
                    <button
                      onClick={() => handleExecuteIngest('youtube', {
                        overrideTitle: 'Restricted Video Test (DRM / No Captions)',
                        overrideUrl: 'https://youtube.com/watch?v=restricted-drm',
                      })}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '10px 14px', color: '#94A3B8' }}
                    >
                      <AlertCircle size={15} color="#64748B" />
                      <span>Test Edge Case: Video with Disabled Transcripts</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Document (PDF, DOCX, Markdown, Text) */}
              {activeTab === 'pdf' && (
                <div>
                  <div style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '14px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    background: '#F8FAFC',
                  }}>
                    <FileUp size={36} color="#7C3AED" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Upload PDF, DOCX, or Markdown Document
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '14px' }}>
                      Max 50MB per document • Page markers preserved for citations
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="doc-file-input"
                    />
                    <label htmlFor="doc-file-input" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      Choose Local File
                    </label>
                    {selectedFileName && (
                      <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                        Selected: {selectedFileName} ({(selectedFileSize! / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleExecuteIngest('pdf', {
                      overrideTitle: selectedFileName || 'AWS & Vercel Hybrid Enterprise Architecture Whitepaper.pdf',
                      overrideSize: selectedFileSize || 3_200_000,
                    })}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Ingest Document
                  </button>
                </div>
              )}

              {/* Tab 3: Presentation (PowerPoint .pptx) */}
              {activeTab === 'presentation' && (
                <div>
                  <div style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '14px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    background: '#F8FAFC',
                  }}>
                    <Presentation size={36} color="#D97706" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Upload PowerPoint Slides (.pptx)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '14px' }}>
                      Extracts slide notes, bullet hierarchies, and diagrams
                    </div>
                    <input
                      type="file"
                      accept=".pptx,.ppt"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="slide-file-input"
                    />
                    <label htmlFor="slide-file-input" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                      Choose PowerPoint File
                    </label>
                    {selectedFileName && (
                      <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                        Selected: {selectedFileName}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleExecuteIngest('presentation', {
                      overrideTitle: selectedFileName || 'Brainnote 2026 Commercial Pitch Deck.pptx',
                      overrideSize: selectedFileSize || 4_500_000,
                      overrideMime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    })}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Ingest Slides with Slide Citations
                  </button>
                </div>
              )}

              {/* Tab 4: Meeting Recording with Mandatory Consent */}
              {activeTab === 'meeting' && (
                <div>
                  <div style={{
                    border: '2px dashed #CBD5E1',
                    borderRadius: '14px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    background: '#F8FAFC',
                  }}>
                    <Mic size={32} color="#059669" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Upload Meeting Audio Recording (.m4a, .mp3, .wav)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Supports Zoom, Teams, and Google Meet exports up to 150MB
                    </div>
                  </div>

                  {/* Meeting Platform Selector */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Meeting Source Platform
                    </label>
                    <select
                      value={meetingPlatform}
                      onChange={(e) => setMeetingPlatform(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#0F172A',
                      }}
                    >
                      <option value="zoom">Zoom Cloud Recording Export</option>
                      <option value="google_meet">Google Meet Transcript / Audio</option>
                      <option value="microsoft_teams">Microsoft Teams Meeting Export</option>
                      <option value="custom_recording">Custom Device Microphone Recording</option>
                    </select>
                  </div>

                  {/* Mandatory Participant Consent Checkbox */}
                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}>
                    <input
                      type="checkbox"
                      id="consent-check"
                      checked={meetingConsentConfirmed}
                      onChange={(e) => setMeetingConsentConfirmed(e.target.checked)}
                      style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="consent-check" style={{ fontSize: '0.78rem', color: '#166534', lineHeight: '1.4', cursor: 'pointer' }}>
                      <strong>Affirmative Participant Consent:</strong> I confirm that all meeting participants were informed and consented to this recording in accordance with applicable wiretap and privacy laws.
                    </label>
                  </div>

                  <button
                    onClick={() => handleExecuteIngest('meeting', {
                      overrideTitle: 'Q4 Product Roadmap Sync & Architecture Review.m4a',
                      overrideSize: 18_000_000,
                      overrideMime: 'audio/mp4',
                    })}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Ingest Meeting with Diarization
                  </button>
                </div>
              )}

              {/* Tab 5: Web Page / Selected Text */}
              {activeTab === 'web' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                    Web Article URL or Selection
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      outline: 'none',
                      marginBottom: '16px',
                    }}
                  />
                  <button
                    onClick={() => handleExecuteIngest('web', {
                      overrideTitle: 'The Architecture of Autonomous AI Note Companions in 2026',
                      overrideUrl: urlInput || 'https://techcrunch.com/2026/autonomous-ai-notes',
                    })}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Clip Article into Library
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
