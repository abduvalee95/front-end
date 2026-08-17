import { describe, expect, it } from 'vitest';
import {
  createField,
  createParticle,
  particleCount,
  renderAlpha,
  stepParticle,
  REPEL_RADIUS,
  type Particle,
} from '@/lib/sidebar-particles';

/**
 * Sidebar particle field.
 *
 * The drawing is not testable and not interesting; the arithmetic behind it
 * is. What matters is that the field scales with the panel instead of being a
 * fixed count, that particles never escape it, and that the cursor pushes them
 * away — an attractor collects the whole field into a clump under the mouse
 * and holds it there, which is the failure this shape of effect usually has.
 */

/** Deterministic stand-in for Math.random, cycling through fixed values. */
function seeded(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('particleCount', () => {
  it('scales with area, so a collapsed sidebar does not become a dense column', () => {
    const expanded = particleCount(260, 900);
    const collapsed = particleCount(80, 900);
    expect(collapsed).toBeLessThan(expanded);
  });

  it('stays within bounds for degenerate and huge panels', () => {
    expect(particleCount(0, 0)).toBe(10);
    expect(particleCount(20, 40)).toBe(10);
    expect(particleCount(4000, 4000)).toBe(34);
  });
});

describe('createField', () => {
  it('places every particle inside the panel', () => {
    const field = createField(260, 900);
    expect(field).toHaveLength(particleCount(260, 900));
    for (const p of field) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(260);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(900);
    }
  });

  it('gives every particle an upward resting drift', () => {
    for (const p of createField(260, 900)) {
      expect(p.driftY).toBeLessThan(0);
    }
  });
});

describe('stepParticle', () => {
  /**
   * A particle parked at a known position. Velocity is left as createParticle
   * made it — zeroing vy here would be testing a state the field never
   * produces, since a particle is born already drifting.
   */
  const at = (x: number, y: number): Particle => ({
    ...createParticle(260, 900, seeded([0.5])),
    x,
    y,
  });

  it('drifts upward when the cursor is away', () => {
    const p = at(130, 400);
    stepParticle(p, 260, 900, null);
    expect(p.y).toBeLessThan(400);
  });

  it('pushes a particle away from the cursor, never toward it', () => {
    const pointer = { x: 130, y: 400 };
    const p = at(150, 400); // 20px to the right of the cursor
    const before = p.x;
    stepParticle(p, 260, 900, pointer);
    expect(p.x).toBeGreaterThan(before);
  });

  it('leaves particles outside the repel radius unshoved', () => {
    const pointer = { x: 130, y: 400 };
    const p = at(130 + REPEL_RADIUS + 5, 400);
    const before = p.x;
    stepParticle(p, 260, 900, pointer);
    expect(p.x).toBe(before);
  });

  it('decays a shove instead of letting it travel forever', () => {
    const p = at(130, 400);
    p.vx = 4;
    const speeds: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      stepParticle(p, 260, 900, null);
      speeds.push(Math.abs(p.vx));
    }
    expect(speeds[4]).toBeLessThan(speeds[0]);
    expect(speeds[4]).toBeLessThan(4);
  });

  it('wraps a particle that leaves the top back to the bottom', () => {
    const p = at(130, 0);
    p.vy = -50;
    stepParticle(p, 260, 900, null);
    expect(p.y).toBeGreaterThan(800);
  });

  it('wraps horizontally too, so a shove cannot strand a particle outside', () => {
    const p = at(259, 400);
    p.vx = 40;
    stepParticle(p, 260, 900, null);
    expect(p.x).toBeLessThanOrEqual(0);
  });

  it('keeps every particle inside the panel over a long run with the cursor moving', () => {
    const field = createField(260, 900);
    for (let frame = 0; frame < 600; frame += 1) {
      const pointer = { x: 130, y: (frame * 3) % 900 };
      for (const p of field) {
        stepParticle(p, 260, 900, pointer);
        expect(p.x).toBeGreaterThanOrEqual(-p.r - 1);
        expect(p.x).toBeLessThanOrEqual(260 + p.r + 1);
        expect(p.y).toBeGreaterThanOrEqual(-p.r - 1);
        expect(p.y).toBeLessThanOrEqual(900 + p.r + 1);
      }
    }
  });
});

describe('renderAlpha', () => {
  it('stays within the particle base opacity and never goes negative', () => {
    const p = createParticle(260, 900, seeded([0.5]));
    for (let i = 0; i < 200; i += 1) {
      const a = renderAlpha(p);
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThanOrEqual(p.alpha);
      p.phase += 0.012;
    }
  });
});
