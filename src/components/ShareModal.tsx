'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import { Collaborator, Note } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  activeNote?: Note | null;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  activeNote,
  onShowToast,
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [accessScope, setAccessScope] = useState<'workspace' | 'note'>('workspace');

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share?tenantId=${tenantId}${activeNote && accessScope === 'note' ? `&noteId=${activeNote.id}` : ''}`
    : `http://localhost:3000/share?tenantId=${tenantId}`;

  // Fetch collaborators from API
  useEffect(() => {
    if (!isOpen) return;

    const fetchCollaborators = async () => {
      try {
        const res = await fetch(`/api/collaborators?tenantId=${tenantId}`);
        const data = await res.json();
        if (data.success && data.collaborators) {
          setCollaborators(data.collaborators);
        }
      } catch {
        // Fallback
      }
    };

    fetchCollaborators();
  }, [isOpen, tenantId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    onShowToast('Collaboration link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      onShowToast('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          email: newEmail.trim(),
          name: newName.trim() || undefined,
          role: newRole,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.collaborator) {
        setCollaborators((prev) => {
          const filtered = prev.filter((c) => c.email.toLowerCase() !== data.collaborator.email.toLowerCase());
          return [...filtered, data.collaborator];
        });
        setNewEmail('');
        setNewName('');
        onShowToast(`Invitation created for ${data.collaborator.email}!`);
      } else {
        onShowToast(data.error || 'Failed to invite collaborator.');
      }
    } catch {
      setIsSubmitting(false);
      onShowToast('Network error while inviting collaborator.');
    }
  };

  const handleRemoveCollaborator = async (collabId: string, email: string) => {
    try {
      const res = await fetch('/api/collaborators', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          collabId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
        onShowToast(`Revoked access for ${email}.`);
      } else {
        onShowToast(data.error || 'Failed to remove collaborator.');
      }
    } catch {
      onShowToast('Failed to revoke collaborator access.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#FAF8F5',
        border: '1px solid #E8E5DF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E8E5DF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#EDE9FE',
              color: '#6552A3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#18171C' }}>
                Share & Invite Collaborators
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Allow teammates to view, add notes, and collaborate in {tenantName}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Share Link Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#18171C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="#6552A3" />
                <span>Shareable Link</span>
              </label>

              {activeNote && (
                <div style={{ display: 'flex', gap: '4px', background: '#FFFFFF', border: '1px solid #E8E5DF', borderRadius: '6px', padding: '2px' }}>
                  <button
                    onClick={() => setAccessScope('workspace')}
                    style={{
                      border: 'none',
                      background: accessScope === 'workspace' ? '#18171C' : 'transparent',
                      color: accessScope === 'workspace' ? '#FFFFFF' : '#64748B',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Entire Workspace
                  </button>
                  <button
                    onClick={() => setAccessScope('note')}
                    style={{
                      border: 'none',
                      background: accessScope === 'note' ? '#18171C' : 'transparent',
                      color: accessScope === 'note' ? '#FFFFFF' : '#64748B',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    This Note Only
                  </button>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #E8E5DF',
              borderRadius: '10px',
              padding: '6px 8px',
            }}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.82rem',
                  color: '#334155',
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={handleCopyLink}
                className="btn btn-secondary"
                style={{
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: copiedLink ? '#ECFDF5' : '#FFFFFF',
                  borderColor: copiedLink ? '#10B981' : '#E8E5DF',
                  color: copiedLink ? '#047857' : '#18171C',
                }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Invite Collaborator Form */}
          <form onSubmit={handleInvite} style={{
            background: '#FFFFFF',
            border: '1px solid #E8E5DF',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#18171C', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={15} color="#6552A3" />
              <span>Invite Teammate to Add Notes</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <input
                type="email"
                placeholder="teammate@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Name (e.g. Jordan)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Role:</span>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'editor' | 'viewer')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    background: '#FAF8F5',
                    color: '#18171C',
                    fontWeight: 700,
                  }}
                >
                  <option value="editor">Editor (Can create & edit notes)</option>
                  <option value="viewer">Viewer (Read-only + practice quiz)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  background: '#6552A3',
                  borderColor: '#6552A3',
                }}
              >
                {isSubmitting ? 'Inviting...' : 'Send Invitation'}
              </button>
            </div>
          </form>

          {/* Collaborator List */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#18171C', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} color="#6552A3" />
              <span>Workspace Members & Collaborators ({collaborators.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#FFFFFF',
                    border: '1px solid #E8E5DF',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#F3E8FF',
                      color: '#7E22CE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}>
                      {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {c.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: c.role === 'editor' ? '#ECFDF5' : '#F1F5F9',
                      color: c.role === 'editor' ? '#047857' : '#475569',
                      border: `1px solid ${c.role === 'editor' ? '#A7F3D0' : '#E2E8F0'}`,
                    }}>
                      {c.role}
                    </span>

                    {c.status === 'invited' && (
                      <span style={{ fontSize: '0.7rem', color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Invited
                      </span>
                    )}

                    {!c.name.includes('(Owner)') && (
                      <button
                        onClick={() => handleRemoveCollaborator(c.id, c.email)}
                        title="Revoke access"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #E8E5DF',
          background: '#FAF8F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} color="#059669" />
            <span>End-to-end logical multi-tenant isolation enforced.</span>
          </span>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
