"use client";

import { useRef, useState } from "react";
import { IMPORTANT_WEEK_QUESTIONS, composeWeekReviewText, parseWeekReviewText } from "@/core/weekReviewCompose";

const AUTO_SAVE_DELAY_MS = 800;

/**
 * Ô đúc kết tuần — SPEC.md §5.2, [THÊM — 2026-09-05]. Bốn câu hỏi cố định (không xoay vòng,
 * `core/weekReviewCompose.ts`) mỗi câu một ô riêng + một ô tự do — cùng cơ chế đã dùng cho nhật
 * ký hằng ngày (`JournalCard.tsx`): độc lập trên MÀN HÌNH, gộp chung xuống MỘT chuỗi
 * `week_reviews.text` qua `composeWeekReviewText`, không đổi cấu trúc DB. Không khoá lại (§11.2
 * câu Q16) — sửa được nhiều lần trong tuần.
 */
export function WeekReviewCard({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [answers, setAnswers] = useState<string[]>(() => [...parseWeekReviewText(value).answers]);
  const [freeText, setFreeText] = useState(() => parseWeekReviewText(value).freeText);
  const saveTimeout = useRef<number | undefined>(undefined);

  function scheduleSave(nextAnswers: readonly string[], nextFreeText: string) {
    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      onSave(composeWeekReviewText({ answers: nextAnswers, freeText: nextFreeText }));
    }, AUTO_SAVE_DELAY_MS);
  }

  function saveNow(nextAnswers: readonly string[], nextFreeText: string) {
    window.clearTimeout(saveTimeout.current);
    onSave(composeWeekReviewText({ answers: nextAnswers, freeText: nextFreeText }));
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
    <div className="flex flex-col gap-4">
      {IMPORTANT_WEEK_QUESTIONS.map((question, i) => (
        <div key={question} className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground/70">{question}</p>
          <textarea
            value={answers[i] ?? ""}
            onChange={(e) => handleAnswerChange(i, e.target.value)}
            onBlur={handleBlur}
            placeholder="Write anything."
            rows={2}
            className="w-full resize-none rounded-2xl border border-foreground/10 bg-background p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground/70">Anything else?</p>
        <textarea
          value={freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write anything."
          rows={4}
          className="w-full resize-none rounded-2xl border border-foreground/10 bg-background p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>
    </div>
  );
}
