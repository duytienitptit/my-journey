"use client";

import { useState } from "react";
import { treeStageNameForLevel } from "@/components/forest/growth";
import { useGrovePreview, type GrovePreviewOverride } from "./GrovePreviewContext";
import { TREE_STAGE_LEVEL_THRESHOLDS, TREE_STAGE_NAMES } from "@/core/balance";
import type { StatKey } from "@/core/types";

/**
 * Ô điều khiển "xem cây lúc lớn lên" — CHỈ DEV (mount có điều kiện ở `app/layout.tsx`, giống
 * `TimeTravelWidget`). Kéo ba thanh trượt là khu vườn ở màn chính đổi NGAY, không tải lại trang,
 * không đụng DB — xem `GrovePreviewContext.tsx` để hiểu vì sao chọn cách này thay vì seed dữ liệu.
 */

const STATS: readonly StatKey[] = ["mind", "health", "spirit"];
const STAT_LABEL: Record<StatKey, string> = { mind: "Mind", health: "Health", spirit: "Spirit" };

const DEFAULT_OVERRIDE: GrovePreviewOverride = {
  levelByStat: { mind: 0, health: 0, spirit: 0 },
  streak: 0,
  danger: false,
  neglectByStat: { mind: false, health: false, spirit: false },
};

export function GrovePreviewWidget() {
  const [expanded, setExpanded] = useState(true);
  const { override, setOverride } = useGrovePreview();
  const active = override !== null;
  const current = override ?? DEFAULT_OVERRIDE;

  function patch(next: Partial<GrovePreviewOverride>) {
    setOverride({ ...current, ...next });
  }

  function applyPreset(level: number) {
    setOverride({
      ...current,
      levelByStat: { mind: level, health: level, spirit: level },
    });
  }

  return (
    // Góc DƯỚI-TRÁI — mọi góc TRÊN đều đã có UI của TimerOverlay lúc tĩnh (dải chấm+chuỗi trái,
    // tài sản giữa, Backfill+nav phải, xem TimerOverlay.tsx); đây là chỗ trống duy nhất không
    // đụng thứ gì trong SPEC.md §5.1. Panel mở LÊN TRÊN (không phải xuống dưới màn hình) và tự
    // cuộn riêng (max-h + overflow) nếu màn thấp — mở xuống sẽ tràn khỏi khung nhìn vì nút neo
    // gần đáy.
    <div className="fixed bottom-4 left-4 z-[100] flex flex-col-reverse items-start font-mono text-xs">
      <button
        onClick={() => { if (active) setExpanded(!expanded); else { setOverride(DEFAULT_OVERRIDE); setExpanded(true); } }}
        className={`rounded-full px-3 py-1.5 text-white shadow-lg ${active ? "bg-emerald-700/90" : "bg-black/80"}`}
      >
        🌳 {active ? "Previewing growth" : "Preview growth"}
      </button>

      {active && expanded && (
        <div className="mb-2 flex max-h-[70vh] w-72 flex-col gap-3 overflow-y-auto rounded-xl bg-black/85 p-3 text-white shadow-lg">
          <div className="flex gap-2" role="group" aria-label="Preview lighting">
            <button onClick={() => patch({ theme: "light" })} className="rounded bg-white/10 px-2 py-1">Day light</button>
            <button onClick={() => patch({ theme: "dark" })} className="rounded bg-white/10 px-2 py-1">Night light</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {TREE_STAGE_NAMES.map((name, i) => (
              <button
                key={name}
                onClick={() => applyPreset(TREE_STAGE_LEVEL_THRESHOLDS[i])}
                className="rounded bg-white/10 px-1.5 py-1 hover:bg-white/20"
                title={`Set all three to level ${TREE_STAGE_LEVEL_THRESHOLDS[i]}`}
              >
                {name}
              </button>
            ))}
          </div>

          {STATS.map((stat) => (
            <label key={stat} className="flex flex-col gap-1">
              <span className="flex justify-between">
                <span>{STAT_LABEL[stat]}</span>
                <span className="text-white/60">
                  lvl {current.levelByStat[stat]} · {treeStageNameForLevel(current.levelByStat[stat])}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={30}
                value={current.levelByStat[stat]}
                onChange={(e) =>
                  patch({ levelByStat: { ...current.levelByStat, [stat]: Number(e.target.value) } })
                }
              />
              <span className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={current.neglectByStat[stat]}
                  onChange={(e) => patch({ neglectByStat: { ...current.neglectByStat, [stat]: e.target.checked } })}
                />
                wilting (about to lose XP)
              </span>
            </label>
          ))}

          <label className="flex flex-col gap-1 border-t border-white/15 pt-2">
            <span className="flex justify-between">
              <span>Streak</span>
              <span className="text-white/60">{current.streak} days</span>
            </span>
            <input
              type="range"
              min={0}
              max={7}
              value={current.streak}
              onChange={(e) => patch({ streak: Number(e.target.value) })}
            />
          </label>

          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={current.danger} onChange={(e) => patch({ danger: e.target.checked })} />
            streak in grace day (whole grove turns amber)
          </label>

          <button onClick={() => setOverride(null)} className="rounded bg-white/10 px-2 py-1 hover:bg-white/20">
            Stop previewing — show my real data
          </button>
        </div>
      )}
    </div>
  );
}
