/** インライン SVG アイコン(文字が読めなくても分かる絵) */
const s = (body: string, extra = '') =>
  `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" ${extra}>${body}</svg>`;

export const ICON = {
  back: s('<path d="M30 8 14 24l16 16" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'),
  soundOn: s(
    '<path d="M6 18h8l10-8v28l-10-8H6z" fill="currentColor"/><path d="M31 17c3 4 3 10 0 14M37 12c6 7 6 17 0 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  ),
  soundOff: s(
    '<path d="M6 18h8l10-8v28l-10-8H6z" fill="currentColor"/><path d="M32 18l12 12M44 18 32 30" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  ),
  close: s('<path d="M12 12l24 24M36 12 12 36" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>'),
  star: s(
    '<path d="M24 4l6.2 12.9 14 1.9-10.2 9.8 2.6 14L24 35.7 11.4 42.6l2.6-14L3.8 18.8l14-1.9z" fill="currentColor"/>',
  ),
  save: s(
    '<path d="M24 6v22M14 19l10 10 10-10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 34v6h32v-6" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  again: s(
    '<path d="M38 24a14 14 0 1 1-4.5-10.3" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M36 5v10H26" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  play: s('<path d="M14 8l26 16-26 16z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>'),
  hand: s(
    '<path d="M18 26V10a3 3 0 0 1 6 0v14m0-3v-8a3 3 0 0 1 6 0v9m0-2a3 3 0 0 1 6 0v10c0 8-5 14-13 14-6 0-9-3-13-9l-4-7a3 3 0 0 1 5-3l4 5" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
  yes: s('<path d="M8 25l11 11L40 12" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'),
};
