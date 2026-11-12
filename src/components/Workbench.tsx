import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  Columns2,
  Copy,
  Download,
  Eye,
  ImagePlus,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  SplitSquareHorizontal,
  Square,
  UploadCloud,
} from 'lucide-react';
import {
  CORNER_LABELS,
  CORNER_SHORT_LABELS,
  PERSPECTIVE_LIMITS,
  autoDetectDocumentCorners,
  calculateDimensionsFromNormalized,
  clamp,
  computeSkewAngleDegrees,
  getDefaultNormalizedCorners,
  orderQuadCorners,
  rotateNormalizedCorners90CW,
  type AspectPreset,
  type OutputFormat,
  type Point,
  type Quad,
  type RawPixelBuffer,
  type ScanFilter,
} from '../utils/perspective';
import {
  SAMPLE_SPECIMENS,
  renderSkewedSpecimenScene,
  type SampleSpecimenKey,
} from '../utils/samples';
import { runWarpJobSync } from '../utils/workerClient';
import type { RecentScanItem } from '../utils/history';
import { Button } from './ui';

export interface WorkbenchActionRef {
  triggerAutoSnap: () => void;
  applyCrispDocument: () => void;
  enableSplitCompare: () => void;
  nudgeSampleCorner: () => void;
  triggerDownload: () => void;
  loadSpecimen: (key: SampleSpecimenKey) => void;
  restoreSavedScan: (entry: RecentScanItem) => void;
}

interface WorkbenchProps {
  onRecordExport: (entry: RecentScanItem) => void;
  actionRef: React.MutableRefObject<WorkbenchActionRef | null>;
}

interface LoadedSource {
  fileName: string;
  width: number;
  height: number;
  buffer: RawPixelBuffer;
  dataUrl: string;
  sampleKey?: string;
}

type ViewMode = 'dual' | 'adjust' | 'straightened' | 'split';

const ASPECT_OPTIONS: { value: AspectPreset; label: string }[] = [
  { value: 'auto', label: 'Free Aspect' },
  { value: 'receipt', label: 'Long Receipt' },
  { value: 'a4_portrait', label: 'A4 Portrait' },
  { value: 'a4_landscape', label: 'A4 Landscape' },
  { value: 'letter', label: 'US Letter' },
  { value: 'slide_16_9', label: '16:9 Presentation' },
  { value: 'square', label: '1:1 Square' },
];

const FILTER_OPTIONS: { value: ScanFilter; label: string; tip: string }[] = [
  { value: 'document', label: 'Document', tip: 'Bright white paper, high clarity' },
  { value: 'bw', label: 'B&W Ink', tip: 'High-contrast monochrome print' },
  { value: 'whiteboard', label: 'Whiteboard', tip: 'Crisp marker text, anti-glare' },
  { value: 'original', label: 'Photo', tip: 'Preserve natural colors & lighting' },
];

function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

interface CornerReticleProps {
  idx: number;
  pt: Point;
  isDraggingThis: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

const CornerReticle: React.FC<CornerReticleProps> = ({
  idx,
  pt,
  isDraggingThis,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}) => {
  const xPct = Math.round(pt.x * 100);
  const yPct = Math.round(pt.y * 100);
  const label = CORNER_SHORT_LABELS[idx];
  const fullLabel = CORNER_LABELS[idx];

  // Floating label chiclet positioned outside the clear reticle
  const badgePositionClass =
    idx === 0
      ? '-top-5.5 -left-4 sm:-top-6.5 sm:-left-5'
      : idx === 1
      ? '-top-5.5 -right-4 sm:-top-6.5 sm:-right-5'
      : idx === 2
      ? '-bottom-5.5 -right-4 sm:-bottom-6.5 sm:-right-5'
      : '-bottom-5.5 -left-4 sm:-bottom-6.5 sm:-left-5';

  return (
    <button
      type="button"
      role="slider"
      aria-label={`${fullLabel} corner handle`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={xPct}
      aria-valuetext={`${fullLabel} at ${xPct}% horizontal, ${yPct}% vertical`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      style={{
        left: `${pt.x * 100}%`,
        top: `${pt.y * 100}%`,
      }}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full select-none touch-none focus-visible:outline-2 focus-visible:outline-primary transition-transform duration-75 flex items-center justify-center before:absolute before:-inset-3 before:content-[''] ${
        isDraggingThis
          ? 'scale-125 cursor-grabbing z-30'
          : 'hover:scale-110 cursor-grab z-20'
      }`}
    >
      {/* 100% Transparent Center Ring with Dual-Contrast Border */}
      <span
        className={`absolute inset-0 rounded-full border-2 border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-white/90 dark:ring-black/80 shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-all ${
          isDraggingThis ? 'ring-4 ring-primary/40 border-primary' : 'group-hover:border-primary'
        }`}
        aria-hidden="true"
      />

      {/* Optical Crosshair Reticle (Clear center with precision alignment tick marks) */}
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
      >
        {/* Dark contrast drop shadow for white document paper */}
        <g stroke="rgba(0,0,0,0.45)" strokeWidth="2.2" strokeLinecap="round">
          <line x1="16" y1="2" x2="16" y2="8" />
          <line x1="16" y1="24" x2="16" y2="30" />
          <line x1="2" y1="16" x2="8" y2="16" />
          <line x1="24" y1="16" x2="30" y2="16" />
        </g>
        {/* Primary colored precision alignment tick lines */}
        <g stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round">
          <line x1="16" y1="2" x2="16" y2="8" />
          <line x1="16" y1="24" x2="16" y2="30" />
          <line x1="2" y1="16" x2="8" y2="16" />
          <line x1="24" y1="16" x2="30" y2="16" />
        </g>
        {/* Micro sub-pixel center dot with white halo */}
        <circle cx="16" cy="16" r="1.5" fill="var(--color-primary)" stroke="#ffffff" strokeWidth="0.8" />
      </svg>

      {/* Floating Corner Label Badge: Offset outside the reticle so center is 100% visible */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute ${badgePositionClass} px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold tracking-tight shadow-md transition-colors ${
          isDraggingThis
            ? 'bg-primary text-primary-foreground border border-primary'
            : 'bg-surface/95 text-foreground border border-border/80 group-hover:border-primary/50'
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export const Workbench: React.FC<WorkbenchProps> = ({ onRecordExport, actionRef }) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitFixedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitOrigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [source, setSource] = useState<LoadedSource | null>(null);
  const [activeSample, setActiveSample] = useState<SampleSpecimenKey>('receipt');
  const [corners, setCorners] = useState<Quad>(() => getDefaultNormalizedCorners());
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('receipt');
  const [scanFilter, setScanFilter] = useState<ScanFilter>('document');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isSpacePeeking, setIsSpacePeeking] = useState<boolean>(false);

  const [activeCornerIdx, setActiveCornerIdx] = useState<number | null>(null);
  const [loupeState, setLoupeState] = useState<{
    visible: boolean;
    normX: number;
    normY: number;
    clientX: number;
    clientY: number;
    cornerLabel: string;
  }>({
    visible: false,
    normX: 0,
    normY: 0,
    clientX: 0,
    clientY: 0,
    cornerLabel: 'TL',
  });

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedJustNow, setCopiedJustNow] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Load sample specimen
  const loadSampleSpecimen = useCallback((key: SampleSpecimenKey) => {
    const rendered = renderSkewedSpecimenScene(key);
    const dataUrl = rendered.canvas.toDataURL('image/jpeg', 0.92);
    setSource({
      fileName: rendered.meta.fileName,
      width: rendered.buffer.width,
      height: rendered.buffer.height,
      buffer: rendered.buffer,
      dataUrl,
      sampleKey: key,
    });
    setActiveSample(key);
    setCorners(rendered.meta.trueCorners);
    setAspectPreset(rendered.meta.recommendedPreset);
    setScanFilter(rendered.meta.recommendedFilter);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    loadSampleSpecimen('receipt');
  }, [loadSampleSpecimen]);

  // Draw source image onto canvas elements
  useEffect(() => {
    if (!source) return;

    const drawToCanvas = (canvas: HTMLCanvasElement | null, maxDim: number) => {
      if (!canvas) return;
      const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
      const dw = Math.max(2, Math.round(source.width * scale));
      const dh = Math.max(2, Math.round(source.height * scale));
      canvas.width = dw;
      canvas.height = dh;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const temp = document.createElement('canvas');
      temp.width = source.width;
      temp.height = source.height;
      const tCtx = temp.getContext('2d');
      if (tCtx) {
        const imgData = tCtx.createImageData(source.width, source.height);
        imgData.data.set(source.buffer.data);
        tCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(temp, 0, 0, dw, dh);
      }
      temp.width = 0;
      temp.height = 0;
    };

    drawToCanvas(srcCanvasRef.current, 1024);
    drawToCanvas(splitOrigCanvasRef.current, 900);
  }, [source, viewMode]);

  // Dimension & angle calculations
  const dims = useMemo(() => {
    if (!source) {
      return { w: 0, h: 0, src: null, isValid: false };
    }
    return calculateDimensionsFromNormalized(corners, source.width, source.height, aspectPreset);
  }, [corners, source, aspectPreset]);

  const skewDegrees = useMemo(() => {
    if (!source || !dims.isValid) return 0;
    return computeSkewAngleDegrees(corners, source.width, source.height);
  }, [corners, source, dims.isValid]);

  // Live warp rendering
  useEffect(() => {
    if (!source) return;

    if (!dims.isValid || !dims.src) {
      setErrorMessage(dims.reason || 'Corners are tangled. Click Untangle to fix.');
      return;
    }

    setErrorMessage(null);

    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (cancelled || !dims.src) return;

      const previewScale = Math.min(
        1,
        PERSPECTIVE_LIMITS.MAX_PREVIEW_SIZE / Math.max(dims.w, dims.h)
      );
      const pw = Math.max(2, Math.round(dims.w * previewScale));
      const ph = Math.max(2, Math.round(dims.h * previewScale));

      const result = runWarpJobSync({
        source: source.buffer,
        srcCorners: dims.src,
        destWidth: pw,
        destHeight: ph,
        filter: scanFilter,
      });

      if (!result || cancelled) return;

      const paintPreview = (canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const imgData = ctx.createImageData(result.width, result.height);
        imgData.data.set(result.data);
        ctx.putImageData(imgData, 0, 0);
      };

      paintPreview(prevCanvasRef.current);
      paintPreview(splitFixedCanvasRef.current);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [source, corners, dims, scanFilter, viewMode]);

  // Optical reticle loupe rendering
  useEffect(() => {
    if (!loupeState.visible || !source) return;
    const canvas = loupeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 130;
    canvas.width = size;
    canvas.height = size;

    const zoom = 3.5;
    const cropW = size / zoom;
    const cropH = size / zoom;

    const centerX = loupeState.normX * source.width;
    const centerY = loupeState.normY * source.height;

    const sx = clamp(centerX - cropW / 2, 0, Math.max(0, source.width - cropW));
    const sy = clamp(centerY - cropH / 2, 0, Math.max(0, source.height - cropH));

    const temp = document.createElement('canvas');
    temp.width = source.width;
    temp.height = source.height;
    const tCtx = temp.getContext('2d');
    if (tCtx) {
      const imgData = tCtx.createImageData(source.width, source.height);
      imgData.data.set(source.buffer.data);
      tCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(temp, sx, sy, cropW, cropH, 0, 0, size, size);
    }
    temp.width = 0;
    temp.height = 0;

    // Crosshair reticle
    const mid = size / 2;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.95)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(mid - 14, mid);
    ctx.lineTo(mid + 14, mid);
    ctx.moveTo(mid, mid - 14);
    ctx.lineTo(mid, mid + 14);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(mid, mid, 6, 0, Math.PI * 2);
    ctx.stroke();
  }, [loupeState, source]);

  // User file upload
  const handleUserFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file');
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const maxDim = 3200;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;

          if (w > maxDim || h > maxDim) {
            const scale = maxDim / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }

          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (!ctx) {
            showToast('Failed to open image canvas');
            URL.revokeObjectURL(objectUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const rawBuffer: RawPixelBuffer = {
            width: w,
            height: h,
            data: imgData.data,
          };

          const dataUrl = c.toDataURL('image/jpeg', 0.9);
          c.width = 0;
          c.height = 0;

          setSource({
            fileName: file.name,
            width: w,
            height: h,
            buffer: rawBuffer,
            dataUrl,
          });

          // Auto detect corners
          const detected = autoDetectDocumentCorners(rawBuffer);
          setCorners(detected);
          setErrorMessage(null);
          showToast(`Loaded ${file.name}`);
        } catch {
          showToast('Could not process image');
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        showToast('Failed to load image file');
      };

      img.src = objectUrl;
    },
    [showToast]
  );

  // Auto Snap
  const handleAutoSnap = useCallback(() => {
    if (!source) return;
    const detected = autoDetectDocumentCorners(source.buffer);
    setCorners(detected);
    showToast('Auto-snapped to document edges');
  }, [source, showToast]);

  // Reset or Untangle
  const handleResetOrUntangle = useCallback(() => {
    if (!source) return;
    setCorners(getDefaultNormalizedCorners());
    setErrorMessage(null);
    showToast('Reset corners to standard quad');
  }, [source, showToast]);

  // Rotate 90 CW
  const handleRotate90CW = useCallback(() => {
    if (!source) return;

    const oldW = source.width;
    const oldH = source.height;
    const newW = oldH;
    const newH = oldW;

    const oldData = source.buffer.data;
    const newData = new Uint8ClampedArray(newW * newH * 4);

    for (let y = 0; y < oldH; y++) {
      for (let x = 0; x < oldW; x++) {
        const oldIdx = (y * oldW + x) * 4;
        const newX = oldH - 1 - y;
        const newY = x;
        const newIdx = (newY * newW + newX) * 4;
        newData[newIdx] = oldData[oldIdx];
        newData[newIdx + 1] = oldData[oldIdx + 1];
        newData[newIdx + 2] = oldData[oldIdx + 2];
        newData[newIdx + 3] = oldData[oldIdx + 3];
      }
    }

    const tc = document.createElement('canvas');
    tc.width = newW;
    tc.height = newH;
    const tCtx = tc.getContext('2d');
    if (tCtx) {
      const imgData = tCtx.createImageData(newW, newH);
      imgData.data.set(newData);
      tCtx.putImageData(imgData, 0, 0);
    }
    const dataUrl = tc.toDataURL('image/jpeg', 0.9);
    tc.width = 0;
    tc.height = 0;

    const newBuffer: RawPixelBuffer = {
      width: newW,
      height: newH,
      data: newData,
    };

    setSource((prev) =>
      prev
        ? {
            ...prev,
            width: newW,
            height: newH,
            buffer: newBuffer,
            dataUrl,
          }
        : null
    );

    setCorners((prev) => rotateNormalizedCorners90CW(prev));
    showToast('Rotated image 90° clockwise');
  }, [source, showToast]);

  // Build full-resolution export canvas
  const buildFullResCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!source || !dims.isValid || !dims.src) return null;

    const result = runWarpJobSync({
      source: source.buffer,
      srcCorners: dims.src,
      destWidth: dims.w,
      destHeight: dims.h,
      filter: scanFilter,
    });

    if (!result) return null;

    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(result.width, result.height);
    imgData.data.set(result.data);
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }, [source, dims, scanFilter]);

  // Thumbnail generator
  const createThumbnail = (canvas: HTMLCanvasElement): string => {
    const thumbMax = 120;
    const scale = Math.min(1, thumbMax / Math.max(canvas.width, canvas.height));
    const tw = Math.max(2, Math.round(canvas.width * scale));
    const th = Math.max(2, Math.round(canvas.height * scale));

    const tc = document.createElement('canvas');
    tc.width = tw;
    tc.height = th;
    const ctx = tc.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, tw, th);
    }
    const url = tc.toDataURL('image/jpeg', 0.8);
    tc.width = 0;
    tc.height = 0;
    return url;
  };

  // Download export
  const handleExportDownload = useCallback(async () => {
    if (!source || !dims.isValid || isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const fullCanvas = buildFullResCanvas();
      if (!fullCanvas) {
        setErrorMessage('Failed to generate full-resolution scan.');
        setIsExporting(false);
        return;
      }

      const mime =
        outputFormat === 'jpg'
          ? 'image/jpeg'
          : outputFormat === 'webp'
            ? 'image/webp'
            : 'image/png';
      const quality = outputFormat === 'png' ? undefined : 0.95;

      const blob = await new Promise<Blob | null>((resolve) =>
        fullCanvas.toBlob((b) => resolve(b), mime, quality)
      );

      if (!blob) {
        fullCanvas.width = 0;
        fullCanvas.height = 0;
        setErrorMessage('Export failed.');
        setIsExporting(false);
        return;
      }

      const baseName = source.fileName.replace(/\.[^.]+$/, '') || 'scan';
      const downloadName = `${baseName}-straightened.${outputFormat}`;
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 200);

      const thumb = createThumbnail(fullCanvas);
      fullCanvas.width = 0;
      fullCanvas.height = 0;

      onRecordExport({
        id: `scan_${Date.now()}`,
        fileName: downloadName,
        timestamp: Date.now(),
        origWidth: source.width,
        origHeight: source.height,
        outWidth: dims.w,
        outHeight: dims.h,
        skewDegrees: Math.round(skewDegrees * 10) / 10,
        filter: scanFilter,
        preset: aspectPreset,
        corners: [...corners] as Quad,
        thumbnailDataUrl: thumb,
        sampleKey: source.sampleKey,
      });

      showToast(`Exported ${downloadName}`);
    } catch {
      setErrorMessage('Export failed.');
    } finally {
      setIsExporting(false);
    }
  }, [
    source,
    dims,
    isExporting,
    buildFullResCanvas,
    outputFormat,
    onRecordExport,
    skewDegrees,
    scanFilter,
    aspectPreset,
    corners,
    showToast,
  ]);

  // Copy PNG to clipboard
  const handleCopyClipboard = useCallback(async () => {
    if (!source || !dims.isValid || isExporting) return;
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      showToast('Clipboard API unavailable in this browser');
      return;
    }

    setIsExporting(true);
    try {
      const fullCanvas = buildFullResCanvas();
      if (!fullCanvas) {
        setIsExporting(false);
        return;
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        fullCanvas.toBlob((b) => resolve(b), 'image/png')
      );
      const thumb = createThumbnail(fullCanvas);
      fullCanvas.width = 0;
      fullCanvas.height = 0;

      if (!blob) {
        setIsExporting(false);
        return;
      }

      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      setCopiedJustNow(true);
      setTimeout(() => setCopiedJustNow(false), 2200);

      onRecordExport({
        id: `scan_${Date.now()}`,
        fileName: `${source.fileName.replace(/\.[^.]+$/, '')}-copied.png`,
        timestamp: Date.now(),
        origWidth: source.width,
        origHeight: source.height,
        outWidth: dims.w,
        outHeight: dims.h,
        skewDegrees: Math.round(skewDegrees * 10) / 10,
        filter: scanFilter,
        preset: aspectPreset,
        corners: [...corners] as Quad,
        thumbnailDataUrl: thumb,
        sampleKey: source.sampleKey,
      });

      showToast('Copied full-res scan to clipboard');
    } catch {
      showToast('Clipboard access was blocked');
    } finally {
      setIsExporting(false);
    }
  }, [
    source,
    dims,
    isExporting,
    buildFullResCanvas,
    onRecordExport,
    skewDegrees,
    scanFilter,
    aspectPreset,
    corners,
    showToast,
  ]);

  // Imperative action hooks for external triggers
  useEffect(() => {
    actionRef.current = {
      triggerAutoSnap: () => {
        handleAutoSnap();
      },
      applyCrispDocument: () => {
        setScanFilter('document');
        showToast('Applied Crisp Document filter');
      },
      enableSplitCompare: () => {
        setViewMode('split');
        showToast('Switched to split comparison');
      },
      nudgeSampleCorner: () => {
        setCorners((prev) => [
          { x: clamp(prev[0].x + 0.005, 0.02, 0.98), y: clamp(prev[0].y + 0.005, 0.02, 0.98) },
          prev[1],
          prev[2],
          prev[3],
        ]);
        showToast('Fine-tuned corner handle');
      },
      triggerDownload: () => {
        void handleExportDownload();
      },
      loadSpecimen: (key) => {
        loadSampleSpecimen(key);
      },
      restoreSavedScan: (entry) => {
        if (entry.sampleKey) {
          loadSampleSpecimen(entry.sampleKey as SampleSpecimenKey);
          setCorners(entry.corners);
          setScanFilter(entry.filter);
          setAspectPreset(entry.preset);
        } else {
          setCorners(entry.corners);
          setScanFilter(entry.filter);
          setAspectPreset(entry.preset);
        }
        showToast(`Loaded ${entry.fileName}`);
      },
    };
  }, [actionRef, handleAutoSnap, handleExportDownload, loadSampleSpecimen, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || '';
      const isField = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

      // Spacebar hold to peek
      if (!isField && e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePeeking(true);
        return;
      }

      if (isField) return;

      // Ctrl/Cmd + S to download
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleExportDownload();
        return;
      }

      // Ctrl/Cmd + C to copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void handleCopyClipboard();
        return;
      }

      // 'R' to reset
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetOrUntangle();
        return;
      }

      // 'Q' to rotate 90
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handleRotate90CW();
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePeeking(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleExportDownload, handleCopyClipboard, handleResetOrUntangle, handleRotate90CW]);

  // Clipboard paste listener
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleUserFile(file);
            showToast('Pasted image from clipboard');
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleUserFile, showToast]);

  // Corner pointer drag logic
  const updateCornerFromPointer = (idx: number, clientX: number, clientY: number) => {
    const canvas = srcCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;

    const nx = clamp((clientX - rect.left) / rect.width, 0, 1);
    const ny = clamp((clientY - rect.top) / rect.height, 0, 1);

    setCorners((prev) => {
      const next = [...prev] as Quad;
      next[idx] = { x: nx, y: ny };
      return next;
    });

    setLoupeState({
      visible: true,
      normX: nx,
      normY: ny,
      clientX,
      clientY,
      cornerLabel: CORNER_SHORT_LABELS[idx],
    });
  };

  const handleCornerPointerDown = (idx: number, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveCornerIdx(idx);
    updateCornerFromPointer(idx, e.clientX, e.clientY);
  };

  const handleCornerPointerMove = (idx: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (activeCornerIdx !== idx) return;
    e.preventDefault();
    updateCornerFromPointer(idx, e.clientX, e.clientY);
  };

  const handleCornerPointerUp = (idx: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (activeCornerIdx !== idx) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setActiveCornerIdx(null);
    setLoupeState((prev) => ({ ...prev, visible: false }));
  };

  const handleCornerKeyDown = (idx: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }
    e.preventDefault();
    const step = e.shiftKey ? 0.02 : 0.004;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    if (e.key === 'ArrowRight') dx = step;
    if (e.key === 'ArrowUp') dy = -step;
    if (e.key === 'ArrowDown') dy = step;

    setCorners((prev) => {
      const next = [...prev] as Quad;
      next[idx] = {
        x: clamp(prev[idx].x + dx, 0, 1),
        y: clamp(prev[idx].y + dy, 0, 1),
      };
      return next;
    });
  };

  // SVG grid lines geometry
  const svgOverlayGeometry = useMemo(() => {
    const p = corners.map((c) => ({ x: c.x * 1000, y: c.y * 1000 }));
    const pointsAttr = p.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

    const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const t of [1 / 3, 2 / 3]) {
      const left = lerpPoint(p[0], p[3], t);
      const right = lerpPoint(p[1], p[2], t);
      gridLines.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y });

      const top = lerpPoint(p[0], p[1], t);
      const bottom = lerpPoint(p[3], p[2], t);
      gridLines.push({ x1: top.x, y1: top.y, x2: bottom.x, y2: bottom.y });
    }

    return { p, pointsAttr, gridLines };
  }, [corners]);

  // Loupe position styling
  const loupeStyle = useMemo<React.CSSProperties>(() => {
    if (!loupeState.visible) return { display: 'none' };
    const size = 130;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    let left = loupeState.clientX + 24;
    let top = loupeState.clientY - size - 24;

    if (left + size + 16 > vw) left = loupeState.clientX - size - 24;
    if (top < 16) top = loupeState.clientY + 28;
    if (top + size + 16 > vh) top = vh - size - 16;
    left = Math.max(16, left);

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [loupeState]);

  return (
    <section id="workbench" aria-label="Perspective Editor" className="pt-2 pb-6 max-w-7xl mx-auto">
      {/* Google-Style Calm Header Bar */}
      <div className="mb-3 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Mode Segmented Pill */}
        <div
          role="group"
          aria-label="View mode"
          className="inline-flex rounded-full border border-border/80 p-1 bg-surface shadow-2xs self-start"
        >
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            aria-pressed={viewMode === 'dual'}
            className={`inline-flex min-h-8 items-center gap-1.5 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'dual'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Side-by-Side</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('adjust')}
            aria-pressed={viewMode === 'adjust'}
            className={`inline-flex min-h-8 items-center gap-1.5 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'adjust'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Adjust Corners</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('straightened')}
            aria-pressed={viewMode === 'straightened'}
            className={`inline-flex min-h-8 items-center gap-1.5 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'straightened'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Scan Result</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            aria-pressed={viewMode === 'split'}
            className={`inline-flex min-h-8 items-center gap-1.5 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'split'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Curtain</span>
          </button>
        </div>

        {/* Right Info & Sample Dropdown: Google Clean */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Sample Specimen Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted hidden sm:inline">Sample:</span>
            <select
              value={activeSample}
              onChange={(e) => loadSampleSpecimen(e.target.value as SampleSpecimenKey)}
              aria-label="Load demo sample photo"
              className="min-h-8 rounded-full border border-border/80 bg-surface px-3 text-xs font-medium text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-primary shadow-2xs"
            >
              {SAMPLE_SPECIMENS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry pill */}
          {dims.isValid && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-muted bg-surface border border-border/70 rounded-full px-2.5 py-1">
              <span className="text-foreground font-semibold">{dims.w}×{dims.h}px</span>
              <span aria-hidden="true">·</span>
              <span className="text-primary font-medium">{skewDegrees.toFixed(1)}° fixed</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Viewport: Google Material Clean */}
      <div className="rounded-2xl border border-border/80 bg-surface shadow-md overflow-hidden flex flex-col">
        {/* Unified Google-Style Action Bar */}
        <div className="px-4 py-3 border-b border-border/70 bg-surface/95 flex flex-wrap items-center justify-between gap-3">
          {/* Left Actions: Upload & Auto-Snap */}
          <div className="flex items-center gap-2">
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload photo to straighten"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUserFile(f);
                e.target.value = '';
              }}
            />

            <Button
              tone="quiet"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new image"
              className="min-h-9 px-3.5 text-xs rounded-full font-medium"
            >
              <ImagePlus className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Upload Photo</span>
            </Button>

            <Button
              tone="quiet"
              onClick={handleAutoSnap}
              title="Automatically detect document borders"
              className="min-h-9 px-3.5 text-xs rounded-full font-medium"
            >
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Auto-Snap</span>
            </Button>

            <Button
              tone="quiet"
              onClick={handleResetOrUntangle}
              title="Reset corners (R)"
              className="min-h-9 w-9 px-0 rounded-full text-muted hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>

            <Button
              tone="quiet"
              onClick={handleRotate90CW}
              title="Rotate 90 degrees clockwise (Q)"
              className="min-h-9 w-9 px-0 rounded-full text-muted hover:text-foreground"
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>

          {/* Center: Filter Pills (Google Photos Style) */}
          <div className="flex items-center gap-1 bg-well/70 p-1 rounded-full border border-border/60">
            {FILTER_OPTIONS.map((f) => {
              const active = scanFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setScanFilter(f.value)}
                  title={f.tip}
                  className={`min-h-7 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-surface text-foreground font-semibold shadow-2xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Right Actions: Proportions, Format, Export */}
          <div className="flex items-center gap-2">
            {/* Aspect Preset */}
            <select
              value={aspectPreset}
              onChange={(e) => setAspectPreset(e.target.value as AspectPreset)}
              aria-label="Target aspect ratio"
              title="Output proportion"
              className="min-h-9 rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            >
              {ASPECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Format choice */}
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              aria-label="Export file format"
              className="min-h-9 rounded-full border border-border bg-surface px-2.5 text-xs font-medium text-foreground cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>

            {/* Quick Copy */}
            <Button
              tone="quiet"
              onClick={() => void handleCopyClipboard()}
              disabled={!dims.isValid || isExporting}
              title="Copy PNG to clipboard (Ctrl+C)"
              className="min-h-9 px-3 text-xs rounded-full hidden sm:inline-flex"
            >
              {copiedJustNow ? (
                <Check className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copiedJustNow ? 'Copied' : 'Copy'}</span>
            </Button>

            {/* Primary Google-Style Save / Export Button */}
            <Button
              tone="primary"
              onClick={() => void handleExportDownload()}
              disabled={!dims.isValid || isExporting}
              title="Download full-resolution straightened image (Ctrl+S)"
              className="min-h-9 px-4 text-xs rounded-full font-medium shadow-xs"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isExporting ? 'Saving…' : 'Save Scan'}</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="px-4 py-2.5 bg-danger-soft border-b border-border text-danger text-xs flex items-center justify-between gap-3"
          >
            <span>{errorMessage}</span>
            <Button tone="quiet" onClick={handleResetOrUntangle} className="min-h-7 px-3 text-xs rounded-full">
              Untangle
            </Button>
          </div>
        )}

        {/* Viewport Canvas Stages */}
        <div className="relative bg-well/40 min-h-[460px] sm:min-h-[540px] flex items-center justify-center p-4 sm:p-6">
          {/* Dual Mode: Clean Side by Side */}
          {viewMode === 'dual' && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
              {/* Left: Source with drag reticles */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative inline-block select-none max-w-full">
                  <canvas
                    ref={srcCanvasRef}
                    data-testid="source-canvas"
                    aria-label="Original skewed photograph"
                    className="block max-w-full max-h-[56dvh] w-auto h-auto rounded-xl shadow-md border border-border/50"
                  />

                  {/* SVG projective alignment grid & polygon */}
                  <svg
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
                  >
                    <polygon
                      points={svgOverlayGeometry.pointsAttr}
                      fill="var(--color-primary)"
                      fillOpacity="0.12"
                      stroke="var(--color-primary)"
                      strokeWidth="2.2"
                      vectorEffect="non-scaling-stroke"
                    />
                    {svgOverlayGeometry.gridLines.map((ln, idx) => (
                      <line
                        key={idx}
                        x1={ln.x1}
                        y1={ln.y1}
                        x2={ln.x2}
                        y2={ln.y2}
                        stroke="var(--color-primary)"
                        strokeOpacity="0.5"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </svg>

                  {/* 4 Interactive Corner Drag Handles (Google Reticle Style) */}
                  {corners.map((pt, idx) => (
                    <CornerReticle
                      key={CORNER_SHORT_LABELS[idx]}
                      idx={idx}
                      pt={pt}
                      isDraggingThis={activeCornerIdx === idx}
                      onPointerDown={(e) => handleCornerPointerDown(idx, e)}
                      onPointerMove={(e) => handleCornerPointerMove(idx, e)}
                      onPointerUp={(e) => handleCornerPointerUp(idx, e)}
                      onKeyDown={(e) => handleCornerKeyDown(idx, e)}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Original – Drag the corners
                </p>
              </div>

              {/* Right: Straightened Result */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative inline-flex items-center justify-center p-2 rounded-xl drafting-grid border border-border/50 shadow-md">
                  <canvas
                    ref={prevCanvasRef}
                    data-testid="preview-canvas"
                    aria-label="Perspective corrected output preview"
                    className={`block max-w-full max-h-[56dvh] w-auto h-auto rounded-lg transition-opacity duration-150 ${
                      isSpacePeeking ? 'opacity-0' : 'opacity-100'
                    }`}
                  />

                  {/* Spacebar peek overlay */}
                  {isSpacePeeking && (
                    <div className="absolute inset-2 flex items-center justify-center bg-black/50 rounded-lg">
                      <img
                        src={source?.dataUrl}
                        alt="Original skewed photo peek"
                        className="max-w-full max-h-[54dvh] w-auto h-auto rounded-lg shadow-xl border border-primary"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/80 text-white text-[11px] font-mono flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        Original Peek
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Fixed – Ready to download
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  Hold <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-[10px]">Space</kbd> to peek
                </p>
              </div>
            </div>
          )}

          {/* Adjust Mode: Large Immersive Canvas */}
          {viewMode === 'adjust' && (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="relative inline-block select-none max-w-full">
                <canvas
                  ref={srcCanvasRef}
                  data-testid="source-canvas"
                  aria-label="Original skewed photograph"
                  className="block max-w-full max-h-[65dvh] w-auto h-auto rounded-xl shadow-lg border border-border/50"
                />

                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
                >
                  <polygon
                    points={svgOverlayGeometry.pointsAttr}
                    fill="var(--color-primary)"
                    fillOpacity="0.12"
                    stroke="var(--color-primary)"
                    strokeWidth="2.2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {svgOverlayGeometry.gridLines.map((ln, idx) => (
                    <line
                      key={idx}
                      x1={ln.x1}
                      y1={ln.y1}
                      x2={ln.x2}
                      y2={ln.y2}
                      stroke="var(--color-primary)"
                      strokeOpacity="0.5"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>

                {corners.map((pt, idx) => (
                  <CornerReticle
                    key={CORNER_SHORT_LABELS[idx]}
                    idx={idx}
                    pt={pt}
                    isDraggingThis={activeCornerIdx === idx}
                    onPointerDown={(e) => handleCornerPointerDown(idx, e)}
                    onPointerMove={(e) => handleCornerPointerMove(idx, e)}
                    onPointerUp={(e) => handleCornerPointerUp(idx, e)}
                    onKeyDown={(e) => handleCornerKeyDown(idx, e)}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Drag corner reticles to match the document boundaries. Switch to Scan Result above to review.
              </p>
            </div>
          )}

          {/* Straightened Mode: Large Immersive Result */}
          {viewMode === 'straightened' && (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="relative inline-flex items-center justify-center p-3 rounded-2xl drafting-grid border border-border/50 shadow-lg">
                <canvas
                  ref={prevCanvasRef}
                  data-testid="preview-canvas"
                  aria-label="Perspective corrected output preview"
                  className={`block max-w-full max-h-[65dvh] w-auto h-auto rounded-xl transition-opacity duration-150 ${
                    isSpacePeeking ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {isSpacePeeking && (
                  <div className="absolute inset-3 flex items-center justify-center bg-black/60 rounded-xl">
                    <img
                      src={source?.dataUrl}
                      alt="Original skewed photo peek"
                      className="max-w-full max-h-[62dvh] w-auto h-auto rounded-xl shadow-2xl border border-primary"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/85 text-white text-xs font-mono flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      Original Peek Active
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-muted">
                Hold <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[11px]">Space</kbd> anytime to peek original camera angle
              </p>
            </div>
          )}

          {/* Split Curtain Mode */}
          {viewMode === 'split' && (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-medium text-foreground">Split Curtain:</span>
                <span className="text-xs font-mono text-muted">{splitPercent}%</span>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(Number(e.target.value))}
                  aria-label="Split curtain position"
                  className="w-36 sm:w-56 accent-primary cursor-pointer"
                />
              </div>

              <div
                className="relative inline-flex items-center justify-center max-w-full overflow-hidden rounded-xl shadow-lg border border-border/50 select-none drafting-grid p-2"
                data-testid="split-compare-stage"
              >
                <canvas
                  ref={splitFixedCanvasRef}
                  aria-label="Straightened after canvas"
                  className="block max-w-full max-h-[58dvh] w-auto h-auto rounded-lg"
                />

                <div
                  style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                  className="absolute inset-2 bg-well flex items-center justify-center pointer-events-none rounded-lg overflow-hidden"
                >
                  <canvas
                    ref={splitOrigCanvasRef}
                    aria-label="Original before canvas"
                    className="block w-full h-full object-contain"
                  />
                </div>

                <div
                  style={{ left: `${splitPercent}%` }}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-2 -translate-x-1/2 w-0.5 bg-primary flex items-center justify-center shadow-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground border border-white flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                    ↔
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optical Reticle 3.5x Loupe Magnifier */}
      <div
        style={loupeStyle}
        aria-hidden="true"
        className="pointer-events-none fixed z-50 overflow-hidden rounded-full border-2 border-white/90 bg-black/90 shadow-2xl ring-2 ring-primary/40 backdrop-blur-xs"
      >
        <canvas ref={loupeCanvasRef} className="block w-[130px] h-[130px]" />
        <div className="absolute bottom-1.5 inset-x-0 text-center">
          <span className="rounded-full bg-black/75 px-2 py-0.5 font-mono text-[9px] font-bold text-white uppercase tracking-wider">
            {loupeState.cornerLabel} · 3.5×
          </span>
        </div>
      </div>

      {/* Toast notifications */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-medium text-foreground shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Full-Window Drag & Drop Overlay */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) {
            setIsDraggingFile(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleUserFile(f);
        }}
        className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs transition-opacity duration-150 ${
          isDraggingFile ? 'pointer-events-auto opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-2xl border-2 border-dashed border-primary bg-surface p-8 text-center shadow-2xl">
          <UploadCloud className="w-12 h-12 text-primary mx-auto mb-2" />
          <p className="text-base font-semibold text-foreground">Drop photo to straighten</p>
          <p className="text-xs text-muted mt-1">Receipt, document, whiteboard, or sign</p>
        </div>
      </div>
    </section>
  );
};
