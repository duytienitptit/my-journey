"use client";

import type { ReactNode } from "react";

type Props = {
  /** 0..1. Vượt quá 1 bị kẹp lại — vòng tròn là cái thước, không phải cái roi (SPEC.md §5.1). */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: ReactNode;
};

export function CircularProgress({
  progress,
  size = 220,
  strokeWidth = 8,
  color,
  trackColor = "rgba(0,0,0,0.08)",
  children,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
