/**
 * スマホの傾き(画面を回す向きのロール)を取得する。
 * deviceorientation の beta/gamma から重力ベクトルを求め、画面平面内での傾きを角度にする。
 * 端末を立てて持ち、ハンドルを切るように回すと角度が変わる。
 */

const MAX_ANGLE = 75;
const DEAD_ZONE = 2;
/** 端末がほぼ水平(画面平面内の重力が小さい)のときは角度が不安定なので前回値を保つ */
const MIN_IN_PLANE = 0.3;

export function rad(d: number): number {
  return (d * Math.PI) / 180;
}

/**
 * 画面の時計回りの傾き(度)を返す。求められない(水平に近い)ときは null。
 * @param beta  deviceorientation.beta
 * @param gamma deviceorientation.gamma
 * @param screenAngle screen.orientation.angle (0 / 90 / 180 / 270)
 */
export function tiltAngle(beta: number, gamma: number, screenAngle = 0): number | null {
  // 端末座標系での「下」向きベクトル(x: 右, y: 上)
  const dx = Math.sin(rad(gamma)) * Math.cos(rad(beta));
  const dy = -Math.sin(rad(beta));
  // 画面の向きに合わせて回す
  const a = ((Math.round(screenAngle / 90) % 4) + 4) % 4;
  const [sx, sy] = [
    [dx, dy],
    [-dy, dx],
    [-dx, -dy],
    [dy, -dx],
  ][a];
  if (Math.hypot(sx, sy) < MIN_IN_PLANE) return null;
  // 端末を時計回りに傾けると、右の辺が下がって重力は画面の右(+x)へ寄る
  const deg = (Math.atan2(sx, -sy) * 180) / Math.PI;
  return clampAngle(deg);
}

export function clampAngle(deg: number): number {
  const c = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, deg));
  return Math.abs(c) < DEAD_ZONE ? 0 : c;
}

type PermissionState = 'granted' | 'denied';
type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

export class Gyro {
  /** 現在の角度(度・時計回りが正)。使えないときは常に 0 */
  angle = 0;
  active = false;
  private started = false;
  private listeners = new Set<(angle: number) => void>();

  onChange(fn: (angle: number) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** ユーザー操作(タップ)の中で呼ぶこと。iOS では許可ダイアログが出る。 */
  async start(): Promise<boolean> {
    if (this.started) return this.active;
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return false;
    const Ctor = window.DeviceOrientationEvent as OrientationCtor;
    try {
      if (typeof Ctor.requestPermission === 'function') {
        const res = await Ctor.requestPermission();
        if (res !== 'granted') return false;
      }
    } catch {
      return false;
    }
    this.started = true;
    window.addEventListener('deviceorientation', this.handle);
    return true;
  }

  private handle = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    const angle = screen.orientation?.angle ?? 0;
    const tilt = tiltAngle(e.beta, e.gamma, angle);
    if (tilt == null) return;
    // シールは端末の傾きと逆向きに回す(端末を右に傾けるとシールは左へ回り、床に対して水平を保つ体感)
    const target = -tilt;
    this.active = true;
    // ローパスでガタつきを抑える
    this.angle = this.angle + (target - this.angle) * 0.25;
    if (Math.abs(this.angle) < 0.3) this.angle = 0;
    this.listeners.forEach((fn) => fn(this.angle));
  };
}
