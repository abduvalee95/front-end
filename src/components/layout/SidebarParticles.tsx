'use client';

import { useEffect, useRef } from 'react';
import { createField, renderAlpha, stepParticle, type Pointer } from '@/lib/sidebar-particles';

/**
 * Drifting motes behind the sidebar navigation.
 *
 * Confined to the sidebar on purpose. This is the surface where a decorative
 * field costs nothing to read — it is chrome, with no data under it. The same
 * effect across the workspace would sit on top of attendance grids and payment
 * tables, which is where people are actually reading.
 */
export function SidebarParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    // Same contract as the cursor glow: someone who asked for less motion gets
    // no loop at all, not a loop that draws less.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Custom properties inherit, so the accent can be read straight off the
    // canvas — the field stays on whatever `--sidebar-active` currently is
    // instead of pinning a colour that a token change would leave behind.
    // Canvas cannot resolve var() itself, which is the same constraint the
    // charts hit (see src/lib/chart-theme.ts).
    const accent = getComputedStyle(canvas).getPropertyValue('--sidebar-active').trim();
    if (!accent) return;
    context.fillStyle = `hsl(${accent})`;

    let width = 0;
    let height = 0;
    let field = createField(1, 1);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const ratio = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      // Draw in CSS pixels and let the transform handle the backing store, so
      // the maths never has to know about device pixel ratio.
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = `hsl(${accent})`;
      field = createField(width, height);
    };

    /**
     * The cursor position is taken from the custom properties usePointerGlow
     * already maintains on the sidebar, rather than by adding a second
     * pointermove listener to the same element. One source of truth, one
     * listener, and the field automatically stops reacting in the cases where
     * that hook declines to attach — reduced motion and touch.
     */
    const readPointer = (): Pointer | null => {
      if (host.style.getPropertyValue('--glow-opacity') !== '1') return null;
      const x = Number.parseFloat(host.style.getPropertyValue('--glow-x'));
      const y = Number.parseFloat(host.style.getPropertyValue('--glow-y'));
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    };

    let frame = 0;
    const draw = () => {
      const pointer = readPointer();
      context.clearRect(0, 0, width, height);
      for (const particle of field) {
        stepParticle(particle, width, height, pointer);
        context.globalAlpha = renderAlpha(particle);
        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    // A background tab still services rAF in some browsers and always costs
    // something in the others; there is nobody looking at it either way.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    // The sidebar animates between 260px and 80px when collapsed, so the field
    // has to be rebuilt for the new area rather than stretched into it.
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
