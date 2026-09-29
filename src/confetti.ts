/** 「できた！」の紙吹雪(全面 canvas)。 */
const COLORS = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#ff9ff3', '#ff9f43'];

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
}

export function burstConfetti(canvas: HTMLCanvasElement, ms = 2600): Promise<void> {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve();
  ctx.scale(dpr, dpr);
  const ps: P[] = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.45,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 15 - 4,
    w: 8 + Math.random() * 8,
    h: 5 + Math.random() * 7,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  const start = performance.now();
  return new Promise((resolve) => {
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += 0.35;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, (ms - t) / 600));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < ms) requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, W, H);
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}
