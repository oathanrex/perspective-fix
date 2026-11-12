import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
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
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const workbenchRef = useRef<WorkbenchActionRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      <main
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes('Files')) {
            event.preventDefault();
            setIsDraggingImage(true);
          }
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes('Files')) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            setIsDraggingImage(true);
          }
        }}
        onDragLeave={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          ) {
            return;
          }
          setIsDraggingImage(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingImage(false);
          const file = event.dataTransfer.files[0];
          if (file) workbenchRef.current?.loadFile(file);
        }}
        className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 flex-1 py-4 sm:py-6"
      >
        <div className="mb-5 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Straighten Photos &amp; Document Scans in Seconds
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed">
            Ever snapped a quick photo of a document or a whiteboard only to find
            it&apos;s crooked or hard to read? PerspectiveFix is here to help you
            straighten those skewed images instantly, right in your browser. No
            software to install, no accounts to create—just a simple, private way
            to fix tiled photos.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Choose an image to straighten"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) workbenchRef.current?.loadFile(file);
              event.target.value = '';
            }}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop an image here or choose a file to upload"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5 ${
              isDraggingImage
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary/60 hover:bg-well'
            }`}
          >
            <UploadCloud className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-left">
              <span className="block text-sm font-semibold text-foreground">
                Drop your image here or click to upload
              </span>
              <span className="mt-1 block text-xs text-muted">
                Supports JPG, PNG, WebP • Paste from clipboard (Ctrl+V)
              </span>
              {isDraggingImage && (
                <span className="mt-1 block text-xs font-medium text-primary" aria-live="polite">
                  Drop the image to open it
                </span>
              )}
            </span>
          </div>
        </div>
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
