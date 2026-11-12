import type { AspectPreset, Quad, ScanFilter } from './perspective';

export interface RecentScanItem {
  id: string;
  fileName: string;
  timestamp: number;
  origWidth: number;
  origHeight: number;
  outWidth: number;
  outHeight: number;
  skewDegrees: number;
  filter: ScanFilter;
  preset: AspectPreset;
  corners: Quad;
  thumbnailDataUrl: string;
  sampleKey?: string;
}

export const RECENT_SCANS_KEY = 'pfx_recent_scans_v3';
export const MAX_RECENT_SCANS = 10;

export function loadRecentScans(): RecentScanItem[] {
  try {
    const raw = localStorage.getItem(RECENT_SCANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentScanItem =>
        Boolean(
          item &&
            typeof item.id === 'string' &&
            typeof item.fileName === 'string' &&
            typeof item.thumbnailDataUrl === 'string' &&
            Array.isArray(item.corners) &&
            item.corners.length === 4
        )
    ).slice(0, MAX_RECENT_SCANS);
  } catch {
    return [];
  }
}

export function saveRecentScan(
  scans: RecentScanItem[],
  newItem: RecentScanItem
): RecentScanItem[] {
  const filtered = scans.filter((s) => s.id !== newItem.id && s.fileName !== newItem.fileName);
  const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SCANS);
  try {
    localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(updated));
  } catch {
    // quota errors ignored
  }
  return updated;
}

export function clearRecentScans(): void {
  try {
    localStorage.removeItem(RECENT_SCANS_KEY);
  } catch {
    // ignore
  }
}
