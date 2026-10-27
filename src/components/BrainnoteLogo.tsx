'use client';

import React from 'react';

interface BrainnoteLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const BrainnoteLogo: React.FC<BrainnoteLogoProps> = ({
  size = 36,
  showText = true,
  className = '',
  subtitle = 'AI Knowledge Companion',
}) => {
  return (
    <div className={`brainnote-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      {/* Custom Vector Icon combining Neural Brain + Folded Knowledge Note + AI Node */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="bnLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="bnAccentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <filter id="bnGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Squircle Background Badge */}
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="12"
          fill="url(#bnLogoGrad)"
          filter="url(#bnGlow)"
        />

        {/* Folded Note Page Silhouette */}
        <path
          d="M13 14C13 12.3431 14.3431 11 16 11H27L35 19V33C35 34.6569 33.6569 36 32 36H16C14.3431 36 13 34.6569 13 33V14Z"
          fill="#FFFFFF"
          fillOpacity="0.18"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Folded Corner */}
        <path
          d="M27 11V18C27 18.5523 27.4477 19 28 19H35"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neural Brain Lobes & Synaptic Nodes */}
        {/* Left Hemisphere Arc */}
        <path
          d="M20 18C17.7909 18 16 19.7909 16 22C16 22.8 16.25 23.5 16.68 24.1C16.25 24.7 16 25.4 16 26.2C16 28.4 17.79 30.2 20 30.2C20.6 30.2 21.2 30 21.7 29.7"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Right Hemisphere Arc */}
        <path
          d="M26 18C28.2091 18 30 19.7909 30 22C30 22.8 29.75 23.5 29.32 24.1C29.75 24.7 30 25.4 30 26.2C30 28.4 28.21 30.2 26 30.2C25.4 30.2 24.8 30 24.3 29.7"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Central Cortex Connection */}
        <path
          d="M21 24H25"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* AI Synaptic Spark in the center */}
        <circle cx="23" cy="24" r="2.2" fill="url(#bnAccentGrad)" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="19" cy="20" r="1.3" fill="#FFFFFF" />
        <circle cx="27" cy="20" r="1.3" fill="#FFFFFF" />
        <circle cx="19" cy="28" r="1.3" fill="#FFFFFF" />
        <circle cx="27" cy="28" r="1.3" fill="#FFFFFF" />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.2' }}>
            <span style={{
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.03em',
              color: '#0F172A',
            }}>
              Brainnote
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '2px 6px',
              borderRadius: '5px',
              background: '#EDE9FE',
              color: '#6D28D9',
              border: '1px solid #DDD6FE',
            }}>
              AI
            </span>
          </div>
          {subtitle && (
            <span style={{
              fontSize: '0.72rem',
              color: '#64748B',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              marginTop: '1px',
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
