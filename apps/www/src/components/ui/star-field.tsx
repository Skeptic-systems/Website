"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Star = {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
};

const STAR_COUNT = 220;
const GLOW_STAR_COUNT = 12;

function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      baseOpacity: Math.random() * 0.6 + 0.25,
      twinkleSpeed: Math.random() * 0.004 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.5,
      driftY: (Math.random() - 0.5) * 0.12,
    });
  }
  for (let i = 0; i < GLOW_STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 2.5,
      baseOpacity: Math.random() * 0.35 + 0.2,
      twinkleSpeed: Math.random() * 0.003 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.25,
      driftY: (Math.random() - 0.5) * 0.08,
    });
  }
  return stars;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        const twinkle = prefersReduced
          ? star.baseOpacity
          : star.baseOpacity +
            Math.sin(time * star.twinkleSpeed + star.twinkleOffset) *
              star.baseOpacity *
              0.6;

        const opacity = Math.max(0, Math.min(1, twinkle));

        const x = prefersReduced
          ? star.x
          : ((star.x + star.driftX * (time * 0.01)) % (w + 20)) - 10;

        const y = prefersReduced
          ? star.y
          : star.y + Math.sin(time * 0.001 + star.twinkleOffset) * 3.5;

        if (star.size > 2.5) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3.5);
          gradient.addColorStop(0, `rgba(200, 220, 255, ${opacity * 0.9})`);
          gradient.addColorStop(0.25, `rgba(180, 200, 255, ${opacity * 0.35})`);
          gradient.addColorStop(1, "rgba(180, 200, 255, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, star.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(220, 230, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
      style={{ opacity: mounted ? (isDark ? 1 : 0) : 0 }}
      aria-hidden="true"
    />
  );
}
