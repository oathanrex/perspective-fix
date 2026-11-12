import {
  type Quad,
  type RawPixelBuffer,
  type ScanFilter,
  applyScanFilterBuffer,
  warpPerspectiveBuffer,
} from './perspective';

export interface WarpJobRequest {
  source: RawPixelBuffer;
  srcCorners: Quad;
  destWidth: number;
  destHeight: number;
  filter: ScanFilter;
}

/**
 * Runs perspective warp + scanner enhancement filter cleanly.
 * Uses requestId sequencing in the caller so rapid corner dragging never suffers from race conditions
 * and works reliably on GitHub Pages, strict CSP headers, and Safari/iOS.
 */
export function runWarpJobSync(req: WarpJobRequest): RawPixelBuffer | null {
  const warped = warpPerspectiveBuffer(
    req.source,
    req.srcCorners,
    req.destWidth,
    req.destHeight
  );
  if (!warped) return null;
  return applyScanFilterBuffer(warped, req.filter);
}
