"use client";

import { useRef, useState } from "react";

type Props = {
  prompt: { id: number; text: string } | null;
  value: string;
  onSave: (text: string) => void;
};

const AUTO_SAVE_DELAY_MS = 800;

/**
 * Câu gợi ý đổi mỗi ngày ở trên, ô viết trắng ở dưới — SPEC.md §5.1. "Bỏ qua câu gợi ý được"
 * nghĩa là câu gợi ý chỉ là gợi ý: không có nút "bỏ qua" riêng, ô trắng luôn viết được ngay,
 * không cần đụng tới câu gợi ý trước.
 *
 * Đổi ngày (Hôm nay ⇄ Hôm qua) không tự đồng bộ `text` qua effect — component này dựng lại
 * hoàn toàn khi đổi ngày (cha truyền `key={dayKey}`), nên `useState(value)` ban đầu đã đúng.
 * Tránh mẫu "useEffect(() => setText(value), [value])" — cascading render không cần thiết.
 */
export function JournalCard({ prompt, value, onSave }: Props) {
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
    <div className="flex flex-col gap-2">
      {prompt && <p className="text-sm italic text-foreground/50">{prompt.text}</p>}
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write anything."
        rows={4}
        className="w-full resize-none rounded-2xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
    </div>
  );
}
