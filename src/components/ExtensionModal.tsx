'use client';

import React, { useState } from 'react';
import { X, Puzzle, Copy, Check, ExternalLink, Chrome, Shield, Sparkles, Briefcase, Globe } from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose }) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const extensionPath = 'C:\\Users\\HP\\.gemini\antigravity-ide\\scratch\\brainnote\\extension';

  if (!isOpen) return null;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(extensionPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        maxWidth: '680px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F0F9FF 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}>
              <Puzzle size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                Brainnote Browser Extension (Side Panel)
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Manifest V3 • 1-Click Web Clipping &amp; Technical Interview Preparation Studio
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
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px', overflowY: 'auto' }}>
          {/* Extension Path Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Extension Source Directory (Unpacked)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <code style={{ fontSize: '0.85rem', color: '#0F172A', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
                {extensionPath}
              </code>
              <button
                onClick={handleCopyPath}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  background: copiedPath ? '#DCFCE7' : '#FFFFFF',
                  color: copiedPath ? '#166534' : '#0F172A',
                  borderColor: copiedPath ? '#86EFAC' : '#CBD5E1',
                }}
              >
                {copiedPath ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedPath ? 'Copied!' : 'Copy Path'}</span>
              </button>
            </div>
          </div>

          {/* Installation Steps */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
              How to Install in Chrome or Microsoft Edge (30 Seconds)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                  1
                </span>
                <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                  Open your browser and navigate to <strong>chrome://extensions</strong> (Chrome/Brave) or <strong>edge://extensions</strong> (Microsoft Edge).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                  2
                </span>
                <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                  Toggle on <strong>Developer mode</strong> in the top-right corner.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                  3
                </span>
                <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                  Click <strong>Load unpacked</strong> (top-left) and select the extension folder copied above.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                  ✓
                </span>
                <div style={{ fontSize: '0.86rem', color: '#065F46', lineHeight: '1.5', fontWeight: 600 }}>
                  Press <strong>Ctrl+Shift+B</strong> (or <strong>Cmd+Shift+B</strong>) on any article to open the side panel!
                </div>
              </div>
            </div>
          </div>

          {/* Feature Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Globe size={16} color="#0284C7" />
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0369A1' }}>1-Click Web Clipping</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#0284C7', lineHeight: '1.4' }}>
                Extracts clean notes, Python code, and citations without leaving the webpage.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Briefcase size={16} color="#059669" />
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#065F46' }}>Interview Studio</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#047857', lineHeight: '1.4' }}>
                Generates Staff/Senior interview questions, model answers, and rubrics on any page.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', background: '#FAF5FF', border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} color="#7C3AED" />
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#6D28D9' }}>Live Two-Way Sync</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6D28D9', lineHeight: '1.4' }}>
                All side panel captures sync immediately into your Brainnote library.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Requires Google Chrome, Microsoft Edge, or Chromium browser.
          </span>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 20px' }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
