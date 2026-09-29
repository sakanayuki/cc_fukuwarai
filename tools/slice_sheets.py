"""シールシート画像を1パーツずつ透過PNGに切り出す。

使い方: python tools/slice_sheets.py [素材フォルダ]   (省略時は tools/source)
  素材フォルダに 1-mouth.jpg 2-brow.jpg 3-eye.jpg 4-nose.jpg がある想定。
依存: pip install pillow numpy scipy
出力: public/parts/<category>/<category>-NNN.webp と src/data/parts.generated.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "parts"

# category: (file, min_area, merge_gap, fill_holes, max_aspect, threshold, hull)
#   merge_gap : 近い断片を同じパーツとしてまとめる距離(px)
#   hull      : 淡い柄でも欠けないよう、輪郭を凸包で作る(鼻用)
SHEETS = {
    "mouth": ("1-mouth.jpg", 900, 6, True, None, 22, False),
    "brow": ("2-brow.jpg", 500, 9, False, None, 40, False),
    "eye": ("3-eye.jpg", 900, 4, True, 3.5, 22, False),  # 細い弧(アニメ目の眉の残骸)は除外
    "nose": ("4-nose.jpg", 1500, 10, True, None, 22, True),
}
OUTLINE = 5  # シールの縁の太さ(px)
TARGET_LONG_EDGE = 360  # 出力の長辺上限


def estimate_bg(arr: np.ndarray) -> np.ndarray:
    """台紙の色を、低解像度の中央値フィルタで場所ごとに推定する。"""
    small = np.array(
        Image.fromarray(arr).resize((arr.shape[1] // 8, arr.shape[0] // 8), Image.BILINEAR)
    ).astype(np.float32)
    bg = np.stack([ndi.percentile_filter(small[..., c], 60, size=41) for c in range(3)], -1)
    return np.array(
        Image.fromarray(bg.astype(np.uint8)).resize((arr.shape[1], arr.shape[0]), Image.BILINEAR)
    ).astype(np.float32)


def convex_hull(m: np.ndarray) -> np.ndarray:
    from PIL import ImageDraw
    from scipy.spatial import ConvexHull

    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1)
    hull = ConvexHull(pts)
    poly = [tuple(pts[v]) for v in hull.vertices]
    img = Image.new("L", (m.shape[1], m.shape[0]), 0)
    ImageDraw.Draw(img).polygon(poly, fill=255)
    return np.array(img) > 0


def slice_sheet(name: str, spec, src_dir: Path):
    fname, min_area, gap, fill_holes, max_aspect, thresh, hull = spec
    im = Image.open(src_dir / fname).convert("RGB")
    arr = np.array(im)
    bg = estimate_bg(arr)
    diff = np.abs(arr.astype(np.float32) - bg).max(-1)
    fg = diff > 22
    if thresh > 22:
        # 高い閾値で本体だけ取り、低い閾値の結果は本体の近傍だけ採用(縁のかけら除去)
        core = ndi.binary_opening(diff > thresh, iterations=1)
        fg &= ndi.binary_dilation(core, iterations=5)
    fg = ndi.binary_opening(fg, iterations=2 if hull else 1)
    # パーツ内の細かい隙間をつなぐ
    joined = ndi.binary_closing(fg, structure=np.ones((3, 3)), iterations=gap)
    if fill_holes:
        joined = ndi.binary_fill_holes(joined)
    lab, n = ndi.label(joined)
    objs = ndi.find_objects(lab)
    items = []
    for i, sl in enumerate(objs, start=1):
        group = lab == i
        mask = group & fg if not hull else group
        area = mask.sum()
        if area < min_area:
            continue
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if max_aspect and max(w / h, h / w) > max_aspect:
            continue
        items.append((sl, mask, group))
    # 読み順(行→列)に並べる
    items.sort(key=lambda t: (round((t[0][0].start + t[0][0].stop) / 2 / 80), t[0][1].start))
    out_dir = OUT / name
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.webp"):
        f.unlink()
    meta = []
    for idx, (sl, mask, group) in enumerate(items, start=1):
        pad = OUTLINE + 4
        y0, y1 = max(sl[0].start - pad, 0), min(sl[0].stop + pad, arr.shape[0])
        x0, x1 = max(sl[1].start - pad, 0), min(sl[1].stop + pad, arr.shape[1])
        m = mask[y0:y1, x0:x1]
        if hull:
            core = fg[y0:y1, x0:x1] & group[y0:y1, x0:x1]
            if core.sum() < min_area // 2:
                continue
            m = convex_hull(core)
        else:
            m = ndi.binary_closing(m, iterations=2)
            if fill_holes:
                m = ndi.binary_fill_holes(m)
        alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        # シールの縁: 白をぐるっと足す
        outer = ndi.binary_dilation(m, structure=np.ones((3, 3)), iterations=OUTLINE)
        outer_a = Image.fromarray((outer * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
        rgb = Image.fromarray(arr[y0:y1, x0:x1])
        white = Image.new("RGBA", rgb.size, (255, 255, 255, 255))
        white.putalpha(outer_a)
        art = rgb.convert("RGBA")
        art.putalpha(alpha)
        comp = Image.alpha_composite(white, art)
        # 出力サイズを揃える
        w, h = comp.size
        scale = min(1.0, TARGET_LONG_EDGE / max(w, h))
        if scale < 1.0:
            comp = comp.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
        file = f"{name}-{idx:03d}.webp"
        comp.save(out_dir / file, quality=86, method=6)
        meta.append({"file": file, "w": comp.size[0], "h": comp.size[1], "srcW": w, "srcH": h})
    return meta


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tools" / "source"
    result = {}
    for name, spec in SHEETS.items():
        result[name] = slice_sheet(name, spec, src)
        print(name, len(result[name]))
    (ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "data" / "parts.generated.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
