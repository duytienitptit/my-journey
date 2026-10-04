"use client";

import { useAutosave } from "@/components/useAutosave";
import { SaveStatus } from "@/components/SaveStatus";
import { IMPORTANT_WEEK_QUESTIONS, composeWeekReviewText, parseWeekReviewText } from "@/core/weekReviewCompose";

/**
 * Ô đúc kết tuần — SPEC.md §5.2, [THÊM — 2026-09-05]. Bốn câu hỏi cố định (không xoay vòng,
 * `core/weekReviewCompose.ts`) mỗi câu một ô riêng + một ô tự do — cùng cơ chế đã dùng cho nhật
 * ký hằng ngày (`JournalCard.tsx`): độc lập trên MÀN HÌNH, gộp chung xuống MỘT chuỗi
 * `week_reviews.text` qua `composeWeekReviewText`, không đổi cấu trúc DB. Không khoá lại (§11.2
 * câu Q16) — sửa được nhiều lần trong tuần.
 */
export function WeekReviewCard({ value, onSave, weekStart, embedded = false }: { value: string; onSave: (text: string) => Promise<void>; weekStart: string; embedded?: boolean }) {
  const draft = useAutosave(`myjourney:week-draft:${weekStart}`, parseWeekReviewText(value), async (next) => onSave(composeWeekReviewText(next)));
  const { answers, freeText } = draft.value;
  function handleAnswerChange(index: number, next: string) {
    draft.change({ answers: answers.map((answer, i) => i === index ? next : answer), freeText });
  }
  function handleFreeTextChange(next: string) { draft.change({ answers, freeText: next }); }
  function handleBlur() { void draft.flush(); }

  return (
    <div className={embedded ? "sunday-review-fields" : "flex flex-col gap-4"}>
      <SaveStatus status={draft.status} error={draft.error} onRetry={() => void draft.flush()} />
      <div className={embedded ? "week-free-writing" : "flex flex-col gap-1.5"}>
        <p className="text-sm font-medium text-foreground/70">Your own reflection</p>
        <textarea
          aria-label="Weekly free reflection"
          value={freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write freely about your week…"
          rows={4}
          className={embedded ? "journal-input" : "w-full resize-none rounded-2xl border border-foreground/10 bg-background p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"}
        />
      </div>
      {IMPORTANT_WEEK_QUESTIONS.map((question, i) => (
        <div key={question} className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground/70">{question}</p>
          <textarea
            aria-label={question}
            value={answers[i] ?? ""}
            onChange={(e) => handleAnswerChange(i, e.target.value)}
            onBlur={handleBlur}
            placeholder="Write anything."
            rows={2}
            className={embedded ? "journal-input" : "w-full resize-none rounded-2xl border border-foreground/10 bg-background p-3 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"}
          />
        </div>
      ))}
    </div>
  );
}
