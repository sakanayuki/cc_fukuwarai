import { describe, expect, it } from 'vitest';
import { clampAngle, tiltAngle } from './gyro';

describe('tiltAngle', () => {
  it('縦に立てて真っ直ぐ持つと 0 度', () => {
    expect(tiltAngle(90, 0, 0)).toBeCloseTo(0, 5);
  });

  it('端末を時計回りに10度回す(縦持ち)と +10 度、反時計回りは -10 度', () => {
    // 立てた端末を画面平面内で回すと、ブラウザは gamma=±90 付近 + beta のずれで報告する
    expect(tiltAngle(80, 90, 0)).toBeCloseTo(10, 3);
    expect(tiltAngle(80, -90, 0)).toBeCloseTo(-10, 3);
  });

  it('水平に置いて右の辺を下げると時計回り(+)になる', () => {
    expect(tiltAngle(0, 30, 0)).toBe(75); // 90度だが上限75度で頭打ち
    expect(tiltAngle(0, -30, 0)).toBe(-75);
  });

  it('完全に水平(重力が画面平面にない)のときは null', () => {
    expect(tiltAngle(0, 0, 0)).toBeNull();
  });

  it('横向き(画面 90 度)でも、真っ直ぐ持てば 0 度', () => {
    // 端末を反時計回りに90度回した姿勢: 端末の上端が画面左を向く
    // 重力は端末の -x 方向 → beta=0, gamma=-90 付近
    expect(tiltAngle(0, -90, 90)).toBeCloseTo(0, 3);
    // 逆向きの横持ち(270度): 重力は端末の +x 方向
    expect(tiltAngle(0, 90, 270)).toBeCloseTo(0, 3);
  });
});

describe('clampAngle', () => {
  it('上限を超えない', () => {
    expect(clampAngle(200)).toBe(75);
    expect(clampAngle(-200)).toBe(-75);
  });
  it('不感帯は 0', () => {
    expect(clampAngle(1.5)).toBe(0);
    expect(clampAngle(-1.9)).toBe(0);
    expect(clampAngle(10)).toBe(10);
  });
});
