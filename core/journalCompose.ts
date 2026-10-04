/**
 * Câu hỏi quan trọng mỗi ngày (SPEC.md §5.1, [CHỐT — 2026-09-03]) — cố định, KHÔNG xoay vòng
 * (khác `journalPrompt.ts`). Mỗi câu có ô trả lời riêng trong `JournalCard`, nhưng lưu xuống
 * CÙNG một trường `journalText` — không thêm cột/bảng DB nào. Thuật toán gộp/tách thật nằm ở
 * `qaCompose.ts` (dùng chung với đúc kết tuần, `weekReviewCompose.ts`) — file này chỉ còn câu
 * hỏi + hai hàm mỏng gọi đúng bộ câu hỏi của nhật ký.
 */
import { composeQaText, countWords, parseQaText, type ComposedAnswers } from "./qaCompose";

export const IMPORTANT_QUESTIONS: readonly string[] = [
  "Which of Mind, Health, or Spirit did you neglect most today — and why?",
  "What's one thing you did today that your future self will thank you for?",
  "What decision are you postponing that you already know the answer to?",
];

/** A daily prompt, when present, has its own answer; free writing remains separate. */
function questionsFor(prompt?: string | null): readonly string[] {
  return prompt ? [...IMPORTANT_QUESTIONS, prompt] : IMPORTANT_QUESTIONS;
}

/** Ghép câu trả lời + văn bản tự do thành một chuỗi `journalText` duy nhất. */
export function composeJournalText(input: ComposedAnswers, prompt?: string | null): string {
  return composeQaText(questionsFor(prompt), input);
}

/** Ngược lại `composeJournalText` — xem ghi chú round-trip trong `qaCompose.ts`. */
export function parseJournalText(journalText: string, prompt?: string | null): ComposedAnswers {
  return parseQaText(questionsFor(prompt), journalText);
}

/** Only the user's own words count, never the displayed questions or Q/A markers. */
export function countJournalWords(journalText: string): number {
  return countWords(journalText.replace(/^Q: [^\n]*\nA: /gm, ""));
}

export { countWords };
