/**
 * Câu hỏi quan trọng mỗi ngày (SPEC.md §5.1, [CHỐT — 2026-09-03]) — cố định, KHÔNG xoay vòng
 * (khác `journalPrompt.ts`). Mỗi câu có ô trả lời riêng trong `JournalCard`, nhưng lưu xuống
 * CÙNG một trường `journalText` — không thêm cột/bảng DB nào (đúng cơ chế đã chọn: "gộp vào
 * nhật ký, không đổi cấu trúc DB"). `composeJournalText`/`parseJournalText` là một cặp
 * encode/decode thuần, round-trip được — không phải chỉ ghi một chiều.
 *
 * Đổi câu chữ ở đây thì ngày cũ đã lưu (đúc bằng câu chữ trước) sẽ không còn khớp để tách lại
 * — `parseJournalText` không tìm thấy sẽ coi cả khối là "văn bản tự do", không mất chữ, chỉ
 * không tách được về đúng ô nữa. Đổi câu hỏi là việc hiếm, chấp nhận đánh đổi này.
 */
export const IMPORTANT_QUESTIONS: readonly string[] = [
  "Which of Mind, Health, or Spirit did you neglect most today — and why?",
  "What's one thing you did today that your future self will thank you for?",
  "What decision are you postponing that you already know the answer to?",
];

type Composed = {
  /** Trả lời từng câu hỏi quan trọng, cùng thứ tự với IMPORTANT_QUESTIONS — "" nếu bỏ trống. */
  answers: readonly string[];
  /** Phần còn lại — câu gợi ý xoay vòng, viết tự do. */
  freeText: string;
};

function questionBlock(question: string, answer: string): string {
  return `Q: ${question}\nA: ${answer}`;
}

/** Ghép các câu trả lời quan trọng + văn bản tự do thành một chuỗi `journalText` duy nhất. */
export function composeJournalText({ answers, freeText }: Composed): string {
  const blocks = IMPORTANT_QUESTIONS.map((q, i) => (answers[i]?.trim() ? questionBlock(q, answers[i]) : null)).filter(
    (b): b is string => b !== null,
  );
  const free = freeText.trim();
  return [...blocks, ...(free ? [free] : [])].join("\n\n");
}

/**
 * Ngược lại `composeJournalText` — tách một `journalText` đã lưu thành từng câu trả lời quan
 * trọng (nếu tìm thấy đúng khối "Q: <câu hỏi hiện tại>\nA: ...") + phần còn lại. Ngày cũ chưa
 * từng có câu hỏi quan trọng (viết trước khi có tính năng này, hoặc câu hỏi đã đổi) → không
 * khối nào khớp → toàn bộ text rơi vào `freeText`, không mất chữ.
 */
export function parseJournalText(journalText: string): Composed {
  let rest = journalText;
  const answers = IMPORTANT_QUESTIONS.map((question) => {
    const prefix = `Q: ${question}\nA: `;
    const start = rest.indexOf(prefix);
    if (start === -1) return "";
    const afterPrefix = start + prefix.length;
    // Khối kết thúc ở "\n\n" tiếp theo (ranh giới giữa các khối) hoặc hết chuỗi.
    const end = rest.indexOf("\n\n", afterPrefix);
    const answer = end === -1 ? rest.slice(afterPrefix) : rest.slice(afterPrefix, end);
    const blockEnd = end === -1 ? rest.length : end + 2; // +2 bỏ luôn "\n\n" phân cách
    rest = rest.slice(0, start) + rest.slice(blockEnd);
    return answer;
  });
  return { answers, freeText: rest.trim() };
}

/** Đếm từ — tách theo khoảng trắng, bỏ chuỗi rỗng. Dùng cho ngưỡng "Close day" (JOURNAL_MIN_WORDS). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}
