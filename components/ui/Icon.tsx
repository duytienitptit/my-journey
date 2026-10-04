import type { CSSProperties } from "react";

export type IconName = "leaf" | "mind" | "health" | "spirit" | "settings" | "play" | "check" | "bed" | "book";

const paths: Record<IconName, React.ReactNode> = {
  leaf: <><path d="M19 3C10 3 4 6 4 13a7 7 0 0 0 7 7c7 0 9-8 8-17Z" /><path d="m3 22 12-13" /></>,
  mind: <><path d="M12 5c-1-4-7-2-6 2-4 0-5 6-2 8-1 5 5 8 8 4V5Zm0 0c1-4 7-2 6 2 4 0 5 6 2 8 1 5-5 8-8 4" /><path d="m6 7 2 3m-4 5 4-1m10-7-2 3m4 5-4-1" /></>,
  health: <><circle cx="15" cy="4" r="2"/><path d="m11 8 4 3 5-1M6 11l5-3-2 7 5 3-1 4m-4-7-4 5H2" /></>,
  spirit: <><path d="M19 3C10 3 4 6 4 13a7 7 0 0 0 7 7c7 0 9-8 8-17Z"/><path d="m3 22 12-13"/></>,
  settings: <><path d="m10 2-1 3-3 1-3-1-2 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></>,
  play: <path d="m7 3 14 9-14 9Z"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  bed: <><path d="M3 4v17m18-8v8M3 17h18M3 8h6v9m0-7h8a4 4 0 0 1 4 4v3"/><circle cx="6" cy="12" r="1"/></>,
  book: <><path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1v16"/></>,
};

export function Icon({ name, size = 22, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "play" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>;
}
