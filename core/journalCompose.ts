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

/** Ghép các câu trả lời quan trọng + văn bản tự do thành một chuỗi `journalText` duy nhất. */
export function composeJournalText(input: ComposedAnswers): string {
  return composeQaText(IMPORTANT_QUESTIONS, input);
}

/** Ngược lại `composeJournalText` — xem ghi chú round-trip trong `qaCompose.ts`. */
export function parseJournalText(journalText: string): ComposedAnswers {
  return parseQaText(IMPORTANT_QUESTIONS, journalText);
}

/** Dùng cho ngưỡng "Close day" (JOURNAL_MIN_WORDS) — tái xuất từ qaCompose.ts. */
export { countWords };
