export interface Point {
  x: number;
  y: number;
}

export type Quad = [Point, Point, Point, Point];

export type AspectPreset =
  | 'auto'
  | 'a4_portrait'
  | 'a4_landscape'
  | 'letter'
  | 'receipt'
  | 'slide_16_9'
  | 'square';

export type ScanFilter = 'original' | 'document' | 'bw' | 'whiteboard';

export type OutputFormat = 'png' | 'jpg' | 'webp';

export interface DimensionResult {
  w: number;
  h: number;
  src: Quad | null;
  isValid: boolean;
  reason?: string;
}

export const PERSPECTIVE_LIMITS = Object.freeze({
  MAX_INPUT_PIXELS: 100_000_000,
  MAX_OUTPUT_DIMENSION: 4096,
  MAX_OUTPUT_PIXELS: 16_000_000,
  MAX_ASPECT_RATIO: 10,
  MAX_PREVIEW_SIZE: 640,
  CORNER_MARGIN_RATIO: 0.1,
  EPSILON: 1.0,
});

export const CORNER_LABELS = ['Top-left', 'Top-right', 'Bottom-right', 'Bottom-left'] as const;
export const CORNER_SHORT_LABELS = ['TL', 'TR', 'BR', 'BL'] as const;

export function isValidNumber(val: unknown): val is number {
  return typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function dist(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function crossProduct2D(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Checks if 4 points in pixel coordinates form a strictly convex, non-degenerate
 * clockwise quadrilateral (TL -> TR -> BR -> BL in screen coordinates where +Y is down).
 */
export function isValidQuad(points: readonly Point[]): points is Quad {
  if (!Array.isArray(points) || points.length !== 4) {
    return false;
  }

  for (let i = 0; i < 4; i++) {
    const p = points[i];
    if (!p || !isValidNumber(p.x) || !isValidNumber(p.y)) {
      return false;
    }
  }

  const signs: number[] = [];
  for (let i = 0; i < 4; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % 4];
    const p3 = points[(i + 2) % 4];

    if (dist(p1, p2) < PERSPECTIVE_LIMITS.EPSILON) {
      return false;
    }

    const cp = crossProduct2D(p1, p2, p3);
    if (Math.abs(cp) < PERSPECTIVE_LIMITS.EPSILON) {
      return false;
    }
    signs.push(Math.sign(cp));
  }

  // In screen space (+X right, +Y down), TL->TR->BR->BL has positive cross products (> 0)
  // Require consistent positive clockwise winding so output isn't mirrored
  if (signs[0] <= 0) {
    return false;
  }

  for (let i = 1; i < 4; i++) {
    if (signs[i] !== signs[0]) {
      return false;
    }
  }

  return true;
}

/**
 * Untangles any 4 points into a clean [TL, TR, BR, BL] clockwise quad around their centroid.
 */
export function orderQuadCorners(points: readonly Point[]): Quad {
  if (points.length !== 4) {
    return [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ];
  }

  const cx = (points[0].x + points[1].x + points[2].x + points[3].x) / 4;
  const cy = (points[0].y + points[1].y + points[2].y + points[3].y) / 4;

  // Sort clockwise by angle from centroid; atan2(-dy, -dx) starts near top-left
  const sorted = [...points].sort((a, b) => {
    const angA = Math.atan2(a.y - cy, a.x - cx);
    const angB = Math.atan2(b.y - cy, b.x - cx);
    return angA - angB;
  });

  // Rotate array so index 0 minimizes (x + y) -> Top-Left
  let tlIdx = 0;
  let minSum = Infinity;
  for (let i = 0; i < 4; i++) {
    const sum = sorted[i].x + sorted[i].y;
    if (sum < minSum) {
      minSum = sum;
      tlIdx = i;
    }
  }

  return [
    { ...sorted[tlIdx] },
    { ...sorted[(tlIdx + 1) % 4] },
    { ...sorted[(tlIdx + 2) % 4] },
    { ...sorted[(tlIdx + 3) % 4] },
  ];
}

export function getDefaultNormalizedCorners(
  margin: number = PERSPECTIVE_LIMITS.CORNER_MARGIN_RATIO
): Quad {
  const m = clamp(margin, 0.02, 0.35);
  return [
    { x: m, y: m },
    { x: 1 - m, y: m },
    { x: 1 - m, y: 1 - m },
    { x: m, y: 1 - m },
  ];
}

export function rotateNormalizedCorners90CW(normPts: Quad): Quad {
  // On 90° CW image rotation: normalized (u, v) -> (1 - v, u)
  // Old BL becomes new TL, old TL -> new TR, old TR -> new BR, old BR -> new BL
  const rotated = normPts.map((p) => ({
    x: clamp(1 - p.y, 0, 1),
    y: clamp(p.x, 0, 1),
  }));
  return [rotated[3], rotated[0], rotated[1], rotated[2]];
}

/**
 * Computes real average keystone skew angle in degrees relative to axis-aligned edges.
 * Returns 0.0 when edges are perfectly horizontal and vertical.
 */
export function computeSkewAngleDegrees(normPts: Quad, imgWidth: number, imgHeight: number): number {
  const px = normPts.map((p) => ({ x: p.x * imgWidth, y: p.y * imgHeight }));
  // Top edge angle vs +X (0 rad)
  const topDeg = Math.abs((Math.atan2(px[1].y - px[0].y, px[1].x - px[0].x) * 180) / Math.PI);
  // Bottom edge angle vs +X (0 rad)
  const botDeg = Math.abs((Math.atan2(px[2].y - px[3].y, px[2].x - px[3].x) * 180) / Math.PI);
  // Left edge angle vs +Y (90 deg)
  const leftDeg = Math.abs(
    ((Math.atan2(px[3].y - px[0].y, px[3].x - px[0].x) - Math.PI / 2) * 180) / Math.PI
  );
  // Right edge angle vs +Y (90 deg)
  const rightDeg = Math.abs(
    ((Math.atan2(px[2].y - px[1].y, px[2].x - px[1].x) - Math.PI / 2) * 180) / Math.PI
  );

  const avg = (topDeg + botDeg + leftDeg + rightDeg) / 4;
  return Number.isFinite(avg) ? Math.min(89.9, Math.max(0, avg)) : 0;
}

const ASPECT_RATIOS: Record<Exclude<AspectPreset, 'auto'>, number> = {
  a4_portrait: 210 / 297,
  a4_landscape: 297 / 210,
  letter: 8.5 / 11,
  receipt: 1 / 2.2,
  slide_16_9: 16 / 9,
  square: 1,
};

/**
 * Calculates pixel-accurate output dimensions from normalized [0..1] quad points
 * and optional physical paper aspect preset.
 */
export function calculateDimensionsFromNormalized(
  normPts: Quad,
  imgWidth: number,
  imgHeight: number,
  preset: AspectPreset = 'auto'
): DimensionResult {
  if (imgWidth < 2 || imgHeight < 2) {
    return { w: 0, h: 0, src: null, isValid: false, reason: 'Invalid image dimensions' };
  }

  const srcPts: Quad = [
    { x: normPts[0].x * imgWidth, y: normPts[0].y * imgHeight },
    { x: normPts[1].x * imgWidth, y: normPts[1].y * imgHeight },
    { x: normPts[2].x * imgWidth, y: normPts[2].y * imgHeight },
    { x: normPts[3].x * imgWidth, y: normPts[3].y * imgHeight },
  ];

  if (!isValidQuad(srcPts)) {
    return {
      w: 0,
      h: 0,
      src: null,
      isValid: false,
      reason: 'Corners cross or form a concave shape. Click Untangle or adjust a corner.',
    };
  }

  const topW = dist(srcPts[0], srcPts[1]);
  const bottomW = dist(srcPts[3], srcPts[2]);
  const leftH = dist(srcPts[0], srcPts[3]);
  const rightH = dist(srcPts[1], srcPts[2]);

  let w = Math.max(topW, bottomW);
  let h = Math.max(leftH, rightH);

  // Perspective foreshortening compensation for 'auto':
  // When one pair of opposite edges converges strongly, boost the foreshortened axis slightly
  if (preset === 'auto') {
    const horizConvergence = Math.max(topW, bottomW) / Math.max(1, Math.min(topW, bottomW));
    const vertConvergence = Math.max(leftH, rightH) / Math.max(1, Math.min(leftH, rightH));
    if (horizConvergence > 1.08) {
      h *= Math.min(1.22, Math.sqrt(horizConvergence));
    }
    if (vertConvergence > 1.08) {
      w *= Math.min(1.22, Math.sqrt(vertConvergence));
    }
  } else {
    const targetRatio = ASPECT_RATIOS[preset];
    const maxLongSide = Math.max(w, h);
    if (targetRatio >= 1) {
      w = maxLongSide;
      h = maxLongSide / targetRatio;
    } else {
      h = maxLongSide;
      w = maxLongSide * targetRatio;
    }
  }

  // Cap smoothly to MAX_OUTPUT_DIMENSION & MAX_OUTPUT_PIXELS while preserving exact aspect ratio
  let roundW = Math.max(2, Math.round(w));
  let roundH = Math.max(2, Math.round(h));

  const aspect = Math.max(roundW, roundH) / Math.min(roundW, roundH);
  if (aspect > PERSPECTIVE_LIMITS.MAX_ASPECT_RATIO) {
    return {
      w: 0,
      h: 0,
      src: null,
      isValid: false,
      reason: `Selection is too narrow (max ${PERSPECTIVE_LIMITS.MAX_ASPECT_RATIO}:1 aspect ratio).`,
    };
  }

  const dimScale = Math.min(
    1,
    PERSPECTIVE_LIMITS.MAX_OUTPUT_DIMENSION / roundW,
    PERSPECTIVE_LIMITS.MAX_OUTPUT_DIMENSION / roundH,
    Math.sqrt(PERSPECTIVE_LIMITS.MAX_OUTPUT_PIXELS / (roundW * roundH))
  );

  if (dimScale < 1) {
    roundW = Math.max(2, Math.round(roundW * dimScale));
    roundH = Math.max(2, Math.round(roundH * dimScale));
  }

  return {
    w: roundW,
    h: roundH,
    src: srcPts,
    isValid: true,
  };
}

export function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let c = 0; c < n; c++) {
    let maxRow = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(aug[r][c]) > Math.abs(aug[maxRow][c])) {
        maxRow = r;
      }
    }

    const tmp = aug[c];
    aug[c] = aug[maxRow];
    aug[maxRow] = tmp;

    if (Math.abs(aug[c][c]) < 1e-10) {
      return null;
    }

    for (let r = c + 1; r < n; r++) {
      const factor = aug[r][c] / aug[c][c];
      for (let k = c; k <= n; k++) {
        aug[r][k] -= factor * aug[c][k];
      }
    }
  }

  const x = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = sum / aug[i][i];
    if (!isValidNumber(x[i])) {
      return null;
    }
  }

  return x;
}

/**
 * Computes 3x3 homography matrix mapping `src` -> `dst` (returned as 9-element row-major array).
 */
export function computeHomography(src: readonly Point[], dst: readonly Point[]): number[] | null {
  if (src.length !== 4 || dst.length !== 4) return null;

  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dx, dy);
  }

  const h = solveLinearSystem(A, b);
  return h ? [...h, 1] : null;
}

export interface RawPixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Pure bilinear perspective warp with edge clamping (eliminates 1px right/bottom seam bug).
 */
export function warpPerspectiveBuffer(
  source: RawPixelBuffer,
  srcCorners: Quad,
  destWidth: number,
  destHeight: number
): RawPixelBuffer | null {
  const sw = source.width;
  const sh = source.height;
  const sd = source.data;

  if (sw < 2 || sh < 2 || destWidth < 2 || destHeight < 2) {
    return null;
  }

  const dstRect: Quad = [
    { x: 0, y: 0 },
    { x: destWidth - 1, y: 0 },
    { x: destWidth - 1, y: destHeight - 1 },
    { x: 0, y: destHeight - 1 },
  ];

  // Map destination pixel (x, y) back to source image (sx, sy)
  const H = computeHomography(dstRect, srcCorners);
  if (!H) return null;

  const dd = new Uint8ClampedArray(destWidth * destHeight * 4);
  const maxX = sw - 1.0001;
  const maxY = sh - 1.0001;

  const h0 = H[0], h1 = H[1], h2 = H[2];
  const h3 = H[3], h4 = H[4], h5 = H[5];
  const h6 = H[6], h7 = H[7], h8 = H[8];

  for (let y = 0; y < destHeight; y++) {
    const wyBase = h7 * y + h8;
    const sxBase = h1 * y + h2;
    const syBase = h4 * y + h5;
    const rowOffset = y * destWidth * 4;

    for (let x = 0; x < destWidth; x++) {
      const w = h6 * x + wyBase;
      if (w === 0 || !Number.isFinite(w)) {
        return null;
      }

      let sx = (h0 * x + sxBase) / w;
      let sy = (h3 * x + syBase) / w;

      // Clamp to valid image domain so corner/border pixels never turn transparent
      sx = sx < 0 ? 0 : sx > maxX ? maxX : sx;
      sy = sy < 0 ? 0 : sy > maxY ? maxY : sy;

      const x0 = sx | 0;
      const y0 = sy | 0;
      const dx = sx - x0;
      const dy = sy - y0;
      const dx1 = 1 - dx;
      const dy1 = 1 - dy;

      const i0 = (y0 * sw + x0) * 4;
      const i1 = i0 + 4;
      const i2 = i0 + sw * 4;
      const i3 = i2 + 4;

      const w0 = dx1 * dy1;
      const w1 = dx * dy1;
      const w2 = dx1 * dy;
      const w3 = dx * dy;

      const di = rowOffset + x * 4;
      dd[di] = (w0 * sd[i0] + w1 * sd[i1] + w2 * sd[i2] + w3 * sd[i3] + 0.5) | 0;
      dd[di + 1] = (w0 * sd[i0 + 1] + w1 * sd[i1 + 1] + w2 * sd[i2 + 1] + w3 * sd[i3 + 1] + 0.5) | 0;
      dd[di + 2] = (w0 * sd[i0 + 2] + w1 * sd[i1 + 2] + w2 * sd[i2 + 2] + w3 * sd[i3 + 2] + 0.5) | 0;
      dd[di + 3] = 255;
    }
  }

  return { width: destWidth, height: destHeight, data: dd };
}

/**
 * Applies real document/scanner post-processing filters to a warped buffer.
 * - 'original': untouched true color
 * - 'document': adaptive local background illumination division (removes shadows, whitens paper, keeps colored ink)
 * - 'bw': clean adaptive high-contrast black-on-white ink scan
 * - 'whiteboard': glare suppression + crisp marker saturation boost
 */
export function applyScanFilterBuffer(buf: RawPixelBuffer, filter: ScanFilter): RawPixelBuffer {
  if (filter === 'original') {
    return buf;
  }

  const { width, height, data } = buf;
  const out = new Uint8ClampedArray(data.length);
  const pixelCount = width * height;

  // Compute integral luminance table for fast O(1) local background estimation
  const lum = new Uint8Array(pixelCount);
  const integral = new Float64Array((width + 1) * (height + 1));
  const stride = width + 1;

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const p = idx * 4;
      const l = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
      lum[idx] = l;
      rowSum += l;
      integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum;
    }
  }

  const radius = Math.max(12, Math.round(Math.min(width, height) / 18));

  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);

      const sum =
        integral[(y1 + 1) * stride + (x1 + 1)] -
        integral[y0 * stride + (x1 + 1)] -
        integral[(y1 + 1) * stride + x0] +
        integral[y0 * stride + x0];

      const localMean = Math.max(35, sum / area);
      const idx = y * width + x;
      const p = idx * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const l = lum[idx];

      if (filter === 'bw') {
        // Adaptive Sauvola-inspired clean ink threshold with soft anti-aliased transition
        const ratio = l / localMean;
        let v: number;
        if (ratio > 0.91) {
          v = 255;
        } else if (ratio < 0.74) {
          v = 18;
        } else {
          const t = (ratio - 0.74) / (0.91 - 0.74);
          v = Math.round(18 + t * (255 - 18));
        }
        out[p] = v;
        out[p + 1] = v;
        out[p + 2] = v;
        out[p + 3] = 255;
      } else if (filter === 'document') {
        // Divide by local illumination envelope so uneven desk lighting becomes crisp white paper
        const gain = 250 / Math.max(localMean, l * 0.95, 45);
        let nr = Math.min(255, r * gain);
        let ng = Math.min(255, g * gain);
        let nb = Math.min(255, b * gain);

        // Gently snap near-white paper grain to pure clean white
        const nl = (nr * 0.299 + ng * 0.587 + nb * 0.114);
        if (nl > 228) {
          const boost = (nl - 228) / 27;
          nr = nr + (255 - nr) * boost;
          ng = ng + (255 - ng) * boost;
          nb = nb + (255 - nb) * boost;
        } else {
          // Deepen ink contrast
          nr = clamp((nr - 128) * 1.18 + 124, 0, 255);
          ng = clamp((ng - 128) * 1.18 + 124, 0, 255);
          nb = clamp((nb - 128) * 1.18 + 124, 0, 255);
        }

        out[p] = nr | 0;
        out[p + 1] = ng | 0;
        out[p + 2] = nb | 0;
        out[p + 3] = 255;
      } else {
        // Whiteboard boost: clean board background + saturated marker strokes
        const gain = 252 / Math.max(localMean, l, 60);
        let nr = Math.min(255, r * gain);
        let ng = Math.min(255, g * gain);
        let nb = Math.min(255, b * gain);

        const avg = (nr + ng + nb) / 3;
        if (avg > 222 && Math.max(nr, ng, nb) - Math.min(nr, ng, nb) < 26) {
          nr = 254;
          ng = 255;
          nb = 254;
        } else {
          // Boost marker chroma
          nr = clamp(avg + (nr - avg) * 1.45, 0, 255);
          ng = clamp(avg + (ng - avg) * 1.45, 0, 255);
          nb = clamp(avg + (nb - avg) * 1.45, 0, 255);
        }

        out[p] = nr | 0;
        out[p + 1] = ng | 0;
        out[p + 2] = nb | 0;
        out[p + 3] = 255;
      }
    }
  }

  return { width, height, data: out };
}

/**
 * Automatic document / board corner detection in normalized [0..1] coordinates.
 * Combines border-contrasted foreground segmentation with directional extreme-corner projection
 * so bright receipts, contracts, whiteboards, and framed posters snap accurately to their 4 corners!
 */
export function autoDetectDocumentCorners(buf: RawPixelBuffer): Quad {
  const { width, height, data } = buf;
  if (width < 16 || height < 16) {
    return getDefaultNormalizedCorners(0.1);
  }

  // Downsample to ~180px grid for fast, noise-resistant analysis
  const stepX = Math.max(1, Math.floor(width / 180));
  const stepY = Math.max(1, Math.floor(height / 180));
  const gw = Math.floor(width / stepX);
  const gh = Math.floor(height / stepY);

  const lums = new Float32Array(gw * gh);
  const sat = new Float32Array(gw * gh);

  for (let gy = 0; gy < gh; gy++) {
    const sy = Math.min(height - 1, gy * stepY);
    for (let gx = 0; gx < gw; gx++) {
      const sx = Math.min(width - 1, gx * stepX);
      const p = (sy * width + sx) * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      lums[gy * gw + gx] = r * 0.299 + g * 0.587 + b * 0.114;
      sat[gy * gw + gx] = Math.max(r, g, b) - Math.min(r, g, b);
    }
  }

  // Sample outer 6% perimeter to model desk/wall background luminance
  let borderSum = 0;
  let borderCount = 0;
  const bandX = Math.max(1, Math.round(gw * 0.06));
  const bandY = Math.max(1, Math.round(gh * 0.06));

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (gx < bandX || gx >= gw - bandX || gy < bandY || gy >= gh - bandY) {
        borderSum += lums[gy * gw + gx];
        borderCount++;
      }
    }
  }
  const borderMean = borderCount > 0 ? borderSum / borderCount : 100;

  // Sample inner center 40% to model document/subject luminance
  let centerSum = 0;
  let centerCount = 0;
  for (let gy = Math.floor(gh * 0.3); gy < Math.ceil(gh * 0.7); gy++) {
    for (let gx = Math.floor(gw * 0.3); gx < Math.ceil(gw * 0.7); gx++) {
      centerSum += lums[gy * gw + gx];
      centerCount++;
    }
  }
  const centerMean = centerCount > 0 ? centerSum / centerCount : 200;
  const contrastDelta = Math.abs(centerMean - borderMean);

  const candidates: Point[] = [];

  if (contrastDelta >= 22) {
    // Clear tonal separation between document/board and surrounding surface
    const midThreshold = borderMean + (centerMean - borderMean) * 0.46;
    const brighterSubject = centerMean > borderMean;

    for (let gy = 2; gy < gh - 2; gy++) {
      for (let gx = 2; gx < gw - 2; gx++) {
        const val = lums[gy * gw + gx];
        const isSubject = brighterSubject ? val >= midThreshold : val <= midThreshold;
        if (!isSubject) continue;

        // Keep boundary pixels of the subject mask for crisp corner extrema
        const n1 = lums[(gy - 1) * gw + gx];
        const n2 = lums[(gy + 1) * gw + gx];
        const n3 = lums[gy * gw + (gx - 1)];
        const n4 = lums[gy * gw + (gx + 1)];
        const neighborOut = brighterSubject
          ? n1 < midThreshold || n2 < midThreshold || n3 < midThreshold || n4 < midThreshold
          : n1 > midThreshold || n2 > midThreshold || n3 > midThreshold || n4 > midThreshold;

        if (neighborOut) {
          candidates.push({ x: (gx + 0.5) / gw, y: (gy + 0.5) / gh });
        }
      }
    }
  }

  // Fallback to strong Sobel edge magnitude points if background/foreground luminance are close
  if (candidates.length < 24) {
    const grads: { x: number; y: number; mag: number }[] = [];
    let maxMag = 0;
    for (let gy = 3; gy < gh - 3; gy++) {
      for (let gx = 3; gx < gw - 3; gx++) {
        const tl = lums[(gy - 1) * gw + (gx - 1)];
        const tc = lums[(gy - 1) * gw + gx];
        const tr = lums[(gy - 1) * gw + (gx + 1)];
        const ml = lums[gy * gw + (gx - 1)];
        const mr = lums[gy * gw + (gx + 1)];
        const bl = lums[(gy + 1) * gw + (gx - 1)];
        const bc = lums[(gy + 1) * gw + gx];
        const br = lums[(gy + 1) * gw + (gx + 1)];

        const gxVal = -tl + tr - 2 * ml + 2 * mr - bl + br;
        const gyVal = -tl - 2 * tc - tr + bl + 2 * bc + br;
        const mag = Math.sqrt(gxVal * gxVal + gyVal * gyVal) + sat[gy * gw + gx] * 0.4;
        if (mag > maxMag) maxMag = mag;
        grads.push({ x: (gx + 0.5) / gw, y: (gy + 0.5) / gh, mag });
      }
    }

    const edgeCutoff = maxMag * 0.38;
    for (let i = 0; i < grads.length; i++) {
      if (grads[i].mag >= edgeCutoff) {
        candidates.push({ x: grads[i].x, y: grads[i].y });
      }
    }
  }

  if (candidates.length < 12) {
    return getDefaultNormalizedCorners(0.08);
  }

  // Find extreme corners along diagonal projections (-x-y, +x-y, +x+y, -x+y)
  let tl = candidates[0];
  let tr = candidates[0];
  let br = candidates[0];
  let bl = candidates[0];

  let scoreTL = -Infinity;
  let scoreTR = -Infinity;
  let scoreBR = -Infinity;
  let scoreBL = -Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    const sTL = -p.x - p.y;
    const sTR = p.x - p.y;
    const sBR = p.x + p.y;
    const sBL = -p.x + p.y;

    if (sTL > scoreTL) {
      scoreTL = sTL;
      tl = p;
    }
    if (sTR > scoreTR) {
      scoreTR = sTR;
      tr = p;
    }
    if (sBR > scoreBR) {
      scoreBR = sBR;
      br = p;
    }
    if (sBL > scoreBL) {
      scoreBL = sBL;
      bl = p;
    }
  }

  const ordered = orderQuadCorners([tl, tr, br, bl]).map((p) => ({
    x: clamp(p.x, 0.02, 0.98),
    y: clamp(p.y, 0.02, 0.98),
  })) as Quad;

  const check = calculateDimensionsFromNormalized(ordered, width, height, 'auto');
  if (!check.isValid) {
    return getDefaultNormalizedCorners(0.08);
  }

  return ordered;
}
