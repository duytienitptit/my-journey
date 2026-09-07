"use client";

import { useMemo, useState } from "react";
import { addDailyTaskAction, removeDailyTaskAction, updateDailyTaskThresholdAction } from "@/app/actions/settings";
import type { DailyTaskWithRef } from "@/db/queries";
import { DAY_ACHIEVED_REQUIRED_COUNT } from "@/core/balance";
import type { StatKey } from "@/core/types";
import { Card, CardHint, CardTitle } from "./Card";
import { STAT_META } from "./StatPicker";

const WEEKDAY_REQUIRED = DAY_ACHIEVED_REQUIRED_COUNT[1]; // Thứ 2 → Thứ 6 dùng chung một số (§4.5)
const SATURDAY_REQUIRED = DAY_ACHIEVED_REQUIRED_COUNT[6];

type Ref = { id: number; name: string; emoji: string; stat: StatKey };

type Props = {
  dailyTasks: DailyTaskWithRef[];
  labels: Ref[];
  habits: (Ref & { kind: "score_1_5" | "boolean" | "journal" })[];
  onChanged: () => void;
};

function ThresholdCell({ task, onChanged }: { task: DailyTaskWithRef; onChanged: () => void }) {
  const [value, setValue] = useState(String(task.threshold ?? ""));
  const [pending, setPending] = useState(false);

  if (task.habitKind === "journal") {
    return <span className="w-24 shrink-0 text-right text-xs text-foreground/40">has text</span>;
  }

  async function commit() {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      setValue(String(task.threshold ?? ""));
      return;
    }
    if (n === task.threshold) return;
    setPending(true);
    try {
      await updateDailyTaskThresholdAction(task.id, Math.round(n));
      onChanged();
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex w-24 shrink-0 items-center justify-end gap-1 text-xs text-foreground/50">
      <input
        type="number"
        min={1}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        className="w-12 rounded-lg border border-foreground/10 bg-background px-1.5 py-1 text-right text-xs disabled:opacity-50"
      />
      {task.refType === "label" ? "sess." : "score"}
    </span>
  );
}

/**
 * 6 việc trong ngày — SPEC.md §4.5/§12.4. Mỗi dòng là (nhãn HOẶC thói quen) + ngưỡng riêng.
 * Bấm "+" chọn từ nhãn/thói quen CHƯA có mặt trong danh sách (một ref chỉ nên xuất hiện một
 * lần — trộn hai lần cùng một nhãn sẽ đếm hai lần trong dayAchieved mà không có ý nghĩa gì thêm).
 */
export function DailyTasksSection({ dailyTasks, labels, habits, onChanged }: Props) {
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [pending, setPending] = useState(false);

  const usedKeys = useMemo(() => new Set(dailyTasks.map((t) => `${t.refType}:${t.refId}`)), [dailyTasks]);
  const availableLabels = labels.filter((l) => !usedKeys.has(`label:${l.id}`));
  const availableHabits = habits.filter((h) => !usedKeys.has(`habit:${h.id}`));
  const noneLeft = availableLabels.length === 0 && availableHabits.length === 0;

  const [selectedType, selectedIdStr] = selected.split(":");
  const selectedHabit = selectedType === "habit" ? availableHabits.find((h) => String(h.id) === selectedIdStr) : null;
  const isJournalSelection = selectedHabit?.kind === "journal";

  async function handleRemove(id: number) {
    await removeDailyTaskAction(id);
    onChanged();
  }

  async function handleAdd() {
    if (!selected) return;
    const [refType, refIdStr] = selected.split(":") as ["label" | "habit", string];
    const refId = Number(refIdStr);
    let threshold: number | null = null;
    if (!isJournalSelection) {
      const n = Number(newThreshold);
      if (!Number.isFinite(n) || n <= 0) return;
      threshold = Math.round(n);
    }
    setPending(true);
    try {
      await addDailyTaskAction(refType, refId, threshold);
      setAdding(false);
      setSelected("");
      setNewThreshold("");
      onChanged();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardTitle>Today&apos;s {dailyTasks.length === 6 ? "6 things" : `things (${dailyTasks.length})`}</CardTitle>
      <div className="flex flex-col gap-1.5">
        {dailyTasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2 py-1">
            <span className="text-base">{t.emoji}</span>
            <span className="flex-1 truncate text-sm font-medium text-foreground">{t.name}</span>
            <span className="text-xs text-foreground/40">{STAT_META[t.stat].emoji}</span>
            <ThresholdCell task={t} onChanged={onChanged} />
            <button
              onClick={() => handleRemove(t.id)}
              className="text-xs text-foreground/40 hover:text-foreground"
              title="Remove from today's 6"
            >
              Remove
            </button>
          </div>
        ))}
        {dailyTasks.length === 0 && (
          <p className="text-xs text-foreground/40">Nothing counts toward a &quot;day achieved&quot; right now.</p>
        )}
      </div>

      {adding ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-muted p-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Pick a label or habit…</option>
            {availableLabels.length > 0 && (
              <optgroup label="Labels">
                {availableLabels.map((l) => (
                  <option key={`label:${l.id}`} value={`label:${l.id}`}>
                    {l.emoji} {l.name}
                  </option>
                ))}
              </optgroup>
            )}
            {availableHabits.length > 0 && (
              <optgroup label="Habits">
                {availableHabits.map((h) => (
                  <option key={`habit:${h.id}`} value={`habit:${h.id}`}>
                    {h.emoji} {h.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selected && !isJournalSelection && (
            <label className="flex items-center justify-between gap-2 text-xs text-foreground/60">
              Threshold ({selectedType === "label" ? "sessions" : "score 1–5"})
              <input
                type="number"
                min={1}
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                placeholder="e.g. 4"
                className="w-20 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-right text-sm"
              />
            </label>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setAdding(false);
                setSelected("");
                setNewThreshold("");
              }}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={pending || !selected || (!isJournalSelection && !newThreshold)}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background transition-transform active:scale-95 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={noneLeft}
          className="self-start text-xs font-semibold text-foreground/50 hover:text-foreground disabled:opacity-40"
        >
          {noneLeft ? "All labels and habits are already in" : "+ Add to today's 6"}
        </button>
      )}
      <CardHint>
        Weekdays need {WEEKDAY_REQUIRED} of these done, Saturday needs {SATURDAY_REQUIRED}, Sunday only needs the
        journal — SPEC.md §4.5.
      </CardHint>
    </Card>
  );
}
