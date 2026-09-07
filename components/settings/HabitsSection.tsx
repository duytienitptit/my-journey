"use client";

import { useState } from "react";
import { archiveHabitAction, createHabitAction, updateHabitAction } from "@/app/actions/settings";
import type { StatKey } from "@/core/types";
import { Card, CardHint, CardTitle } from "./Card";
import { STAT_META, StatPicker } from "./StatPicker";

type Habit = { id: number; name: string; emoji: string; stat: StatKey; kind: "score_1_5" | "boolean" | "journal" };

function HabitForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Habit | null;
  onCancel: () => void;
  onSave: (name: string, emoji: string, stat: StatKey) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "✅");
  const [stat, setStat] = useState<StatKey>(initial?.stat ?? "mind");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setPending(true);
    try {
      await onSave(name, emoji, stat);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface-muted p-3">
      <div className="flex gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-12 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-center text-sm"
          maxLength={4}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name"
          className="min-w-0 flex-1 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm"
          autoFocus
        />
      </div>
      <StatPicker value={stat} onChange={setStat} />
      {!initial && <CardHint>New habits are scored 1–5 each night, same as Sport and Sleep enough.</CardHint>}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="text-xs text-foreground/50 hover:text-foreground">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending || !name.trim()}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background transition-transform active:scale-95 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * Thói quen — SPEC.md §4.2/§5.6. Habit mới LUÔN kind="score_1_5" (§4.2 [CHỐT]: "tự chấm 1–5,
 * không phải tích Có/Không") — "journal" là kind đặc biệt của đúng một thói quen có sẵn
 * (nghi thức tối), không chọn được khi tạo mới; "boolean" định nghĩa trong schema nhưng
 * KHÔNG có đường render nào (EveningPanel chỉ vẽ thang 1–5 hoặc ô nhật ký) nên không lộ ra đây.
 */
export function HabitsSection({ habits, onChanged }: { habits: Habit[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);

  async function handleArchive(id: number) {
    await archiveHabitAction(id);
    setConfirmArchiveId(null);
    onChanged();
  }

  return (
    <Card>
      <CardTitle>Habits</CardTitle>
      <div className="flex flex-col gap-1.5">
        {habits.map((h) =>
          editingId === h.id ? (
            <HabitForm
              key={h.id}
              initial={h}
              onCancel={() => setEditingId(null)}
              onSave={async (name, emoji, stat) => {
                await updateHabitAction(h.id, name, emoji, stat);
                setEditingId(null);
                onChanged();
              }}
            />
          ) : (
            <div key={h.id} className="flex items-center gap-2 py-1">
              <span className="text-base">{h.emoji}</span>
              <span className="flex-1 truncate text-sm font-medium text-foreground">{h.name}</span>
              <span className="text-xs text-foreground/40">
                {h.kind === "journal" ? "written" : "1–5"} · {STAT_META[h.stat].emoji}
              </span>
              {confirmArchiveId === h.id ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-foreground/50">Archive?</span>
                  <button onClick={() => handleArchive(h.id)} className="font-semibold text-foreground">
                    Yes
                  </button>
                  <button onClick={() => setConfirmArchiveId(null)} className="text-foreground/40">
                    No
                  </button>
                </span>
              ) : (
                <span className="flex gap-2.5 text-xs text-foreground/40">
                  <button onClick={() => setEditingId(h.id)} className="hover:text-foreground">
                    Edit
                  </button>
                  <button onClick={() => setConfirmArchiveId(h.id)} className="hover:text-foreground">
                    Archive
                  </button>
                </span>
              )}
            </div>
          ),
        )}
      </div>

      {editingId === "new" ? (
        <HabitForm
          initial={null}
          onCancel={() => setEditingId(null)}
          onSave={async (name, emoji, stat) => {
            await createHabitAction(name, emoji, stat);
            setEditingId(null);
            onChanged();
          }}
        />
      ) : (
        <button
          onClick={() => setEditingId("new")}
          className="self-start text-xs font-semibold text-foreground/50 hover:text-foreground"
        >
          + Add habit
        </button>
      )}
      <CardHint>A habit is what you score yourself on every evening.</CardHint>
    </Card>
  );
}
