/**
 * 土台(顔を作る台)の一覧。
 * src/assets/bases/ に画像を置くだけで増える(ファイル名の順に並ぶ)。
 * 画像は 1:1(正方形)で用意すること。
 */
export interface Base {
  id: string;
  src: string;
}

const files = import.meta.glob('../assets/bases/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const BASES: Base[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({
    id: path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    src,
  }));
