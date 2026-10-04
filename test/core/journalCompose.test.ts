import { describe, expect, it } from "vitest";
import { IMPORTANT_QUESTIONS, composeJournalText, countJournalWords, countWords, parseJournalText } from "../../core/journalCompose";

describe("composeJournalText", () => {
  it("ghép cả 3 câu trả lời + văn bản tự do, phân cách bằng dòng trống", () => {
    const text = composeJournalText({
      answers: ["a1", "a2", "a3"],
      freeText: "free text here",
    });
    expect(text).toBe(
      `Q: ${IMPORTANT_QUESTIONS[0]}\nA: a1\n\n` +
        `Q: ${IMPORTANT_QUESTIONS[1]}\nA: a2\n\n` +
        `Q: ${IMPORTANT_QUESTIONS[2]}\nA: a3\n\n` +
        `free text here`,
    );
  });

  it("bỏ qua câu hỏi chưa trả lời (rỗng hoặc chỉ khoảng trắng) — không tạo khối rỗng", () => {
    const text = composeJournalText({ answers: ["a1", "", "   "], freeText: "" });
    expect(text).toBe(`Q: ${IMPORTANT_QUESTIONS[0]}\nA: a1`);
  });

  it("không trả lời câu nào, chỉ có văn bản tự do → giữ nguyên như JournalCard cũ", () => {
    const text = composeJournalText({ answers: ["", "", ""], freeText: "hello" });
    expect(text).toBe("hello");
  });

  it("không có gì cả → chuỗi rỗng", () => {
    expect(composeJournalText({ answers: ["", "", ""], freeText: "" })).toBe("");
  });

  it("thiếu phần tử trong mảng answers (ngắn hơn IMPORTANT_QUESTIONS) không throw", () => {
    expect(() => composeJournalText({ answers: ["a1"], freeText: "" })).not.toThrow();
  });
});

describe("parseJournalText — ngược lại composeJournalText, round-trip được", () => {
  it("tách đúng cả 3 câu trả lời + phần tự do từ một chuỗi đã ghép", () => {
    const composed = composeJournalText({ answers: ["a1", "a2", "a3"], freeText: "free text here" });
    const parsed = parseJournalText(composed);
    expect(parsed.answers).toEqual(["a1", "a2", "a3"]);
    expect(parsed.freeText).toBe("free text here");
  });

  it("tách đúng khi chỉ trả lời một câu ở giữa (câu 1 và 3 bỏ trống)", () => {
    const composed = composeJournalText({ answers: ["", "a2", ""], freeText: "free" });
    const parsed = parseJournalText(composed);
    expect(parsed.answers).toEqual(["", "a2", ""]);
    expect(parsed.freeText).toBe("free");
  });

  it("chuỗi cũ chưa từng có câu hỏi quan trọng (viết trước khi có tính năng này) → toàn bộ rơi vào freeText, không mất chữ", () => {
    const oldText = "Hôm nay tôi đã học xong bài React, cảm thấy khá ổn.";
    const parsed = parseJournalText(oldText);
    expect(parsed.answers).toEqual(["", "", ""]);
    expect(parsed.freeText).toBe(oldText);
  });

  it("chuỗi rỗng → mọi thứ rỗng, không throw", () => {
    const parsed = parseJournalText("");
    expect(parsed.answers).toEqual(["", "", ""]);
    expect(parsed.freeText).toBe("");
  });

  it("round-trip qua nhiều vòng compose→parse→compose không làm trôi dữ liệu", () => {
    const original = { answers: ["một", "hai ba", "bốn"], freeText: "năm sáu bảy" };
    const composed1 = composeJournalText(original);
    const parsed1 = parseJournalText(composed1);
    const composed2 = composeJournalText(parsed1);
    expect(composed2).toBe(composed1);
  });

  it("câu trả lời chứa nhiều dòng vẫn tách đúng (không bị cắt ở dòng đầu)", () => {
    const composed = composeJournalText({ answers: ["dòng một\ndòng hai", "", ""], freeText: "" });
    const parsed = parseJournalText(composed);
    expect(parsed.answers[0]).toBe("dòng một\ndòng hai");
  });
});

describe("countWords", () => {
  it("đếm đúng số từ, tách theo khoảng trắng bất kỳ", () => {
    expect(countWords("một hai ba")).toBe(3);
    expect(countWords("một   hai\nba\tbốn")).toBe(4);
  });

  it("chuỗi rỗng hoặc chỉ khoảng trắng = 0 từ", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("khoảng trắng thừa ở đầu/cuối không tính là từ", () => {
    expect(countWords("  một hai  ")).toBe(2);
  });
});

describe("daily prompt and free writing", () => {
  const prompt = "What would make tomorrow gentler?";

  it("stores the rotating prompt answer and independent free journal in one text field", () => {
    const text = composeJournalText({ answers: ["mind", "thank myself", "a decision", "Sleep earlier"], freeText: "Today felt calm." }, prompt);
    expect(parseJournalText(text, prompt)).toEqual({ answers: ["mind", "thank myself", "a decision", "Sleep earlier"], freeText: "Today felt calm." });
    expect(text).toContain(`Q: ${prompt}\nA: Sleep earlier`);
  });

  it("keeps older unlabelled writing in the free journal instead of losing it", () => {
    const oldText = composeJournalText({ answers: ["old answer", "", ""], freeText: "My old free writing" });
    const parsed = parseJournalText(oldText, prompt);
    expect(parsed.answers).toEqual(["old answer", "", "", ""]);
    expect(parsed.freeText).toBe("My old free writing");
  });

  it("counts written words without counting fixed or rotating question text", () => {
    const text = composeJournalText({ answers: ["one two", "", "", "three"], freeText: "four five" }, prompt);
    expect(countJournalWords(text)).toBe(5);
    expect(countJournalWords("A plain older journal entry")).toBe(5);
  });
});
