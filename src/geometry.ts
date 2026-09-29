import type { Part } from './data/parts';

export interface Placed {
  uid: number;
  part: Part;
  /** 土台に対する中心位置(0..1) */
  x: number;
  y: number;
  /** 度(時計回りが正) */
  rot: number;
}

const alphaCache = new Map<string, { data: Uint8ClampedArray; w: number; h: number }>();
const ALPHA_W = 48;

function alphaMap(img: HTMLImageElement) {
  const key = img.currentSrc || img.src;
  let m = alphaCache.get(key);
  if (m) return m;
  const w = ALPHA_W;
  const h = Math.max(1, Math.round(ALPHA_W * (img.naturalHeight / Math.max(1, img.naturalWidth))));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  m = { data: ctx.getImageData(0, 0, w, h).data, w, h };
  alphaCache.set(key, m);
  return m;
}

/**
 * 点(px 単位・土台左上が原点)が、貼ったパーツ上にあるか。
 * 幼児の指先の大きさを考えて、1セル分の余裕(近傍)を許す。
 */
export function hitPlaced(p: Placed, img: HTMLImageElement | null, px: number, py: number, stagePx: number): boolean {
  const w = p.part.widthFraction * stagePx;
  const h = w * p.part.aspect;
  const cx = p.x * stagePx;
  const cy = p.y * stagePx;
  const a = (-p.rot * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  const u = dx * Math.cos(a) - dy * Math.sin(a);
  const v = dx * Math.sin(a) + dy * Math.cos(a);
  const margin = 6;
  if (Math.abs(u) > w / 2 + margin || Math.abs(v) > h / 2 + margin) return false;
  if (!img || !img.complete || img.naturalWidth === 0) return true;
  const m = alphaMap(img);
  const ix = Math.floor(((u + w / 2) / w) * m.w);
  const iy = Math.floor(((v + h / 2) / h) * m.h);
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const x = ix + ox;
      const y = iy + oy;
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
      if (m.data[(y * m.w + x) * 4 + 3] > 40) return true;
    }
  }
  return false;
}
