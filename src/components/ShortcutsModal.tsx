import React from 'react';
import { Command, X } from 'lucide-react';
import { Button } from './ui';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['↑', '↓', '←', '→'], desc: 'Precision nudge active corner' },
  { keys: ['Shift', '↑ ↓ ← →'], desc: 'Coarse nudge (5× step)' },
  { keys: ['Space (Hold)'], desc: 'Quick peek original skewed photo' },
  { keys: ['R'], desc: 'Reset / untangle corners' },
  { keys: ['Q'], desc: 'Rotate image 90° clockwise' },
  { keys: ['Ctrl', 'S'], desc: 'Download full-resolution scan' },
  { keys: ['Ctrl', 'C'], desc: 'Copy PNG to clipboard' },
  { keys: ['Ctrl', 'V'], desc: 'Paste image from clipboard' },
  { keys: ['T'], desc: 'Toggle light / dark theme' },
  { keys: ['?'], desc: 'Show this shortcuts guide' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="shortcuts-dialog-title" className="text-sm font-semibold text-foreground">
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            tone="ghost"
            onClick={onClose}
            aria-label="Close shortcuts guide"
            className="min-h-8 w-8 px-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-3 divide-y divide-border/60 text-xs">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-muted">{item.desc}</span>
              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-1 rounded-sm border border-border bg-well font-mono text-[11px] font-medium text-foreground shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <Button tone="quiet" onClick={onClose} className="min-h-9 px-4 text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
