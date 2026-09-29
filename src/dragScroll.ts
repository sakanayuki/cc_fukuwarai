/**
 * トレイの「ひとふり」で大きく進むドラッグスクロール(慣性つき)。
 * ネイティブのスクロールより移動量を増やし、幼児の短いスワイプでも遠くまで進めるようにする。
 * 横並び(flex-wrap: nowrap)なら横方向、折り返し(wrap)なら縦方向にスクロールする。
 */
export function enableDragScroll(el: HTMLElement, gain = 2.6) {
  const TAP_SLOP = 8;
  let down = false;
  let moved = false;
  let startPos = 0;
  let startScroll = 0;
  let lastPos = 0;
  let lastT = 0;
  let velocity = 0; // px/ms(スクロール量)
  let raf = 0;
  let suppressClick = false;

  const vertical = () => getComputedStyle(el).flexWrap !== 'nowrap';
  const pos = (e: PointerEvent) => (vertical() ? e.clientY : e.clientX);
  const getScroll = () => (vertical() ? el.scrollTop : el.scrollLeft);
  const setScroll = (v: number) => {
    if (vertical()) el.scrollTop = v;
    else el.scrollLeft = v;
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelAnimationFrame(raf);
    down = true;
    moved = false;
    startPos = lastPos = pos(e);
    startScroll = getScroll();
    lastT = e.timeStamp;
    velocity = 0;
  });

  el.addEventListener('pointermove', (e) => {
    if (!down) return;
    const p = pos(e);
    if (!moved && Math.abs(p - startPos) > TAP_SLOP) {
      moved = true;
      el.setPointerCapture(e.pointerId);
    }
    if (!moved) return;
    setScroll(startScroll - (p - startPos) * gain);
    const dt = Math.max(1, e.timeStamp - lastT);
    // 直近の速度をなめらかに更新
    velocity = velocity * 0.6 + (-(p - lastPos) * gain / dt) * 0.4;
    lastPos = p;
    lastT = e.timeStamp;
  });

  const end = (e: PointerEvent) => {
    if (!down) return;
    down = false;
    if (!moved) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 60);
    // 止まってから離した場合は慣性なし
    if (e.timeStamp - lastT > 80) return;
    let v = velocity * 1.4;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(32, now - prev);
      prev = now;
      const before = getScroll();
      setScroll(before + v * dt);
      v *= Math.pow(0.94, dt / 16);
      if (Math.abs(v) > 0.03 && getScroll() !== before) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  el.addEventListener(
    'click',
    (e) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );
}
