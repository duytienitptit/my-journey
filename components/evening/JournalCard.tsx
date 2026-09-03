"use client";

import { useRef, useState } from "react";
import { IMPORTANT_QUESTIONS, composeJournalText, parseJournalText } from "@/core/journalCompose";

type Props = {
  prompt: { id: number; text: string } | null;
  value: string;
  onSave: (text: string) => void;
};

const AUTO_SAVE_DELAY_MS = 800;

/**
 * Nhật ký — SPEC.md §5.1. Ba câu hỏi quan trọng CỐ ĐỊNH (`core/journalCompose.ts`, không xoay
 * vòng) mỗi câu một ô riêng, cộng câu gợi ý xoay vòng mỗi ngày (`journalPrompt.ts`) + ô viết tự
 * do — bốn ô độc lập trên MÀN HÌNH, nhưng lưu xuống DB gộp chung thành MỘT chuỗi `journalText`
 * duy nhất qua `composeJournalText` (không thêm cột/bảng nào, [CHỐT — 2026-09-03]).
 *
 * Đổi ngày (Hôm nay ⇄ Hôm qua) không tự đồng bộ `value` qua effect — component này dựng lại
 * hoàn toàn khi đổi ngày (cha truyền `key={dayKey}`), nên `useState(...)` lấy giá trị ban đầu
 * bằng `parseJournalText(value)` một lần lúc mount là đủ. Tránh mẫu
 * "useEffect(() => setX(value), [value])" — cascading render không cần thiết.
 */
export function JournalCard({ prompt, value, onSave }: Props) {
  const [answers, setAnswers] = useState<string[]>(() => [...parseJournalText(value).answers]);
  const [freeText, setFreeText] = useState(() => parseJournalText(value).freeText);
  const saveTimeout = useRef<number | undefined>(undefined);

  function scheduleSave(nextAnswers: readonly string[], nextFreeText: string) {
    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      onSave(composeJournalText({ answers: nextAnswers, freeText: nextFreeText }));
    }, AUTO_SAVE_DELAY_MS);
  }

  function saveNow(nextAnswers: readonly string[], nextFreeText: string) {
    window.clearTimeout(saveTimeout.current);
    onSave(composeJournalText({ answers: nextAnswers, freeText: nextFreeText }));
  }

  function handleAnswerChange(index: number, next: string) {
    const nextAnswers = answers.map((a, i) => (i === index ? next : a));
    setAnswers(nextAnswers);
    scheduleSave(nextAnswers, freeText);
  }

  function handleFreeTextChange(next: string) {
    setFreeText(next);
    scheduleSave(answers, next);
  }

  function handleBlur() {
    saveNow(answers, freeText);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {IMPORTANT_QUESTIONS.map((question, i) => (
          <div key={question} className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground/70">{question}</p>
            <textarea
              value={answers[i] ?? ""}
              onChange={(e) => handleAnswerChange(i, e.target.value)}
              onBlur={handleBlur}
              placeholder="Write anything."
              rows={2}
              className="w-full resize-none rounded-2xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {prompt && <p className="text-sm italic text-foreground/50">{prompt.text}</p>}
        <textarea
          value={freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write anything."
          rows={8}
          className="w-full resize-none rounded-2xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>
    </div>
  );
}
