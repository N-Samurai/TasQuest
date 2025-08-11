// components/effects/Celebration.tsx
"use client";
import { useEffect } from "react";

type Props = { open: boolean; onDone?: () => void; durationMs?: number };

export default function Celebration({
  open,
  onDone,
  durationMs = 1000,
}: Props) {
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      onDone?.();
      return;
    }

    let cleared = false;
    (async () => {
      const confetti = (await import("canvas-confetti")).default;
      const end = Date.now() + durationMs;

      const tick = () => {
        if (cleared) return;
        confetti({
          particleCount: 40,
          spread: 70,
          startVelocity: 35,
          scalar: 0.9,
          origin: { y: 0.7 }, // 画面下から
        });
        if (Date.now() < end) {
          setTimeout(tick, 140);
        } else {
          onDone?.();
        }
      };
      tick();
    })();

    return () => {
      cleared = true;
    };
  }, [open, onDone, durationMs]);

  return null; // 画面には何も描かない（canvas-confettiは自前でcanvasを作ります）
}
