"use client";

import { useRef, useState } from "react";

const AUTO_SAVE_DELAY_MS = 800;

/** Ô đúc kết tuần — SPEC.md §5.2. Không khoá lại (§11.2 câu Q16), lưu lại như nhật ký. */
export function WeekReviewCard({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(value);
  const saveTimeout = useRef<number | undefined>(undefined);

  function handleChange(next: string) {
    setText(next);
    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => onSave(next), AUTO_SAVE_DELAY_MS);
  }

  function handleBlur() {
    window.clearTimeout(saveTimeout.current);
    onSave(text);
  }

  return (
    <textarea
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      rows={5}
      placeholder="What stood out this week? What will you do differently next week?"
      className="w-full resize-none rounded-2xl border border-foreground/10 bg-background p-4 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
    />
  );
}
