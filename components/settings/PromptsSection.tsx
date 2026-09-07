"use client";

import { useState } from "react";
import { createPromptAction, deletePromptAction, updatePromptAction } from "@/app/actions/settings";
import { Card, CardHint, CardTitle } from "./Card";

type Prompt = { id: number; text: string; category: string | null };

/** Câu gợi ý nhật ký — SPEC.md §5.1/§5.6. `core/journalPrompt.ts` xoay vòng đều theo ngày (không
 *  ngẫu nhiên), nên thêm/xoá câu ở đây làm đổi lịch xoay vòng — biết trước, không phải lỗi. */
export function PromptsSection({ prompts, onChanged }: { prompts: Prompt[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);

  const visible = expanded ? prompts : prompts.slice(0, 5);

  async function saveEdit(id: number) {
    if (!editText.trim()) return;
    setPending(true);
    try {
      await updatePromptAction(id, editText);
      setEditingId(null);
      onChanged();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: number) {
    await deletePromptAction(id);
    onChanged();
  }

  async function handleAdd() {
    if (!newText.trim()) return;
    setPending(true);
    try {
      await createPromptAction(newText);
      setNewText("");
      setAdding(false);
      onChanged();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardTitle>Journal prompts ({prompts.length})</CardTitle>
      <div className="flex flex-col gap-1.5">
        {visible.map((p) => (
          <div key={p.id} className="flex items-start gap-2 py-1">
            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  className="min-w-0 flex-1 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm"
                  autoFocus
                />
                <div className="flex shrink-0 flex-col gap-1 text-xs">
                  <button onClick={() => saveEdit(p.id)} disabled={pending} className="font-semibold text-foreground">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-foreground/40">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="flex-1 text-sm text-foreground/80">{p.text}</p>
                <span className="flex shrink-0 gap-2 text-xs text-foreground/40">
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditText(p.text);
                    }}
                    className="hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="hover:text-foreground">
                    Delete
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
      {prompts.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="self-start text-xs text-foreground/40 hover:text-foreground"
        >
          {expanded ? "Show fewer" : `Show all ${prompts.length}`}
        </button>
      )}
      {adding ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-muted p-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={2}
            placeholder="A new journal prompt…"
            className="rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setAdding(false);
                setNewText("");
              }}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={pending || !newText.trim()}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background transition-transform active:scale-95 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="self-start text-xs font-semibold text-foreground/50 hover:text-foreground"
        >
          + Add prompt
        </button>
      )}
      <CardHint>One rotates in each evening by date, not at random.</CardHint>
    </Card>
  );
}
