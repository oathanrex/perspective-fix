import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Workbench, type WorkbenchActionRef } from './components/Workbench';
import { InteractiveSections } from './components/InteractiveSections';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ShortcutsModal } from './components/ShortcutsModal';
import {
  clearRecentScans,
  loadRecentScans,
  saveRecentScan,
  type RecentScanItem,
} from './utils/history';
import type { SampleSpecimenKey } from './utils/samples';

const THEME_STORAGE_KEY = 'pfx_theme_v2';

function readInitialTheme(): 'light' | 'dark' {
  try {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readInitialTheme);
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>(() => loadRecentScans());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const workbenchRef = useRef<WorkbenchActionRef | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore private browsing storage error
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Global hotkeys: 'T' for theme, '?' for shortcuts, Escape to dismiss
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setIsHistoryOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          toggleTheme();
        } else if (e.key === '?') {
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleTheme]);

  const handleRecordExport = useCallback((entry: RecentScanItem) => {
    setRecentScans((prev) => saveRecentScan(prev, entry));
  }, []);

  const handleClearHistory = useCallback(() => {
    clearRecentScans();
    setRecentScans([]);
  }, []);

  const scrollToWorkbench = () => {
    document.getElementById('workbench')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSpecimen = useCallback((key: SampleSpecimenKey) => {
    workbenchRef.current?.loadSpecimen(key);
    scrollToWorkbench();
  }, []);

  const handleRestoreScan = useCallback((entry: RecentScanItem) => {
    workbenchRef.current?.restoreSavedScan(entry);
    scrollToWorkbench();
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-foreground">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        recentCount={recentScans.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <main className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 flex-1 py-4 sm:py-6">
        <h1 className="sr-only">PerspectiveFix: Straighten Photos &amp; Document Scans in Seconds</h1>
        <Workbench
          actionRef={workbenchRef}
          onRecordExport={handleRecordExport}
        />

        <InteractiveSections onSelectSpecimen={handleSelectSpecimen} />
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        scans={recentScans}
        onRestore={handleRestoreScan}
        onClear={handleClearHistory}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
