"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

const CHARS = "┌─┐│└┘┼├┤┬┴╭╮╯╰·•∙";
const CELL_WIDTH = 14;
const CELL_HEIGHT = 24;
const DENSITY = 0.15;
const SCROLL_SPEED = 0.3;

interface Cell {
  char: string;
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  fadeSpeed: number;
}

export function AsciiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let cells: Cell[] = [];
    let scrollOffset = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initCells();
    };

    const initCells = () => {
      const cols = Math.ceil(window.innerWidth / CELL_WIDTH);
      const rows = Math.ceil((window.innerHeight * 2) / CELL_HEIGHT);
      const totalCells = cols * rows;
      const numChars = Math.floor(totalCells * DENSITY);

      cells = [];
      const positions = new Set<number>();
      while (positions.size < numChars) {
        positions.add(Math.floor(Math.random() * totalCells));
      }

      const isDark = resolvedTheme === "dark";
      for (const i of positions) {
        const baseOpacity = isDark ? 0.2 : 0.1;
        const opacity = baseOpacity + Math.random() * baseOpacity;
        cells.push({
          char: CHARS[Math.floor(Math.random() * CHARS.length)],
          x: (i % cols) * CELL_WIDTH,
          y: Math.floor(i / cols) * CELL_HEIGHT,
          opacity,
          targetOpacity: opacity,
          fadeSpeed: 0.005 + Math.random() * 0.01,
        });
      }
    };

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isDark = resolvedTheme === "dark";

      ctx.clearRect(0, 0, width, height);
      ctx.font = "16px monospace";

      const baseOpacity = isDark ? 0.2 : 0.1;
      const color = isDark ? "156, 163, 175" : "107, 114, 128";

      scrollOffset += SCROLL_SPEED;
      if (scrollOffset >= height) scrollOffset = 0;

      for (const cell of cells) {
        // Smoothly interpolate opacity
        if (Math.abs(cell.opacity - cell.targetOpacity) < 0.01) {
          cell.targetOpacity = baseOpacity + Math.random() * baseOpacity;
        }
        cell.opacity += (cell.targetOpacity - cell.opacity) * cell.fadeSpeed;

        // Calculate wrapped Y position for seamless scrolling
        let y = (cell.y - scrollOffset) % (height * 2);
        if (y < -CELL_HEIGHT) y += height * 2;
        if (y > height + CELL_HEIGHT) continue;

        ctx.fillStyle = `rgba(${color}, ${cell.opacity})`;
        ctx.fillText(cell.char, cell.x, y);
      }

      animationId = requestAnimationFrame(render);
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [resolvedTheme]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" aria-hidden="true" />
  );
}
