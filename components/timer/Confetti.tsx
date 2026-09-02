"use client";

import { useMemo, type CSSProperties } from "react";

/** Pháo giấy nhỏ khi xong phiên (SPEC.md §5.7) — chỉ ở khoảnh khắc chuyển tiếp, không lặp lại. */

type Props = { active: boolean };

const PARTICLE_COUNT = 14;
const PARTICLE_EMOJI = ["✨", "🎉", "⭐️"];

/**
 * Jitter giả-ngẫu-nhiên nhưng THUẦN (không `Math.random`) — react-hooks/purity (bản đi kèm
 * React Compiler trong eslint-config-next 16) cấm gọi hàm không thuần trong lúc render, kể cả
 * trong factory của useMemo. Vẫn đủ rối mắt cho một lần nổ pháo giấy — không cần ngẫu nhiên thật.
 */
function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

export function Confetti({ active }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + jitter(i) * 0.4;
        const distance = 70 + jitter(i + 100) * 50;
        return {
          id: i,
          emoji: PARTICLE_EMOJI[i % PARTICLE_EMOJI.length],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          delay: jitter(i + 200) * 0.15,
        };
      }),
    [],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-confetti-burst text-xl"
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              animationDelay: `${p.delay}s`,
            } as CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
