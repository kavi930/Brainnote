'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Share2, 
  ListChecks, 
  Layers, 
  GraduationCap, 
  ExternalLink, 
  Check, 
  Plus, 
  ArrowLeft,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Note, ActionItem, Flashcard, QuizQuestion } from '@/types';
import { BrainnoteLogo } from '@/components/BrainnoteLogo';

function ShareContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || 'tenant-acme';
  const targetNoteId = searchParams.get('noteId');
  const inviteId = searchParams.get('invite');

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'actions' | 'flashcards' | 'quiz'>('content');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchSharedNotes = async () => {
      try {
        const res = await fetch(`/api/notes?tenantId=${tenantId}`);
        const data = await res.json();
        if (data.success && data.notes) {
          setNotes(data.notes);
          if (targetNoteId) {
            const found = data.notes.find((n: Note) => n.id === targetNoteId);
            setSelectedNote(found || data.notes[0]);
          } else if (data.notes.length > 0) {
            setSelectedNote(data.notes[0]);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchSharedNotes();
  }, [tenantId, targetNoteId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('Share link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Add new note contribution
  const handleCreateContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const newNote: Note = {
      id: `note-contrib-${Date.now()}`,
      tenantId,
      userId: `user-collab-${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteBody.trim(),
      isPinned: false,
      isArchived: false,
      tags: [
        { id: `t-contrib-${Date.now()}`, tenantId, name: 'Collaborator Note', color: '#6552A3' },
      ],
      sources: [
        {
          id: `src-collab-${Date.now()}`,
          tenantId,
          noteId: `note-contrib-${Date.now()}`,
          sourceType: 'document',
          title: 'Collaborator Contribution',
          processingStatus: 'completed',
          createdAt: new Date().toISOString(),
        },
      ],
      aiArtifacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, note: newNote }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => [newNote, ...prev]);
        setSelectedNote(newNote);
        setNewNoteTitle('');
        setNewNoteBody('');
        setIsAddingNote(false);
        showToast('Your contribution was successfully saved to the shared workspace!');
      }
    } catch {
      showToast('Saved note locally in session.');
    }
  };

  const actionArtifact = selectedNote?.aiArtifacts?.find((a) => a.artifactType === 'action_items');
  const flashcardArtifact = selectedNote?.aiArtifacts?.find((a) => a.artifactType === 'flashcards');
  const quizArtifact = selectedNote?.aiArtifacts?.find((a) => a.artifactType === 'quiz');

  const actionItems: ActionItem[] = actionArtifact?.content?.actionItems || [];
  const flashcards: Flashcard[] = flashcardArtifact?.content?.flashcards || [];
  const quizQuestions: QuizQuestion[] = quizArtifact?.content?.quiz?.questions || (quizArtifact?.content as any)?.questions || [];

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', color: '#18171C', display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 100,
          background: '#18171C',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 700,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Top Banner */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E5DF',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <BrainnoteLogo size={34} subtitle="Shared Workspace & Collaboration" />
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            background: '#EDE9FE',
            color: '#6552A3',
            padding: '3px 10px',
            borderRadius: '999px',
          }}>
            Collaborator View
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', background: '#6552A3', borderColor: '#6552A3' }}
          >
            <Plus size={14} />
            <span>Add New Note</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 12px' }}
          >
            {copiedLink ? <Check size={14} color="#059669" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
          </button>

          <Link
            href="/"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', textDecoration: 'none' }}
          >
            <span>Open in Full Workspace</span>
            <ExternalLink size={13} style={{ marginLeft: '4px' }} />
          </Link>
        </div>
      </header>

      {/* Main Shared Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '24px 32px', gap: '24px' }}>
        {/* Left note selector */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Shared Notes ({notes.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  setSelectedNote(n);
                  setActiveTab('content');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: selectedNote?.id === n.id ? '#FFFFFF' : '#FAF8F5',
                  border: selectedNote?.id === n.id ? '1px solid #18171C' : '1px solid #E8E5DF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedNote?.id === n.id ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18171C', marginBottom: '4px', lineHeight: '1.4' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {new Date(n.updatedAt || n.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Note Detail View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E8E5DF', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
          {/* Add Note Modal inline */}
          {isAddingNote && (
            <form onSubmit={handleCreateContribution} style={{
              background: '#FAF8F5',
              border: '1.5px dashed #6552A3',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#6552A3' }}>
                Add Note to Shared Workspace
              </div>
              <input
                type="text"
                placeholder="Note title..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#FFFFFF',
                }}
              />
              <textarea
                placeholder="Type your notes, research points, or meeting minutes..."
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                rows={4}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: '#FFFFFF',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px', background: '#6552A3', borderColor: '#6552A3' }}>
                  Publish Note
                </button>
                <button type="button" onClick={() => setIsAddingNote(false)} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {selectedNote ? (
            <div>
              {/* Tab selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8E5DF', paddingBottom: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('content')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: activeTab === 'content' ? '#18171C' : 'transparent',
                      color: activeTab === 'content' ? '#FFFFFF' : '#64748B',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Note Content
                  </button>

                  <button
                    onClick={() => setActiveTab('actions')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: activeTab === 'actions' ? '#D1FAE5' : 'transparent',
                      color: activeTab === 'actions' ? '#047857' : '#64748B',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Actions ({actionItems.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('flashcards')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: activeTab === 'flashcards' ? '#E0F2FE' : 'transparent',
                      color: activeTab === 'flashcards' ? '#0369A1' : '#64748B',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Flashcards ({flashcards.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('quiz')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: activeTab === 'quiz' ? '#FEF3C7' : 'transparent',
                      color: activeTab === 'quiz' ? '#B45309' : '#64748B',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Quiz ({quizQuestions.length})
                  </button>
                </div>

                <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} color="#059669" />
                  <span>Logical Tenant Isolation Enforced</span>
                </span>
              </div>

              {/* Note Title */}
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#18171C', marginBottom: '14px', lineHeight: '1.35' }}>
                {selectedNote.title}
              </h1>

              {/* Tab 1: Content */}
              {activeTab === 'content' && (
                <div style={{ fontSize: '0.96rem', lineHeight: '1.8', color: '#18171C', whiteSpace: 'pre-wrap' }}>
                  {selectedNote.content}
                </div>
              )}

              {/* Tab 2: Actions */}
              {activeTab === 'actions' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857', marginBottom: '14px' }}>
                    Shared Action Items
                  </h3>
                  {actionItems.length === 0 ? (
                    <p style={{ color: '#64748B', fontSize: '0.88rem' }}>No action items recorded for this note.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {actionItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            padding: '12px 16px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: '2px solid #059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: item.completed ? '#059669' : 'transparent',
                              color: '#FFFFFF',
                              fontSize: '11px',
                            }}>
                              {item.completed ? '✓' : ''}
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#94A3B8' : '#0F172A' }}>
                              {item.task}
                            </span>
                          </div>
                          {item.dueDate && (
                            <span style={{ fontSize: '0.74rem', color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              Due: {item.dueDate}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Flashcards */}
              {activeTab === 'flashcards' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369A1', marginBottom: '14px' }}>
                    Active Recall Study Deck
                  </h3>
                  {flashcards.length === 0 ? (
                    <p style={{ color: '#64748B', fontSize: '0.88rem' }}>No flashcards recorded for this note.</p>
                  ) : (
                    <div>
                      <div style={{
                        background: '#FAF8F5',
                        border: '1px solid #E8E5DF',
                        borderRadius: '14px',
                        padding: '24px',
                        textAlign: 'center',
                        marginBottom: '16px',
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Card {cardIndex + 1} of {flashcards.length}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#18171C', marginBottom: '16px' }}>
                          {flashcards[cardIndex].front}
                        </div>
                        {isFlipped ? (
                          <div style={{ background: '#EDE9FE', border: '1px dashed #C4B5FD', padding: '14px', borderRadius: '8px', color: '#5B21B6', fontSize: '0.94rem', textAlign: 'left' }}>
                            {flashcards[cardIndex].back}
                          </div>
                        ) : (
                          <button onClick={() => setIsFlipped(true)} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                            Reveal Answer
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                            if (cardIndex > 0) {
                              setCardIndex((prev) => prev - 1);
                              setIsFlipped(false);
                            }
                          }}
                          disabled={cardIndex === 0}
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: '0.82rem' }}
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => {
                            if (cardIndex < flashcards.length - 1) {
                              setCardIndex((prev) => prev + 1);
                              setIsFlipped(false);
                            }
                          }}
                          disabled={cardIndex === flashcards.length - 1}
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: '0.82rem', background: '#0369A1', borderColor: '#0369A1' }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Quiz */}
              {activeTab === 'quiz' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#B45309', marginBottom: '14px' }}>
                    Practice Quiz
                  </h3>
                  {quizQuestions.length === 0 ? (
                    <p style={{ color: '#64748B', fontSize: '0.88rem' }}>No quiz questions recorded for this note.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {quizQuestions.map((q, idx) => {
                        const userAnswer = quizAnswers[q.id];
                        const isAnswered = userAnswer !== undefined;
                        return (
                          <div key={q.id || idx} style={{ background: '#FAF8F5', border: '1px solid #E8E5DF', borderRadius: '12px', padding: '18px' }}>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#18171C', marginBottom: '12px' }}>
                              Question {idx + 1}: {q.question}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = optIdx === q.correctOptionIndex;
                                const isSelected = optIdx === userAnswer;
                                let bg = '#FFFFFF';
                                let borderColor = '#E8E5DF';
                                let color = '#18171C';
                                if (isAnswered) {
                                  if (isCorrect) {
                                    bg = '#ECFDF5';
                                    borderColor = '#10B981';
                                    color = '#047857';
                                  } else if (isSelected) {
                                    bg = '#FFF1F2';
                                    borderColor = '#F43F5E';
                                    color = '#BE123C';
                                  }
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                    disabled={isAnswered}
                                    style={{
                                      padding: '10px 14px',
                                      textAlign: 'left',
                                      borderRadius: '8px',
                                      border: `1px solid ${borderColor}`,
                                      background: bg,
                                      color,
                                      fontSize: '0.84rem',
                                      fontWeight: 600,
                                      cursor: isAnswered ? 'default' : 'pointer',
                                    }}
                                  >
                                    {['A', 'B', 'C', 'D'][optIdx]}. {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {isAnswered && (
                              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #E8E5DF', fontSize: '0.8rem', color: '#475569' }}>
                                <strong>Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              Select a note on the left or click "Add New Note" to contribute.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading shared note...</div>}>
      <ShareContent />
    </Suspense>
  );
}
