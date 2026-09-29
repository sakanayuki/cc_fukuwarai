/** カテゴリ定義と、パーツの大きさ調整。動かしてみて大きさを変えたいときはここを編集する。 */
export type CategoryId = 'eye' | 'brow' | 'nose' | 'mouth';

export interface CategoryConfig {
  id: CategoryId;
  /** タブに出すアイコン(パーツ画像のファイル名) */
  icon: string;
  /** 土台に貼るときの倍率。1 = 元シートの実寸比(シート幅に対する割合をそのまま土台幅の割合にする) */
  scale: number;
  /** タブの色 */
  color: string;
}

/** 元のシール台紙(スキャン)の横幅(px)。パーツの実寸比の基準 */
export const SHEET_WIDTH = 1116;

export const CATEGORIES: CategoryConfig[] = [
  { id: 'eye', icon: 'eye-005.webp', scale: 1.35, color: '#7ec8f2' },
  { id: 'brow', icon: 'brow-001.webp', scale: 1.3, color: '#f5b26b' },
  { id: 'nose', icon: 'nose-021.webp', scale: 1.0, color: '#f19aa8' },
  { id: 'mouth', icon: 'mouth-016.webp', scale: 1.0, color: '#e86a6a' },
];

/**
 * true にすると、貼ったあとも同じパーツを持ったまま(続けて貼れる)。
 * false のときは、貼ると手が空く(すぐ別のパーツを選べ、貼ったものをタップで剥がせる)。
 */
export const KEEP_HOLDING_AFTER_PASTE = false;
