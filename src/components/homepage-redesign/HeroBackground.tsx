import { useEffect, useRef } from "react";

interface HeroBackgroundProps {
  className?: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getTheme(): "dark" | "light" {
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface Dot {
  baseX: number;
  baseY: number;
  renderX: number;
  renderY: number;
  depth: number;
  size: number;
  baseAlpha: number;
  colorR: number;
  colorG: number;
  colorB: number;
}

function buildDots(w: number, h: number, spacing: number, isDark: boolean): Dot[] {
  const dots: Dot[] = [];
  const cols = Math.ceil(w / spacing) + 4;
  const rows = Math.ceil(h / spacing) + 4;
  const ox = -spacing;
  const oy = -spacing * 1.5;

  const colors = isDark
    ? [
        [167, 139, 250],
        [96, 165, 250],
        [147, 51, 234],
        [59, 130, 246],
        [196, 181, 253],
        [34, 211, 238],
      ]
    : [
        [79, 100, 150],
        [99, 118, 165],
        [89, 108, 155],
        [109, 125, 170],
        [69, 88, 140],
      ];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ox + col * spacing;
      const y = oy + row * spacing;
      const depth = clamp((y - h * 0.05) / (h * 0.85), 0, 1);
      const c = colors[(col + row) % colors.length];
      dots.push({
        baseX: x,
        baseY: y,
        renderX: x,
        renderY: y,
        depth,
        size: isDark ? lerp(1.6, 2.6, 1 - depth) : lerp(0.8, 1.5, 1 - depth),
        baseAlpha: isDark ? lerp(0.55, 0.9, 1 - depth) : lerp(0.18, 0.38, 1 - depth),
        colorR: c[0],
        colorG: c[1],
        colorB: c[2],
      });
    }
  }

  return dots;
}

export function HeroBackground({ className }: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const targetMouseRef = useRef({ x: -1, y: -1 });
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const mouseActiveRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let spacing = 40;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      spacing = rect.width < 640 ? 26 : rect.width < 1024 ? 32 : 36;
      dotsRef.current = buildDots(rect.width, rect.height, spacing, getTheme() === "dark");
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      mouseActiveRef.current = true;
    };

    const handleMouseLeave = () => {
      mouseActiveRef.current = false;
      targetMouseRef.current = { x: -1, y: -1 };
    };

    const draw = (w: number, h: number, t: number, isDark: boolean) => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const hasMouse = mouseActiveRef.current && mx >= 0;

      // Raw mouse for glow — no lag, exact cursor position
      const rawMx = targetMouseRef.current.x;
      const rawMy = targetMouseRef.current.y;
      const hasRawMouse = mouseActiveRef.current && rawMx >= 0;

      ctx.clearRect(0, 0, w, h);

      // Layer 1: Gradient mesh
      const anim = t * 0.0002;

      const pbx = w * (0.28 + Math.sin(anim) * 0.1);
      const pby = h * (0.32 + Math.cos(anim * 0.6) * 0.08);
      const pbr = Math.max(w, h) * 0.72;

      const pg = ctx.createRadialGradient(pbx, pby, 0, pbx, pby, pbr);
      if (isDark) {
        pg.addColorStop(0, "rgba(147, 51, 234, 0.5)");
        pg.addColorStop(0.3, "rgba(99, 102, 241, 0.32)");
        pg.addColorStop(0.6, "rgba(59, 130, 246, 0.2)");
        pg.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        pg.addColorStop(0, "rgba(200, 215, 255, 0.55)");
        pg.addColorStop(0.3, "rgba(210, 220, 255, 0.45)");
        pg.addColorStop(0.6, "rgba(220, 230, 255, 0.3)");
        pg.addColorStop(1, "rgba(248, 250, 252, 0)");
      }
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, w, h);

      // Secondary blob
      const sbx = w * (0.72 + Math.cos(anim * 0.55) * 0.07);
      const sby = h * (0.65 + Math.sin(anim * 0.45) * 0.05);
      const sbr = Math.max(w, h) * 0.42;

      const sg = ctx.createRadialGradient(sbx, sby, 0, sbx, sby, sbr);
      if (isDark) {
        sg.addColorStop(0, "rgba(236, 72, 153, 0.18)");
        sg.addColorStop(0.5, "rgba(168, 85, 247, 0.1)");
        sg.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        sg.addColorStop(0, "rgba(220, 235, 255, 0.35)");
        sg.addColorStop(0.5, "rgba(220, 230, 255, 0.2)");
        sg.addColorStop(1, "rgba(255, 255, 255, 0)");
      }
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, w, h);

      // Layer 2: Mouse glow — uses raw mouse for exact centering
      if (hasRawMouse) {
        const gr = Math.min(w, h) * 0.45;
        const gg = ctx.createRadialGradient(rawMx, rawMy, 0, rawMx, rawMy, gr);
        if (isDark) {
          gg.addColorStop(0, "rgba(139, 92, 246, 0.3)");
          gg.addColorStop(0.3, "rgba(99, 102, 241, 0.15)");
          gg.addColorStop(0.65, "rgba(59, 130, 246, 0.06)");
          gg.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          gg.addColorStop(0, "rgba(168, 85, 247, 0.16)");
          gg.addColorStop(0.3, "rgba(99, 102, 241, 0.08)");
          gg.addColorStop(0.65, "rgba(59, 130, 246, 0.03)");
          gg.addColorStop(1, "rgba(255, 255, 255, 0)");
        }
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, w, h);

        // Wave rings from mouse
        const waveSpeed = t * (isDark ? 0.003 : 0.004);
        const maxRings = isDark ? 5 : 4;
        for (let r = 0; r < maxRings; r++) {
          const ringSpacing = isDark ? 55 : 70;
          const ringRadius = (waveSpeed * (isDark ? 50 : 40) + r * ringSpacing) % (gr * 0.8);
          const baseRingAlpha = isDark ? 0.2 : 0.95;
          const ringAlpha =
            Math.max(0, baseRingAlpha - (ringRadius / (gr * 0.8)) * baseRingAlpha) * (1 - r * 0.06);

          if (ringAlpha < 0.01) continue;

          ctx.beginPath();
          ctx.arc(rawMx, rawMy, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? `rgba(167, 139, 250, ${ringAlpha})`
            : `rgba(30, 55, 110, ${ringAlpha * 3})`;
          ctx.lineWidth = isDark ? 1.5 : 2.5;
          ctx.stroke();
        }
      }

      // Layer 3: Dot grid — NO movement without mouse, gentle ripple with mouse
      const dots = dotsRef.current;
      const waveRadius = Math.min(w, h) * 0.32;
      const waveSpeed2 = t * 0.0028;

      for (const dot of dots) {
        const dx = dot.baseX - mx;
        const dy = dot.baseY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (hasMouse && dist < waveRadius) {
          // Gentle ripple — dots shift outward from cursor
          const wavePhase = (dist - waveSpeed2 * 55) * 0.08;
          const ripple = Math.sin(wavePhase) * 6;
          const falloff = Math.max(0, 1 - dist / waveRadius);
          const rippleX = (dx / (dist || 1)) * ripple * falloff;
          const rippleY = (dy / (dist || 1)) * ripple * falloff;
          dot.renderX = lerp(dot.renderX, dot.baseX + rippleX, 0.1);
          dot.renderY = lerp(dot.renderY, dot.baseY + rippleY, 0.1);
        } else {
          // No mouse — dots return to base position smoothly
          dot.renderX = lerp(dot.renderX, dot.baseX, 0.08);
          dot.renderY = lerp(dot.renderY, dot.baseY, 0.08);
        }

        // Glow near cursor — uses raw mouse for accurate detection
        const glowRadius = Math.min(w, h) * 0.2;
        const glowDist = Math.sqrt(
          (dot.baseX - rawMx) * (dot.baseX - rawMx) + (dot.baseY - rawMy) * (dot.baseY - rawMy)
        );
        const glowFalloff = hasRawMouse ? Math.max(0, 1 - glowDist / glowRadius) : 0;
        const glow = glowFalloff * glowFalloff;

        const alpha = clamp(dot.baseAlpha + glow * (isDark ? 0.6 : 0.35), 0, 1);
        const size = dot.size * (1 + glow * (isDark ? 0.7 : 0.5));

        if (alpha < 0.03) continue;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(dot.renderX, dot.renderY, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${dot.colorR}, ${dot.colorG}, ${dot.colorB})`;
        ctx.fill();

        if (glow > 0.25) {
          ctx.globalAlpha = (glow - 0.25) * 0.4;
          ctx.beginPath();
          ctx.arc(dot.renderX, dot.renderY, size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      // Layer 4: Top vignette
      const tv = ctx.createLinearGradient(0, 0, 0, h * 0.2);
      if (isDark) {
        tv.addColorStop(0, "rgba(0, 0, 0, 0.62)");
        tv.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        tv.addColorStop(0, "rgba(255, 255, 255, 0.88)");
        tv.addColorStop(1, "rgba(255, 255, 255, 0)");
      }
      ctx.fillStyle = tv;
      ctx.fillRect(0, 0, w, h * 0.2);

      // Layer 5: Bottom fade
      const bv = ctx.createLinearGradient(0, h * 0.8, 0, h);
      if (isDark) {
        bv.addColorStop(0, "rgba(0, 0, 0, 0)");
        bv.addColorStop(1, "rgba(0, 0, 0, 0.58)");
      } else {
        bv.addColorStop(0, "rgba(255, 255, 255, 0)");
        bv.addColorStop(1, "rgba(248, 250, 252, 0.72)");
      }
      ctx.fillStyle = bv;
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
    };

    const animate = () => {
      timeRef.current = performance.now();
      mouseRef.current.x = lerp(mouseRef.current.x, targetMouseRef.current.x, 0.5);
      mouseRef.current.y = lerp(mouseRef.current.y, targetMouseRef.current.y, 0.5);

      const rect = canvas.getBoundingClientRect();
      draw(rect.width, rect.height, timeRef.current, getTheme() === "dark");

      rafRef.current = requestAnimationFrame(animate);
    };

    resize();
    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
