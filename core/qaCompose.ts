/**
 * Cơ chế dùng CHUNG: gộp nhiều câu hỏi cố định + một ô tự do thành một chuỗi text DUY NHẤT,
 * round-trip được — dùng cho cả nhật ký hằng ngày (`journalCompose.ts`, SPEC.md §5.1) và đúc kết
 * tuần (`weekReviewCompose.ts`, SPEC.md §5.2). Tách ra đây vì đây là một THUẬT TOÁN thật (không
 * chỉ vài dòng giống nhau) — hai nơi dùng cùng logic thì sửa một chỗ, không nhân đôi.
 *
 * Định dạng: mỗi câu hỏi có chữ thành một khối `Q: <câu hỏi>\nA: <trả lời>`, các khối + phần tự
 * do cách nhau bằng dòng trống. Dùng ĐÚNG câu hỏi làm mốc tìm-thay lúc tách lại — đổi câu hỏi ở
 * nơi gọi thì bản ghi cũ (đúc bằng câu hỏi trước) không còn khớp, toàn bộ rơi vào phần tự do
 * (không mất chữ, chỉ không tách được đúng ô nữa — chấp nhận đánh đổi vì đổi câu hỏi là việc hiếm).
 */
export type ComposedAnswers = {
  /** Trả lời từng câu hỏi, CÙNG THỨ TỰ với mảng câu hỏi truyền vào — "" nếu bỏ trống. */
  answers: readonly string[];
  /** Phần còn lại — viết tự do. */
  freeText: string;
};

function questionBlock(question: string, answer: string): string {
  return `Q: ${question}\nA: ${answer}`;
}

export function composeQaText(questions: readonly string[], { answers, freeText }: ComposedAnswers): string {
  const blocks = questions
    .map((q, i) => (answers[i]?.trim() ? questionBlock(q, answers[i]) : null))
    .filter((b): b is string => b !== null);
  const free = freeText.trim();
  return [...blocks, ...(free ? [free] : [])].join("\n\n");
}

export function parseQaText(questions: readonly string[], text: string): ComposedAnswers {
  let rest = text;
  const answers = questions.map((question) => {
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

/** Đếm từ — tách theo khoảng trắng, bỏ chuỗi rỗng. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}
