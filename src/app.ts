import { BASES, type Base } from './data/bases';
import { CATEGORIES, KEEP_HOLDING_AFTER_PASTE, type CategoryId } from './data/config';
import { PARTS_BY_CATEGORY, partUrl, type Part } from './data/parts';
import { burstConfetti } from './confetti';
import { composePng } from './compose';
import { hitPlaced, type Placed } from './geometry';
import { Gyro } from './gyro';
import { ICON } from './icons';
import { Sound } from './audio';

const $ = <T extends HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;

export class App {
  private gyro = new Gyro();
  private sound = new Sound();

  private base: Base | null = null;
  private placed: Placed[] = [];
  private nextUid = 1;
  private held: Part | null = null;
  private category: CategoryId = 'eye';
  private resultUrl: string | null = null;

  // play 画面の要素
  private stage!: HTMLElement;
  private layer!: HTMLElement;
  private handSlot!: HTMLElement;
  private handImg!: HTMLImageElement;
  private strip!: HTMLElement;
  private els = new Map<number, HTMLImageElement>();

  constructor(private root: HTMLElement) {
    this.gyro.onChange((a) => this.applyAngle(a));
    this.showStart();
  }

  // ───────────── スタート ─────────────
  private showStart() {
    const logoParts = ['eye-069', 'eye-070'].map((id) => partUrl('eye', `${id}.webp`));
    this.root.innerHTML = `
      <section class="screen start">
        <div class="logo" aria-label="ふくわらい">
          <img class="logo-eye" src="${logoParts[0]}" alt="" draggable="false" />
          <img class="logo-eye" src="${logoParts[1]}" alt="" draggable="false" />
          <img class="logo-mouth" src="${partUrl('mouth', 'mouth-016.webp')}" alt="" draggable="false" />
        </div>
        <h1 class="title">ふくわらい</h1>
        <button class="big-btn go" type="button" aria-label="はじめる"><span class="ico">${ICON.play}</span><span>はじめる</span></button>
        <p class="note">スマホを かたむけると、パーツも かたむくよ</p>
      </section>`;
    $<HTMLButtonElement>(this.root, '.go').addEventListener('click', async () => {
      this.sound.unlock();
      await this.gyro.start();
      this.sound.select();
      this.showBases();
    });
  }

  // ───────────── 土台えらび ─────────────
  private showBases() {
    this.root.innerHTML = `
      <section class="screen bases">
        <h2 class="prompt">どれに かおを つくる？</h2>
        <div class="base-grid">
          ${BASES.map((b, i) => `<button class="base-card" type="button" data-i="${i}" aria-label="つくる"><img src="${b.src}" alt="" draggable="false" /></button>`).join('')}
        </div>
      </section>`;
    $<HTMLElement>(this.root, '.base-grid').addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.base-card');
      if (!btn) return;
      this.sound.select();
      this.startPlay(BASES[Number(btn.dataset.i)]);
    });
  }

  // ───────────── あそぶ ─────────────
  private startPlay(base: Base) {
    this.base = base;
    this.placed = [];
    this.els.clear();
    this.held = null;
    this.category = 'eye';
    this.root.innerHTML = `
      <section class="screen play">
        <header class="topbar">
          <button class="icon-btn back" type="button" aria-label="もどる">${ICON.back}</button>
          <button class="icon-btn mute" type="button" aria-label="おと"></button>
        </header>
        <div class="stage-wrap">
          <div class="stage">
            <img class="base-img" src="${base.src}" alt="" draggable="false" />
            <div class="layer"></div>
          </div>
        </div>
        <div class="tray">
          <div class="hand-row">
            <div class="hand-slot empty" aria-live="polite">
              <img alt="" draggable="false" />
              <span class="hand-empty">${ICON.hand}</span>
            </div>
            <button class="cancel-btn hidden" type="button" aria-label="やめる">${ICON.close}</button>
            <span class="grow"></span>
            <button class="done-btn" type="button" aria-label="できた"><span class="ico">${ICON.star}</span><span>できた！</span></button>
          </div>
          <div class="tabs" role="tablist">
            ${CATEGORIES.map(
              (c) =>
                `<button class="tab" type="button" role="tab" data-cat="${c.id}" style="--tab:${c.color}" aria-label="${c.id}"><img src="${partUrl(c.id, c.icon)}" alt="" draggable="false" /></button>`,
            ).join('')}
          </div>
          <div class="strip"></div>
        </div>
        <canvas class="confetti"></canvas>
        <div class="overlay hidden"></div>
      </section>`;

    this.stage = $(this.root, '.stage');
    this.layer = $(this.root, '.layer');
    this.handSlot = $(this.root, '.hand-slot');
    this.handImg = $(this.handSlot, 'img');
    this.strip = $(this.root, '.strip');

    this.updateMute();
    this.renderTabs();
    this.renderStrip();
    this.renderHeld();

    $<HTMLButtonElement>(this.root, '.mute').addEventListener('click', () => {
      this.sound.setMuted(!this.sound.muted);
      this.sound.unlock();
      this.updateMute();
      this.sound.select();
    });
    $<HTMLButtonElement>(this.root, '.back').addEventListener('click', () => this.askBack());
    $<HTMLButtonElement>(this.root, '.cancel-btn').addEventListener('click', () => this.cancelHeld());
    $<HTMLButtonElement>(this.root, '.done-btn').addEventListener('click', () => void this.finish());
    $<HTMLElement>(this.root, '.tabs').addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLButtonElement>('.tab');
      if (!t) return;
      this.category = t.dataset.cat as CategoryId;
      this.sound.tab();
      this.renderTabs();
      this.renderStrip();
    });
    this.strip.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.thumb');
      if (!b) return;
      const part = PARTS_BY_CATEGORY(this.category).find((p) => p.id === b.dataset.id);
      if (part) this.hold(part);
    });
    this.stage.addEventListener('pointerdown', (e) => this.onStagePointer(e));
  }

  private updateMute() {
    $<HTMLButtonElement>(this.root, '.mute').innerHTML = this.sound.muted ? ICON.soundOff : ICON.soundOn;
  }

  private renderTabs() {
    this.root.querySelectorAll<HTMLButtonElement>('.tab').forEach((t) => {
      const on = t.dataset.cat === this.category;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
  }

  private renderStrip() {
    const parts = PARTS_BY_CATEGORY(this.category);
    this.strip.innerHTML = parts
      .map(
        (p) =>
          `<button class="thumb${this.held?.id === p.id ? ' selected' : ''}" type="button" data-id="${p.id}" aria-label="パーツ"><img src="${p.src}" alt="" loading="lazy" decoding="async" draggable="false" /></button>`,
      )
      .join('');
    this.strip.scrollTo({ left: 0, top: 0 });
  }

  // ───── 持つ(選択中) ─────
  private hold(part: Part, quiet = false) {
    this.held = part;
    if (!quiet) this.sound.select();
    this.renderHeld();
    this.strip.querySelectorAll('.thumb').forEach((t) => t.classList.toggle('selected', (t as HTMLElement).dataset.id === part.id));
  }

  private cancelHeld(silent = false) {
    if (!this.held) return;
    this.held = null;
    if (!silent) this.sound.cancel();
    this.strip.querySelectorAll('.thumb.selected').forEach((t) => t.classList.remove('selected'));
    this.renderHeld();
  }

  private renderHeld() {
    const has = !!this.held;
    this.handSlot.classList.toggle('empty', !has);
    $<HTMLButtonElement>(this.root, '.cancel-btn').classList.toggle('hidden', !has);
    this.stage.classList.toggle('holding', has);
    if (this.held) {
      this.handImg.src = this.held.src;
      // 大きさは枠に収める(縦横比に応じて)
      this.handSlot.classList.toggle('tall', this.held.aspect > 1.1);
    }
    this.applyAngle(this.gyro.angle);
  }

  private applyAngle(a: number) {
    if (!this.handImg) return;
    this.handImg.style.setProperty('--rot', `${a}deg`);
  }

  // ───── 貼る/剥がす ─────
  private onStagePointer(e: PointerEvent) {
    const r = this.stage.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const nx = px / r.width;
    const ny = py / r.height;

    if (this.held) {
      this.paste(this.held, nx, ny, this.gyro.angle);
      if (!KEEP_HOLDING_AFTER_PASTE) this.cancelHeld(true);
      return;
    }
    // 何も持っていないとき: 貼ったパーツをタップ → 剥がして「選択中」に
    for (let i = this.placed.length - 1; i >= 0; i--) {
      const p = this.placed[i];
      if (hitPlaced(p, this.els.get(p.uid) ?? null, px, py, r.width)) {
        this.peel(p);
        return;
      }
    }
  }

  private paste(part: Part, x: number, y: number, rot: number) {
    const p: Placed = { uid: this.nextUid++, part, x, y, rot };
    this.placed.push(p);
    const img = document.createElement('img');
    img.className = 'placed pop';
    img.src = part.src;
    img.alt = '';
    img.draggable = false;
    img.style.left = `${x * 100}%`;
    img.style.top = `${y * 100}%`;
    img.style.width = `${part.widthFraction * 100}%`;
    img.style.setProperty('--rot', `${rot}deg`);
    img.style.zIndex = String(p.uid);
    img.addEventListener('animationend', () => img.classList.remove('pop'), { once: true });
    this.layer.appendChild(img);
    this.els.set(p.uid, img);
    this.sound.paste();
    if (navigator.vibrate) navigator.vibrate(12);
  }

  private peel(p: Placed) {
    this.placed = this.placed.filter((q) => q.uid !== p.uid);
    this.els.get(p.uid)?.remove();
    this.els.delete(p.uid);
    this.sound.peel();
    // 剥がしたパーツを持ち直す(カテゴリのタブも合わせる)
    this.category = p.part.category;
    this.renderTabs();
    this.renderStrip();
    this.hold(p.part, true);
  }

  // ───── もどる ─────
  private askBack() {
    if (this.placed.length === 0) {
      this.sound.cancel();
      this.showBases();
      return;
    }
    this.showOverlay(
      `<div class="dialog">
         <p class="dialog-text">つくったかおが きえるけど<br />いいかな？</p>
         <div class="dialog-btns">
           <button class="label-btn no" type="button"><span class="round-btn">${ICON.close}</span><span class="label">やめない</span></button>
           <button class="label-btn yes" type="button"><span class="round-btn">${ICON.yes}</span><span class="label">さいしょへ<br />もどる</span></button>
         </div>
       </div>`,
      (ov) => {
        $<HTMLButtonElement>(ov, '.no').addEventListener('click', () => this.hideOverlay());
        $<HTMLButtonElement>(ov, '.yes').addEventListener('click', () => {
          this.hideOverlay();
          this.showBases();
        });
      },
    );
  }

  // ───── できた！ ─────
  private async finish() {
    this.cancelHeld(true);
    this.sound.unlock();
    this.sound.done();
    const canvas = $<HTMLCanvasElement>(this.root, '.confetti');
    canvas.classList.add('on');
    void burstConfetti(canvas).then(() => canvas.classList.remove('on'));

    let blob: Blob | null = null;
    try {
      blob = await composePng(this.base!.src, this.placed);
    } catch {
      blob = null;
    }
    if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
    this.resultUrl = blob ? URL.createObjectURL(blob) : null;
    await new Promise((r) => setTimeout(r, 900));
    this.showOverlay(
      `<div class="result">
         ${this.resultUrl ? `<img class="result-img" src="${this.resultUrl}" alt="" />` : ''}
         <div class="result-btns">
           <button class="label-btn again" type="button"><span class="round-btn">${ICON.again}</span><span class="label">もういちど<br />つくる</span></button>
           <button class="label-btn keep" type="button"><span class="round-btn">${ICON.play}</span><span class="label">つづけて<br />あそぶ</span></button>
           ${blob ? `<button class="label-btn save" type="button"><span class="round-btn">${ICON.save}</span><span class="label">しゃしんを<br />ほぞん</span></button>` : ''}
         </div>
       </div>`,
      (ov) => {
        $<HTMLButtonElement>(ov, '.again').addEventListener('click', () => {
          this.hideOverlay();
          this.showBases();
        });
        $<HTMLButtonElement>(ov, '.keep').addEventListener('click', () => this.hideOverlay());
        ov.querySelector<HTMLButtonElement>('.save')?.addEventListener('click', () => void this.save(blob!));
      },
    );
  }

  private async save(blob: Blob) {
    const file = new File([blob], 'fukuwarai.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    // スマホでは共有シート(「画像を保存」など)を優先。使えなければダウンロード
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fukuwarai.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  private showOverlay(html: string, bind: (ov: HTMLElement) => void) {
    const ov = $<HTMLElement>(this.root, '.overlay');
    ov.innerHTML = html;
    ov.classList.remove('hidden');
    // 暗い部分をタップしたら、ふくわらい画面に戻る
    ov.onclick = (e) => {
      if (e.target === ov) this.hideOverlay();
    };
    bind(ov);
  }

  private hideOverlay() {
    const ov = $<HTMLElement>(this.root, '.overlay');
    ov.classList.add('hidden');
    ov.innerHTML = '';
  }
}
