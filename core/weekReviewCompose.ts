/**
 * Câu hỏi quan trọng mỗi TUẦN — SPEC.md §5.2, [THÊM — 2026-09-05]. Chủ dự án khen câu hỏi gốc
 * ("What stood out...") tốt cho tinh thần, muốn thêm câu hỏi nữa và gộp chung — ĐÚNG cơ chế đã
 * dùng cho nhật ký hằng ngày (`journalCompose.ts`), tái dùng thuật toán gộp/tách ở `qaCompose.ts`.
 *
 * Câu chữ ở đây là BẢN NHÁP ĐẦU — chưa qua vòng duyệt riêng như câu trách móc (§4.12), chủ dự án
 * xem trực tiếp trên trình duyệt rồi góp ý sau, giống cách câu hỏi quan trọng của nhật ký đã làm.
 * Bốn câu, không hơn — đúc kết tuần chỉ một lần/tuần, không nên nặng như nhật ký hằng ngày.
 */
import { composeQaText, parseQaText, type ComposedAnswers } from "./qaCompose";

export const IMPORTANT_WEEK_QUESTIONS: readonly string[] = [
  "What stood out this week? What will you do differently next week?",
  "What's a moment this week you're proud of, even a small one?",
  "What pattern do you want to repeat — or break — next week?",
  "Looking at Mind, Health, and Spirit this week, which one needs more of your attention next week?",
];

export function composeWeekReviewText(input: ComposedAnswers): string {
  return composeQaText(IMPORTANT_WEEK_QUESTIONS, input);
}

export function parseWeekReviewText(text: string): ComposedAnswers {
  return parseQaText(IMPORTANT_WEEK_QUESTIONS, text);
}
