import type { Placed } from './geometry';

const SIZE = 1024;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 土台の写真にパーツを重ねた完成画像(PNG)を作る */
export async function composePng(baseSrc: string, placed: Placed[]): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const base = await load(baseSrc);
  // 土台は正方形の想定だが、念のため cover で描く
  const s = Math.max(SIZE / base.naturalWidth, SIZE / base.naturalHeight);
  const bw = base.naturalWidth * s;
  const bh = base.naturalHeight * s;
  ctx.drawImage(base, (SIZE - bw) / 2, (SIZE - bh) / 2, bw, bh);
  for (const p of placed) {
    const img = await load(p.part.src);
    const w = p.part.widthFraction * SIZE;
    const h = w * p.part.aspect;
    ctx.save();
    ctx.translate(p.x * SIZE, p.y * SIZE);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
