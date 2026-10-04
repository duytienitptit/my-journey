"use client";

import { useEffect } from "react";
import { useAutosave, type SaveState } from "@/components/useAutosave";
import { SaveStatus } from "@/components/SaveStatus";
import { IMPORTANT_QUESTIONS, composeJournalText, parseJournalText } from "@/core/journalCompose";

type Props = {
  prompt: { id: number; text: string } | null;
  value: string;
  dayKey: string;
  onSave: (text: string) => Promise<void>;
  onSaveStateChange: (state: SaveState) => void;
};

/**
 * Nhật ký — SPEC.md §5.1. Ba câu hỏi quan trọng CỐ ĐỊNH (`core/journalCompose.ts`, không xoay
 * vòng) mỗi câu một ô riêng, cộng câu gợi ý xoay vòng mỗi ngày (`journalPrompt.ts`) + ô viết tự
 * do — năm ô độc lập trên MÀN HÌNH, nhưng lưu xuống DB gộp chung thành MỘT chuỗi `journalText`
 * duy nhất qua `composeJournalText` (không thêm cột/bảng nào, [CHỐT — 2026-09-03]).
 *
 * Đổi ngày (Hôm nay ⇄ Hôm qua) không tự đồng bộ `value` qua effect — component này dựng lại
 * hoàn toàn khi đổi ngày (cha truyền `key={dayKey}`), nên `useState(...)` lấy giá trị ban đầu
 * bằng `parseJournalText(value)` một lần lúc mount là đủ. Tránh mẫu
 * "useEffect(() => setX(value), [value])" — cascading render không cần thiết.
 */
export function JournalCard({ prompt, value, onSave, dayKey, onSaveStateChange }: Props) {
  const draft = useAutosave(`myjourney:journal-draft:${dayKey}`, parseJournalText(value, prompt?.text), async (next) => onSave(composeJournalText(next, prompt?.text)));
  const { answers, freeText } = draft.value;
  useEffect(() => { onSaveStateChange(draft.status); }, [draft.status, onSaveStateChange]);
  function handleAnswerChange(index: number, next: string) {
    draft.change({ answers: answers.map((answer, i) => i === index ? next : answer), freeText });
  }
  function handleFreeTextChange(next: string) { draft.change({ answers, freeText: next }); }
  function handleBlur() { void draft.flush(); }

  return (
    <div className="journal-editor">
      <SaveStatus status={draft.status} error={draft.error} onRetry={() => void draft.flush()} />
      <div className="journal-fields">
        <div className="journal-free-writing">
          <p>Free journal — write whatever is on your mind</p>
          <textarea
            aria-label="Free journal"
            value={freeText}
            onChange={(e) => handleFreeTextChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Your space to write freely…"
            rows={6}
            className="journal-input"
          />
        </div>
        {[...IMPORTANT_QUESTIONS, ...(prompt ? [prompt.text] : [])].map((question, i) => (
          <div key={question} className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground/70">{question}</p>
            <textarea
              aria-label={question}
              value={answers[i] ?? ""}
              onChange={(e) => handleAnswerChange(i, e.target.value)}
              onBlur={handleBlur}
              placeholder="Write anything."
              rows={4}
              className="journal-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
