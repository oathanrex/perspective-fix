import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyScanFilterBuffer,
  autoDetectDocumentCorners,
  calculateDimensionsFromNormalized,
  computeHomography,
  computeSkewAngleDegrees,
  getDefaultNormalizedCorners,
  isValidQuad,
  orderQuadCorners,
  rotateNormalizedCorners90CW,
  warpPerspectiveBuffer,
  type Quad,
  type RawPixelBuffer,
} from './perspective';
import {
  loadRecentScans,
  saveRecentScan,
  clearRecentScans,
  type RecentScanItem,
} from './history';

test('isValidQuad accepts convex clockwise quads and rejects crossed/collinear quads', () => {
  const valid: Quad = [
    { x: 20, y: 20 },
    { x: 200, y: 30 },
    { x: 210, y: 180 },
    { x: 15, y: 190 },
  ];
  assert.equal(isValidQuad(valid), true);

  // Self-intersecting bowtie quad
  const crossed: Quad = [
    { x: 20, y: 20 },
    { x: 210, y: 180 },
    { x: 200, y: 30 },
    { x: 15, y: 190 },
  ];
  assert.equal(isValidQuad(crossed), false);

  // Untangling fixes crossed corners into a valid clockwise quad
  const untangled = orderQuadCorners(crossed);
  assert.equal(isValidQuad(untangled), true);
});

test('computeHomography maps identity and scaled rectangles accurately', () => {
  const src: Quad = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ];
  const dst: Quad = [
    { x: 10, y: 20 },
    { x: 210, y: 20 },
    { x: 210, y: 120 },
    { x: 10, y: 120 },
  ];

  const H = computeHomography(src, dst);
  assert.ok(H !== null);
  assert.equal(H.length, 9);

  // Verify corner (100, 50) maps to (210, 120)
  const w = H[6] * 100 + H[7] * 50 + H[8];
  const mx = (H[0] * 100 + H[1] * 50 + H[2]) / w;
  const my = (H[3] * 100 + H[4] * 50 + H[5]) / w;
  assert.ok(Math.abs(mx - 210) < 1e-6);
  assert.ok(Math.abs(my - 120) < 1e-6);
});

test('warpPerspectiveBuffer produces full-bleed opaque pixels with zero transparent border seam', () => {
  const sw = 40;
  const sh = 40;
  const data = new Uint8ClampedArray(sw * sh * 4);
  for (let i = 0; i < sw * sh; i++) {
    data[i * 4] = 40;
    data[i * 4 + 1] = 160;
    data[i * 4 + 2] = 110;
    data[i * 4 + 3] = 255;
  }

  const src: RawPixelBuffer = { width: sw, height: sh, data };
  const corners: Quad = [
    { x: 4, y: 4 },
    { x: 35, y: 6 },
    { x: 36, y: 35 },
    { x: 5, y: 34 },
  ];

  const warped = warpPerspectiveBuffer(src, corners, 30, 30);
  assert.ok(warped !== null);
  assert.equal(warped.width, 30);
  assert.equal(warped.height, 30);

  // Check bottom-right corner pixel (29, 29) is completely opaque green (fixes original off-by-one bug)
  const lastIdx = (29 * 30 + 29) * 4;
  assert.equal(warped.data[lastIdx], 40);
  assert.equal(warped.data[lastIdx + 1], 160);
  assert.equal(warped.data[lastIdx + 2], 110);
  assert.equal(warped.data[lastIdx + 3], 255);
});

test('calculateDimensionsFromNormalized respects A4 preset and 90-degree CW rotation', () => {
  const def = getDefaultNormalizedCorners(0.1);
  const res = calculateDimensionsFromNormalized(def, 1000, 1400, 'a4_portrait');
  assert.equal(res.isValid, true);
  const ratio = res.w / res.h;
  assert.ok(Math.abs(ratio - 210 / 297) < 0.01);

  const rotated = rotateNormalizedCorners90CW(def);
  const resRot = calculateDimensionsFromNormalized(rotated, 1400, 1000, 'auto');
  assert.equal(resRot.isValid, true);

  assert.equal(computeSkewAngleDegrees(def, 1000, 1000), 0);
});

test('autoDetectDocumentCorners snaps accurately onto bright skewed quad on dark desk', () => {
  const w = 200;
  const h = 160;
  const data = new Uint8ClampedArray(w * h * 4);

  // Dark desk background
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const insidePaper = x >= 40 && x <= 160 && y >= 28 && y <= 132;
      const v = insidePaper ? 242 : 28;
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }

  const detected = autoDetectDocumentCorners({ width: w, height: h, data });
  assert.ok(Math.abs(detected[0].x - 0.2) < 0.05);
  assert.ok(Math.abs(detected[0].y - 0.175) < 0.05);
  assert.ok(Math.abs(detected[2].x - 0.8) < 0.05);
  assert.ok(Math.abs(detected[2].y - 0.825) < 0.05);
});

test('applyScanFilterBuffer whitens shadowy paper while keeping dark ink dark', () => {
  const w = 32;
  const h = 32;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    // Dim greyish-tan paper (185) with dark ink stroke at center
    const isInk = i === (16 * w + 16);
    const val = isInk ? 25 : 185;
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }

  const filtered = applyScanFilterBuffer({ width: w, height: h, data }, 'document');
  const paperPixel = filtered.data[0];
  const inkPixel = filtered.data[(16 * w + 16) * 4];
  assert.ok(paperPixel >= 245, `Expected whitened paper >= 245, got ${paperPixel}`);
  assert.ok(inkPixel <= 50, `Expected preserved dark ink <= 50, got ${inkPixel}`);
});

test('saveRecentScan prepends new scan, deduplicates and enforces max history limit', () => {
  const dummyItem: RecentScanItem = {
    id: 'scan_1',
    fileName: 'receipt.png',
    timestamp: 1000,
    origWidth: 1200,
    origHeight: 900,
    outWidth: 600,
    outHeight: 1100,
    skewDegrees: 12.4,
    filter: 'document',
    preset: 'receipt',
    corners: getDefaultNormalizedCorners(0.1),
    thumbnailDataUrl: 'data:image/png;base64,AAA',
  };

  let list: RecentScanItem[] = [];
  list = saveRecentScan(list, dummyItem);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'scan_1');

  // Updating the same file moves it to the top
  const updatedItem: RecentScanItem = {
    ...dummyItem,
    id: 'scan_2',
    timestamp: 2000,
  };
  list = saveRecentScan(list, updatedItem);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'scan_2');
});
