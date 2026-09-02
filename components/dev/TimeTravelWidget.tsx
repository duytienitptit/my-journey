"use client";

import { useEffect, useState } from "react";

/**
 * Công cụ tua thời gian — SPEC.md §8.3. CHỈ mount khi dev (xem app/layout.tsx) — route
 * `/api/dev/clock` phía sau cũng tự 404 ở production, đây là lớp phòng thủ thứ hai (không hiện
 * UI mời bấm một thứ mà production sẽ từ chối).
 *
 * Đổi giờ xong RELOAD TRANG THẬT (không router.refresh()) — trang chính là Server Component
 * đọc now() lúc render, phải tải lại từ đầu mới thấy đồng hồ mới.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function TimeTravelWidget() {
  const [nowIso, setNowIso] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/dev/clock")
      .then((r) => r.json())
      .then((d: { nowIso: string }) => setNowIso(d.nowIso));
  }, []);

  async function jump(deltaMs: number) {
    setPending(true);
    const current = await fetch("/api/dev/clock").then((r) => r.json() as Promise<{ nowMs: number }>);
    await fetch("/api/dev/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ms: current.nowMs + deltaMs }),
    });
    window.location.reload();
  }

  async function reset() {
    setPending(true);
    await fetch("/api/dev/clock", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] font-mono text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-black/80 px-3 py-1.5 text-white shadow-lg"
      >
        🕐 {nowIso ? new Date(nowIso).toLocaleString() : "…"}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-xl bg-black/80 p-3 text-white shadow-lg">
          <button disabled={pending} onClick={() => jump(DAY_MS)} className="rounded bg-white/10 px-2 py-1 text-left hover:bg-white/20">
            + 1 day
          </button>
          <button disabled={pending} onClick={() => jump(7 * DAY_MS)} className="rounded bg-white/10 px-2 py-1 text-left hover:bg-white/20">
            + 7 days
          </button>
          <button disabled={pending} onClick={() => jump(30 * DAY_MS)} className="rounded bg-white/10 px-2 py-1 text-left hover:bg-white/20">
            + 30 days
          </button>
          <button disabled={pending} onClick={reset} className="rounded bg-white/10 px-2 py-1 text-left hover:bg-white/20">
            Reset to real time
          </button>
        </div>
      )}
    </div>
  );
}
