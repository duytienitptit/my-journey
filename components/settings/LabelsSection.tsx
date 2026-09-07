"use client";

import { useState } from "react";
import { archiveLabelAction, createLabelAction, updateLabelAction } from "@/app/actions/settings";
import type { StatKey } from "@/core/types";
import { Card, CardHint, CardTitle } from "./Card";
import { STAT_META, StatPicker } from "./StatPicker";

type Label = { id: number; name: string; emoji: string; color: string; stat: StatKey };

function LabelForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Label | null;
  onCancel: () => void;
  onSave: (name: string, emoji: string, color: string, stat: StatKey) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🏷️");
  const [color, setColor] = useState(initial?.color ?? "#8b8bf0");
  const [stat, setStat] = useState<StatKey>(initial?.stat ?? "mind");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setPending(true);
    try {
      await onSave(name, emoji, color, stat);
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
          placeholder="Label name"
          className="min-w-0 flex-1 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm"
          autoFocus
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Color"
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-foreground/10 bg-background"
        />
      </div>
      <StatPicker value={stat} onChange={setStat} />
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
 * Nhãn — SPEC.md §4.2/§5.6. Sửa/thêm/lưu trữ. Lưu trữ KHÔNG xoá thật (khoá ngoại từ sessions,
 * xem archiveLabel trong db/queries.ts) — chỉ ẩn khỏi mọi danh sách chọn + tự gỡ khỏi 6 việc.
 */
export function LabelsSection({ labels, onChanged }: { labels: Label[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);

  async function handleArchive(id: number) {
    await archiveLabelAction(id);
    setConfirmArchiveId(null);
    onChanged();
  }

  return (
    <Card>
      <CardTitle>Labels</CardTitle>
      <div className="flex flex-col gap-1.5">
        {labels.map((l) =>
          editingId === l.id ? (
            <LabelForm
              key={l.id}
              initial={l}
              onCancel={() => setEditingId(null)}
              onSave={async (name, emoji, color, stat) => {
                await updateLabelAction(l.id, name, emoji, color, stat);
                setEditingId(null);
                onChanged();
              }}
            />
          ) : (
            <div key={l.id} className="flex items-center gap-2 py-1">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-base">{l.emoji}</span>
              <span className="flex-1 truncate text-sm font-medium text-foreground">{l.name}</span>
              <span className="text-xs text-foreground/40">{STAT_META[l.stat].emoji}</span>
              {confirmArchiveId === l.id ? (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="text-foreground/50">Archive?</span>
                  <button onClick={() => handleArchive(l.id)} className="font-semibold text-foreground">
                    Yes
                  </button>
                  <button onClick={() => setConfirmArchiveId(null)} className="text-foreground/40">
                    No
                  </button>
                </span>
              ) : (
                <span className="flex gap-2.5 text-xs text-foreground/40">
                  <button onClick={() => setEditingId(l.id)} className="hover:text-foreground">
                    Edit
                  </button>
                  <button onClick={() => setConfirmArchiveId(l.id)} className="hover:text-foreground">
                    Archive
                  </button>
                </span>
              )}
            </div>
          ),
        )}
      </div>

      {editingId === "new" ? (
        <LabelForm
          initial={null}
          onCancel={() => setEditingId(null)}
          onSave={async (name, emoji, color, stat) => {
            await createLabelAction(name, emoji, color, stat);
            setEditingId(null);
            onChanged();
          }}
        />
      ) : (
        <button
          onClick={() => setEditingId("new")}
          className="self-start text-xs font-semibold text-foreground/50 hover:text-foreground"
        >
          + Add label
        </button>
      )}
      <CardHint>A label is what you pick before starting the pomodoro timer.</CardHint>
    </Card>
  );
}
