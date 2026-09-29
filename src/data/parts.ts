import generated from './parts.generated.json';
import { CATEGORIES, SHEET_WIDTH, type CategoryId } from './config';

export interface Part {
  /** 例: eye-005 */
  id: string;
  category: CategoryId;
  /** 画像URL */
  src: string;
  /** 画像の縦横比(h / w) */
  aspect: number;
  /** 土台の幅に対する、貼ったときの幅の割合(0..1) */
  widthFraction: number;
}

type Meta = { file: string; w: number; h: number; srcW: number; srcH: number };

export function partUrl(category: CategoryId, file: string): string {
  return `${import.meta.env.BASE_URL}parts/${category}/${file}`;
}

export function buildParts(meta: Record<string, Meta[]> = generated as Record<string, Meta[]>): Part[] {
  const parts: Part[] = [];
  for (const cat of CATEGORIES) {
    for (const m of meta[cat.id] ?? []) {
      parts.push({
        id: m.file.replace(/\.webp$/, ''),
        category: cat.id,
        src: partUrl(cat.id, m.file),
        aspect: m.h / m.w,
        widthFraction: (m.srcW / SHEET_WIDTH) * cat.scale,
      });
    }
  }
  return parts;
}

export const PARTS: Part[] = buildParts();
export const PARTS_BY_ID = new Map(PARTS.map((p) => [p.id, p]));
export const PARTS_BY_CATEGORY = (id: CategoryId) => PARTS.filter((p) => p.category === id);
