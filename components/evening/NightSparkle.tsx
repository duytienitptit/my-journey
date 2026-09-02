"use client";

import { useMemo, type CSSProperties } from "react";

/**
 * Hoạt ảnh ngắn, dễ chịu khi đóng ngày — SPEC.md §5.1: "Nhân vật đi ngủ. Hoạt ảnh ngắn, dễ
 * chịu." Pack nhân vật (CREDITS.md) không có animation "đi ngủ" đúng nghĩa và animation gần
 * nhất ("die") trông không hợp cho một khoảnh khắc dễ chịu — thay bằng vài ngôi sao trôi lên
 * nhẹ nhàng, chậm hơn hẳn pháo giấy lúc hết phiên (components/timer/Confetti.tsx), đúng tinh
 * thần "tĩnh" của buổi tối chứ không "vui náo nhiệt" như lúc xong phiên.
 */

type Props = { active: boolean };

const PARTICLE_COUNT = 9;
const PARTICLE_EMOJI = ["🌙", "⭐", "✨"];

// Cùng mẹo jitter thuần như Confetti.tsx — tránh Math.random() trong lúc render (react-hooks/purity).
function jitter(seed: number): number {
  const x = Math.sin(seed * 78.233) * 12543.987;
  return x - Math.floor(x);
}

export function NightSparkle({ active }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const spread = (i / (PARTICLE_COUNT - 1) - 0.5) * 220;
        return {
          id: i,
          emoji: PARTICLE_EMOJI[i % PARTICLE_EMOJI.length],
          dx: spread + (jitter(i) - 0.5) * 30,
          rise: 50 + jitter(i + 50) * 40,
          delay: jitter(i + 100) * 0.5,
        };
      }),
    [],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-visible">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-night-drift text-lg"
          style={
            {
              left: "50%",
              "--dx": `${p.dx}px`,
              "--rise": `${p.rise}px`,
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
