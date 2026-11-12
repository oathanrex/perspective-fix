import React from 'react';
import { Clock, RotateCcw, Trash2, X } from 'lucide-react';
import type { RecentScanItem } from '../utils/history';
import { Button } from './ui';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scans: RecentScanItem[];
  onRestore: (scan: RecentScanItem) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  scans,
  onRestore,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="history-drawer-title" className="text-sm font-semibold text-foreground">
              Recent Scans
            </h2>
            <span className="font-mono text-xs text-muted">({scans.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            {scans.length > 0 && (
              <Button
                tone="ghost"
                onClick={onClear}
                aria-label="Clear all recent scans"
                className="min-h-8 px-2 text-xs text-danger hover:text-danger hover:bg-danger-soft"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear</span>
              </Button>
            )}
            <Button
              tone="ghost"
              onClick={onClose}
              aria-label="Close recent scans drawer"
              className="min-h-8 w-8 px-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {scans.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted/60" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No recent scans yet</p>
              <p className="mt-1 text-xs text-muted max-w-[28ch] mx-auto">
                Any scan you download or copy will appear here for quick recall.
              </p>
            </div>
          ) : (
            scans.map((scan) => (
              <div
                key={scan.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-well/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={scan.thumbnailDataUrl}
                    alt={scan.fileName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-sm border border-border object-cover bg-well shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate" title={scan.fileName}>
                      {scan.fileName}
                    </p>
                    <p className="text-[11px] font-mono text-muted tabular-nums mt-0.5">
                      {scan.outWidth}×{scan.outHeight}px · {scan.skewDegrees}° fixed
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-xs bg-well text-[10px] text-muted border border-border/50 uppercase tracking-wider font-mono">
                      {scan.filter}
                    </span>
                  </div>
                </div>

                <Button
                  tone="quiet"
                  onClick={() => {
                    onRestore(scan);
                    onClose();
                  }}
                  title="Re-open in editor"
                  className="min-h-8 px-2.5 text-xs shrink-0"
                >
                  <RotateCcw className="w-3 h-3 text-primary" aria-hidden="true" />
                  <span>Open</span>
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border bg-well text-[11px] text-muted">
          All image processing and history stay 100% inside your browser. No files are ever sent to an
          external server.
        </div>
      </div>
    </div>
  );
};
