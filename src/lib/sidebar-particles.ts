/**
 * Particle field maths for the sidebar.
 *
 * Kept free of the DOM and of canvas so the behaviour can be tested directly:
 * the parts worth getting right — how many particles a panel gets, that they
 * stay inside it, and that the cursor pushes them away rather than capturing
 * them — are all arithmetic.
 */

export interface Particle {
  x: number;
  y: number;
  /** Radius in CSS pixels. */
  r: number;
  vx: number;
  vy: number;
  /** Resting upward drift; vy is damped back toward this after a shove. */
  driftY: number;
  /** Base opacity before the twinkle factor. */
  alpha: number;
  /** Phase of the twinkle cycle, in radians. */
  phase: number;
}

export interface Pointer {
  x: number;
  y: number;
}

/** How close the cursor has to be, in CSS pixels, to move a particle. */
export const REPEL_RADIUS = 96;

/**
 * One particle per ~9k px². A collapsed sidebar is ~80px wide, so the count
 * has to follow the area rather than being fixed, or the narrow state turns
 * into a dense column. Bounded at both ends: too few reads as specks of dust
 * on the screen, too many reads as noise behind the navigation.
 */
export function particleCount(width: number, height: number): number {
  return Math.max(10, Math.min(34, Math.round((width * height) / 9000)));
}

export function createParticle(
  width: number,
  height: number,
  random: () => number = Math.random,
): Particle {
  const driftY = -0.1 - random() * 0.18;
  return {
    x: random() * width,
    y: random() * height,
    r: 0.7 + random() * 1.5,
    vx: 0,
    vy: driftY,
    driftY,
    alpha: 0.16 + random() * 0.34,
    phase: random() * Math.PI * 2,
  };
}

export function createField(
  width: number,
  height: number,
  random: () => number = Math.random,
): Particle[] {
  return Array.from({ length: particleCount(width, height) }, () =>
    createParticle(width, height, random),
  );
}

/**
 * Advance one particle by a frame.
 *
 * The cursor pushes particles away and never pulls them in: an attractor
 * collects the whole field into a clump under the mouse and holds it there,
 * which reads as a bug rather than as an effect.
 */
export function stepParticle(
  p: Particle,
  width: number,
  height: number,
  pointer: Pointer | null,
): void {
  if (pointer) {
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance < REPEL_RADIUS && distance > 0) {
      const force = (1 - distance / REPEL_RADIUS) * 0.6;
      p.vx += (dx / distance) * force;
      p.vy += (dy / distance) * force;
    }
  }

  p.x += p.vx;
  p.y += p.vy;

  // Ease back to the resting drift so a shove decays instead of leaving the
  // particle travelling in a straight line forever.
  p.vx *= 0.94;
  p.vy += (p.driftY - p.vy) * 0.06;

  p.phase += 0.012;

  // Wrap rather than bounce: these are meant to read as motes passing through
  // the panel, and a bounce makes the panel edges look like walls.
  if (p.y < -p.r) {
    p.y = height + p.r;
    p.x = Math.random() * width;
  } else if (p.y > height + p.r) {
    p.y = -p.r;
  }
  if (p.x < -p.r) p.x = width + p.r;
  else if (p.x > width + p.r) p.x = -p.r;
}

/** Opacity to draw with this frame, including the twinkle. */
export function renderAlpha(p: Particle): number {
  return p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
}
