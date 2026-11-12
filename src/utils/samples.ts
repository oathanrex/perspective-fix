import {
  type AspectPreset,
  type Quad,
  type RawPixelBuffer,
  type ScanFilter,
  computeHomography,
} from './perspective';

export type SampleSpecimenKey =
  | 'receipt'
  | 'whiteboard'
  | 'contract'
  | 'book'
  | 'architecture'
  | 'poster';

export interface SampleSpecimenMeta {
  key: SampleSpecimenKey;
  label: string;
  useCaseTitle: string;
  useCaseCaption: string;
  fileName: string;
  recommendedPreset: AspectPreset;
  recommendedFilter: ScanFilter;
  trueCorners: Quad;
}

export const SAMPLE_SPECIMENS: readonly SampleSpecimenMeta[] = [
  {
    key: 'receipt',
    label: 'Expense receipt',
    useCaseTitle: 'Receipts & invoices',
    useCaseCaption: 'Turn angled desk receipts into flat accounting PDFs and PNGs.',
    fileName: 'studio-supply-receipt.jpg',
    recommendedPreset: 'receipt',
    recommendedFilter: 'document',
    trueCorners: [
      { x: 0.31, y: 0.09 },
      { x: 0.68, y: 0.14 },
      { x: 0.77, y: 0.91 },
      { x: 0.21, y: 0.86 },
    ],
  },
  {
    key: 'whiteboard',
    label: 'Sprint whiteboard',
    useCaseTitle: 'Meeting whiteboards',
    useCaseCaption: 'Capture side-seat conference boards without glare or keystone slant.',
    fileName: 'architecture-whiteboard.jpg',
    recommendedPreset: 'slide_16_9',
    recommendedFilter: 'whiteboard',
    trueCorners: [
      { x: 0.11, y: 0.17 },
      { x: 0.89, y: 0.09 },
      { x: 0.92, y: 0.85 },
      { x: 0.08, y: 0.79 },
    ],
  },
  {
    key: 'contract',
    label: 'Signed A4 page',
    useCaseTitle: 'Document scans',
    useCaseCaption: 'Flatten contracts, forms, and hand-signed letters at full resolution.',
    fileName: 'service-agreement-a4.jpg',
    recommendedPreset: 'a4_portrait',
    recommendedFilter: 'document',
    trueCorners: [
      { x: 0.24, y: 0.11 },
      { x: 0.74, y: 0.08 },
      { x: 0.84, y: 0.89 },
      { x: 0.15, y: 0.92 },
    ],
  },
  {
    key: 'book',
    label: 'Textbook page',
    useCaseTitle: 'Book & study notes',
    useCaseCaption: 'Square up angled library pages and lecture handouts for easy reading.',
    fileName: 'optical-geometry-notes.jpg',
    recommendedPreset: 'letter',
    recommendedFilter: 'bw',
    trueCorners: [
      { x: 0.19, y: 0.14 },
      { x: 0.78, y: 0.09 },
      { x: 0.85, y: 0.88 },
      { x: 0.14, y: 0.84 },
    ],
  },
  {
    key: 'architecture',
    label: 'Building facade',
    useCaseTitle: 'Architecture & real estate',
    useCaseCaption: 'Correct converging vertical walls when shooting upward from street level.',
    fileName: 'limestone-studio-facade.jpg',
    recommendedPreset: 'square',
    recommendedFilter: 'original',
    trueCorners: [
      { x: 0.23, y: 0.12 },
      { x: 0.77, y: 0.12 },
      { x: 0.89, y: 0.91 },
      { x: 0.11, y: 0.91 },
    ],
  },
  {
    key: 'poster',
    label: 'Gallery poster',
    useCaseTitle: 'Signs, screens & posters',
    useCaseCaption: 'Square up exhibition prints, slides, and framed artwork cleanly.',
    fileName: 'zurich-grid-exhibition.jpg',
    recommendedPreset: 'a4_portrait',
    recommendedFilter: 'original',
    trueCorners: [
      { x: 0.26, y: 0.09 },
      { x: 0.79, y: 0.16 },
      { x: 0.74, y: 0.91 },
      { x: 0.19, y: 0.85 },
    ],
  },
] as const;

function drawFlatSubject(key: SampleSpecimenKey): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let w = 680;
  let h = 920;

  if (key === 'receipt') {
    w = 500;
    h = 1040;
  } else if (key === 'whiteboard') {
    w = 1040;
    h = 585;
  } else if (key === 'architecture') {
    w = 760;
    h = 760;
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (key === 'receipt') {
    // Thermal paper with realistic slight warm shadow gradient toward bottom-right
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f7f6f1');
    grad.addColorStop(0.65, '#eceae2');
    grad.addColorStop(1, '#dad6cb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.font = '700 30px ui-monospace, monospace';
    ctx.fillText('ATELIER PAPER & INK', w / 2, 78);
    ctx.font = '400 18px ui-monospace, monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('418 Mercer St · Receipt #4092', w / 2, 114);
    ctx.fillText('12 Nov 2026 · 09:42', w / 2, 142);

    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 174);
    ctx.lineTo(w - 38, 174);
    ctx.stroke();
    ctx.setLineDash([]);

    const items: [string, string][] = [
      ['A4 Cotton Rag Pad (250g)', '$28.50'],
      ['Technical Liner 0.3mm ×3', '$14.40'],
      ['Drafting Scale Brass 30cm', '$34.00'],
      ['Archival Binding Tape', '$11.20'],
      ['Flat White Oat', '$5.25'],
    ];

    ctx.font = '500 20px ui-monospace, monospace';
    let y = 228;
    for (const [name, price] of items) {
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'left';
      ctx.fillText(name, 42, y);
      ctx.textAlign = 'right';
      ctx.fillText(price, w - 42, y);
      y += 58;
    }

    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(38, y + 8);
    ctx.lineTo(w - 38, y + 8);
    ctx.stroke();

    ctx.font = '600 22px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SUBTOTAL', 42, y + 54);
    ctx.textAlign = 'right';
    ctx.fillText('$93.35', w - 42, y + 54);

    ctx.font = '400 20px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TAX (8.875%)', 42, y + 92);
    ctx.textAlign = 'right';
    ctx.fillText('$8.28', w - 42, y + 92);

    ctx.font = '700 30px ui-monospace, monospace';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL PAID', 42, y + 150);
    ctx.textAlign = 'right';
    ctx.fillText('$101.63', w - 42, y + 150);

    // Emerald PAID stamp
    ctx.save();
    ctx.translate(w / 2, y + 245);
    ctx.rotate(-0.08);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.strokeRect(-115, -32, 230, 64);
    ctx.fillStyle = '#059669';
    ctx.textAlign = 'center';
    ctx.font = '700 26px sans-serif';
    ctx.fillText('VERIFIED · CARD', 0, 9);
    ctx.restore();

    // Barcode bars at bottom
    ctx.fillStyle = '#1e293b';
    let bx = 76;
    for (let i = 0; i < 48; i++) {
      const bw = (i * 7) % 3 === 0 ? 5 : 2;
      ctx.fillRect(bx, h - 130, bw, 68);
      bx += bw + ((i * 5) % 4) + 2;
      if (bx > w - 80) break;
    }
  } else if (key === 'whiteboard') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f4f7f8');
    grad.addColorStop(0.5, '#eef2f5');
    grad.addColorStop(1, '#dce3e9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Aluminum frame border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, w - 14, h - 14);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 34px sans-serif';
    ctx.fillText('Q4 Release Pipeline — Zero-Upload Engine', 52, 78);

    // Diagram nodes
    const nodes = [
      { x: 60, y: 150, title: '1. Raw Photo', sub: 'Skewed phone shot', color: '#0284c7' },
      { x: 380, y: 150, title: '2. Quad Matrix', sub: '3×3 Homography', color: '#059669' },
      { x: 700, y: 150, title: '3. Clean Export', sub: 'PNG / JPG / Clipboard', color: '#d97706' },
    ];

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(n.x, n.y, 260, 130, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = n.color;
      ctx.font = '700 24px sans-serif';
      ctx.fillText(n.title, n.x + 22, n.y + 54);
      ctx.fillStyle = '#334155';
      ctx.font = '500 19px sans-serif';
      ctx.fillText(n.sub, n.x + 22, n.y + 92);

      if (i < nodes.length - 1) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(n.x + 268, n.y + 65);
        ctx.lineTo(nodes[i + 1].x - 12, n.y + 65);
        ctx.stroke();
      }
    }

    // Bullet notes
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 23px sans-serif';
    ctx.fillText('Sprint Acceptance Targets:', 60, 360);
    ctx.font = '500 21px sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText('✓ Sub-50ms Web Worker live preview during corner drag', 76, 408);
    ctx.fillStyle = '#0284c7';
    ctx.fillText('✓ Adaptive shadow removal keeps coloured marker ink crisp', 76, 452);
    ctx.fillStyle = '#b45309';
    ctx.fillText('✓ Static relative bundle deploys cleanly on GitHub Pages', 76, 496);
  } else if (key === 'contract') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fbfaf6');
    grad.addColorStop(1, '#e2dfd5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#059669';
    ctx.fillRect(56, 56, 72, 8);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 32px sans-serif';
    ctx.fillText('DESIGN & ENGINEERING RETAINER', 56, 112);
    ctx.font = '500 18px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Reference: PFX-2026-11 · Effective Date: November 12, 2026', 56, 148);

    const paragraphs = [
      '1. Scope of Work. Studio agrees to deliver client-side optical image rectification,',
      '   homography calibration, and accessible web components with zero external uploads.',
      '2. Confidentiality. All source photographs, receipts, and technical drawings remain',
      '   strictly inside the client browser memory and never transit third-party servers.',
      '3. Deliverables. Production-ready static assets compatible with GitHub Pages and',
      '   offline-capable progressive browsers at full original sensor resolution.',
    ];

    ctx.fillStyle = '#1e293b';
    ctx.font = '400 19px serif';
    let py = 216;
    for (const line of paragraphs) {
      ctx.fillText(line, 56, py);
      py += 42;
    }

    // Table box
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 495, w - 112, 160);
    ctx.beginPath();
    ctx.moveTo(56, 548);
    ctx.lineTo(w - 56, 548);
    ctx.stroke();

    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Milestone Deliverable', 76, 528);
    ctx.fillText('Fee (USD)', w - 190, 528);
    ctx.font = '400 18px sans-serif';
    ctx.fillText('Phase I — Perspective Homography Core', 76, 586);
    ctx.fillText('$4,200.00', w - 190, 586);
    ctx.fillText('Phase II — Scanner Illumination Filter', 76, 628);
    ctx.fillText('$2,600.00', w - 190, 628);

    // Signature line
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(56, 800);
    ctx.lineTo(320, 800);
    ctx.stroke();

    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(74, 786);
    ctx.bezierCurveTo(110, 735, 145, 795, 185, 752);
    ctx.bezierCurveTo(215, 725, 240, 785, 295, 764);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '500 16px sans-serif';
    ctx.fillText('Authorized Signature · Oathan Rex', 56, 830);
  } else if (key === 'book') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#d8d3c8');
    grad.addColorStop(0.12, '#f5f2e9');
    grad.addColorStop(1, '#e7e2d5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.font = '600 16px serif';
    ctx.fillText('CHAPTER 4 · PROJECTIVE GEOMETRY IN CAMERAS', 68, 72);

    ctx.font = '700 34px serif';
    ctx.fillText('4.2 Planar Homography Rectification', 68, 134);

    const lines = [
      'When a planar surface such as a printed page or architectural facade is',
      'imaged from an oblique camera angle, parallel lines converge toward finite',
      'vanishing points. A non-singular 3 × 3 projective matrix H maps any four',
      'non-collinear corner points on the tilted plane onto a Euclidean rectangle.',
      '',
      'Unlike simple affine rotation or rectangular cropping, planar homography',
      'restores uniform character spacing and true right-angle proportions across',
      'the entire document surface.',
    ];

    ctx.font = '400 20px serif';
    let ly = 198;
    for (const l of lines) {
      ctx.fillText(l, 68, ly);
      ly += 38;
    }

    // Geometric figure inside textbook page
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(390, 560, 195, 240);
    ctx.beginPath();
    ctx.moveTo(95, 595);
    ctx.lineTo(275, 560);
    ctx.lineTo(300, 795);
    ctx.lineTo(75, 775);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#059669';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(295, 675);
    ctx.lineTo(375, 675);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#475569';
    ctx.font = 'italic 17px serif';
    ctx.fillText('Fig 4.8 — Mapping tilted quad Q to orthogonal frame R.', 68, 858);
  } else if (key === 'architecture') {
    // Limestone facade square elevation
    ctx.fillStyle = '#e8e2d5';
    ctx.fillRect(0, 0, w, h);

    // Subtle stone ashlar courses
    ctx.strokeStyle = '#cfc7b6';
    ctx.lineWidth = 2;
    for (let y = 60; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Cornice
    ctx.fillStyle = '#c2b8a3';
    ctx.fillRect(0, 0, w, 54);
    ctx.fillStyle = '#293241';
    ctx.fillRect(48, 520, w - 96, 240);

    // Upper studio windows (3×2 grid)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = 78 + col * 218;
        const wy = 108 + row * 192;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(wx, wy, 168, 142);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 5;
        ctx.strokeRect(wx, wy, 168, 142);
        ctx.beginPath();
        ctx.moveTo(wx + 84, wy);
        ctx.lineTo(wx + 84, wy + 142);
        ctx.moveTo(wx, wy + 71);
        ctx.lineTo(wx + 168, wy + 71);
        ctx.stroke();
      }
    }

    // Storefront fascia lettering
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = '600 28px sans-serif';
    ctx.fillText('KILN & COMPASS ARCHITECTURAL PRESS', w / 2, 572);

    ctx.fillStyle = '#3d5a80';
    ctx.fillRect(88, 604, w - 176, 136);
  } else {
    // Exhibition Swiss Grid Poster
    ctx.fillStyle = '#132a24';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(54, 54, 260, 260);
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(344, 54, 282, 260);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(54, 344, 572, 190);

    ctx.fillStyle = '#f4f1ea';
    ctx.font = '700 54px sans-serif';
    ctx.fillText('ZURICH', 54, 628);
    ctx.fillText('OPTICAL', 54, 690);
    ctx.fillText('SYSTEMS', 54, 752);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px sans-serif';
    ctx.fillText('KUNSTHALLE · HALL 3 · 14 NOV – 28 DEC', 54, 825);
  }

  return canvas;
}

/**
 * Generates a realistic 1200×900 skewed scene on a textured desk or wall surface
 * by projecting the flat subject onto `meta.trueCorners` via exact planar homography.
 */
export function renderSkewedSpecimenScene(key: SampleSpecimenKey): {
  canvas: HTMLCanvasElement;
  buffer: RawPixelBuffer;
  meta: SampleSpecimenMeta;
} {
  const meta = SAMPLE_SPECIMENS.find((m) => m.key === key) || SAMPLE_SPECIMENS[0];
  const sceneW = 1200;
  const sceneH = 900;

  const flatCanvas = drawFlatSubject(meta.key);
  const flatCtx = flatCanvas.getContext('2d')!;
  const flatData = flatCtx.getImageData(0, 0, flatCanvas.width, flatCanvas.height);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = sceneW;
  outCanvas.height = sceneH;
  const ctx = outCanvas.getContext('2d')!;

  // Draw ambient environment backdrop (dark walnut desk, conference wall, or sky)
  const bgGrad = ctx.createLinearGradient(0, 0, sceneW, sceneH);
  if (key === 'architecture') {
    bgGrad.addColorStop(0, '#38bdf8');
    bgGrad.addColorStop(0.6, '#7dd3fc');
    bgGrad.addColorStop(1, '#334155');
  } else if (key === 'whiteboard' || key === 'poster') {
    bgGrad.addColorStop(0, '#334155');
    bgGrad.addColorStop(1, '#1e293b');
  } else {
    // Rich dark drafting desk surface so bright paper edges contrast cleanly
    bgGrad.addColorStop(0, '#27221e');
    bgGrad.addColorStop(0.5, '#1f1b18');
    bgGrad.addColorStop(1, '#151210');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, sceneW, sceneH);

  // Subtle desk grain lines
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let y = 12; y < sceneH; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(sceneW, y + 8);
    ctx.stroke();
  }

  const quadPx: Quad = [
    { x: meta.trueCorners[0].x * sceneW, y: meta.trueCorners[0].y * sceneH },
    { x: meta.trueCorners[1].x * sceneW, y: meta.trueCorners[1].y * sceneH },
    { x: meta.trueCorners[2].x * sceneW, y: meta.trueCorners[2].y * sceneH },
    { x: meta.trueCorners[3].x * sceneW, y: meta.trueCorners[3].y * sceneH },
  ];

  // Realistic cast drop shadow under tilted document
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.filter = 'blur(16px)';
  ctx.beginPath();
  ctx.moveTo(quadPx[0].x + 12, quadPx[0].y + 18);
  ctx.lineTo(quadPx[1].x + 16, quadPx[1].y + 20);
  ctx.lineTo(quadPx[2].x + 18, quadPx[2].y + 24);
  ctx.lineTo(quadPx[3].x + 12, quadPx[3].y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const sceneImgData = ctx.getImageData(0, 0, sceneW, sceneH);
  const sd = sceneImgData.data;
  const fd = flatData.data;
  const fw = flatCanvas.width;
  const fh = flatCanvas.height;

  // Map scene pixel (x, y) -> flat subject (u, v)
  const H = computeHomography(quadPx, [
    { x: 0, y: 0 },
    { x: fw - 1, y: 0 },
    { x: fw - 1, y: fh - 1 },
    { x: 0, y: fh - 1 },
  ]);

  if (H) {
    const minX = Math.max(0, Math.floor(Math.min(quadPx[0].x, quadPx[1].x, quadPx[2].x, quadPx[3].x) - 2));
    const maxX = Math.min(sceneW - 1, Math.ceil(Math.max(quadPx[0].x, quadPx[1].x, quadPx[2].x, quadPx[3].x) + 2));
    const minY = Math.max(0, Math.floor(Math.min(quadPx[0].y, quadPx[1].y, quadPx[2].y, quadPx[3].y) - 2));
    const maxY = Math.min(sceneH - 1, Math.ceil(Math.max(quadPx[0].y, quadPx[1].y, quadPx[2].y, quadPx[3].y) + 2));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w = H[6] * x + H[7] * y + H[8];
        if (w === 0) continue;
        const u = (H[0] * x + H[1] * y + H[2]) / w;
        const v = (H[3] * x + H[4] * y + H[5]) / w;

        if (u >= 0 && u <= fw - 1.001 && v >= 0 && v <= fh - 1.001) {
          const u0 = u | 0;
          const v0 = v | 0;
          const du = u - u0;
          const dv = v - v0;
          const i0 = (v0 * fw + u0) * 4;
          const i1 = i0 + 4;
          const i2 = i0 + fw * 4;
          const i3 = i2 + 4;

          const w0 = (1 - du) * (1 - dv);
          const w1 = du * (1 - dv);
          const w2 = (1 - du) * dv;
          const w3 = du * dv;

          const di = (y * sceneW + x) * 4;
          sd[di] = (w0 * fd[i0] + w1 * fd[i1] + w2 * fd[i2] + w3 * fd[i3] + 0.5) | 0;
          sd[di + 1] = (w0 * fd[i0 + 1] + w1 * fd[i1 + 1] + w2 * fd[i2 + 1] + w3 * fd[i3 + 1] + 0.5) | 0;
          sd[di + 2] = (w0 * fd[i0 + 2] + w1 * fd[i1 + 2] + w2 * fd[i2 + 2] + w3 * fd[i3 + 2] + 0.5) | 0;
          sd[di + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(sceneImgData, 0, 0);

  // Clean up temporary flat canvas
  flatCanvas.width = 0;
  flatCanvas.height = 0;

  return {
    canvas: outCanvas,
    buffer: {
      width: sceneW,
      height: sceneH,
      data: sceneImgData.data,
    },
    meta,
  };
}
