'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('brainnote-theme') as ThemePreference) || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = (localStorage.getItem('brainnote-theme') as ThemePreference) || 'system';
      if (current === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const applyTheme = (pref: ThemePreference) => {
    const root = document.documentElement;
    if (pref === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (pref === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  };

  const handleSelectTheme = (newTheme: ThemePreference) => {
    setTheme(newTheme);
    localStorage.setItem('brainnote-theme', newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <div className="w-8 h-8 rounded-lg bg-[var(--bg-input)] animate-pulse" />;
  }

  const cycleTheme = () => {
    if (theme === 'system') handleSelectTheme('light');
    else if (theme === 'light') handleSelectTheme('dark');
    else handleSelectTheme('system');
  };

  if (compact) {
    return (
      <button
        onClick={cycleTheme}
        title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        aria-label="Toggle theme"
        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-all flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Moon size={16} className="text-[var(--accent-primary)]" />
        ) : theme === 'light' ? (
          <Sun size={16} className="text-[var(--accent-amber)]" />
        ) : (
          <Monitor size={16} />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center p-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]">
      <button
        onClick={() => handleSelectTheme('light')}
        title="Light theme"
        className={`p-1.5 rounded-md transition-all ${
          theme === 'light'
            ? 'bg-[var(--bg-panel)] text-[var(--accent-amber)] shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Sun size={14} />
      </button>
      <button
        onClick={() => handleSelectTheme('dark')}
        title="Dark theme"
        className={`p-1.5 rounded-md transition-all ${
          theme === 'dark'
            ? 'bg-[var(--bg-panel)] text-[var(--accent-primary)] shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Moon size={14} />
      </button>
      <button
        onClick={() => handleSelectTheme('system')}
        title="System default"
        className={`p-1.5 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Monitor size={14} />
      </button>
    </div>
  );
};
