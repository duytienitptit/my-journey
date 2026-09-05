import { describe, expect, it } from "vitest";
import {
  IMPORTANT_WEEK_QUESTIONS,
  composeWeekReviewText,
  parseWeekReviewText,
} from "../../core/weekReviewCompose";
import { IMPORTANT_QUESTIONS, composeJournalText, parseJournalText } from "../../core/journalCompose";

describe("weekReviewCompose — bộ câu hỏi RIÊNG cho tuần, khác nhật ký hằng ngày", () => {
  it("đúng 4 câu, không trùng với IMPORTANT_QUESTIONS (nhật ký)", () => {
    expect(IMPORTANT_WEEK_QUESTIONS).toHaveLength(4);
    for (const q of IMPORTANT_WEEK_QUESTIONS) expect(IMPORTANT_QUESTIONS).not.toContain(q);
  });

  it("round-trip đầy đủ: ghép rồi tách lại đúng cả 4 câu trả lời + phần tự do", () => {
    const answers = ["stood out", "proud moment", "repeat pattern", "mind needs it"];
    const composed = composeWeekReviewText({ answers, freeText: "extra thoughts" });
    const parsed = parseWeekReviewText(composed);
    expect(parsed.answers).toEqual(answers);
    expect(parsed.freeText).toBe("extra thoughts");
  });

  it("bỏ trống hết, chỉ có tự do → giữ nguyên y hệt bản một-ô cũ, không đổi hành vi lưu", () => {
    const text = composeWeekReviewText({ answers: ["", "", "", ""], freeText: "just free text" });
    expect(text).toBe("just free text");
  });

  it("KHÔNG lẫn lộn với bộ câu hỏi nhật ký — parse chuỗi đúc bằng câu hỏi TUẦN qua hàm NHẬT KÝ thì không tách được câu nào, rơi hết vào tự do", () => {
    const weekText = composeWeekReviewText({
      answers: ["a", "b", "c", "d"],
      freeText: "",
    });
    const parsedAsJournal = parseJournalText(weekText);
    expect(parsedAsJournal.answers).toEqual(["", "", ""]);
    expect(parsedAsJournal.freeText).toBe(weekText);
  });

  it("ngược lại — chuỗi đúc bằng câu hỏi NHẬT KÝ qua hàm TUẦN cũng không tách nhầm", () => {
    const journalText = composeJournalText({ answers: ["x", "y", "z"], freeText: "" });
    const parsedAsWeek = parseWeekReviewText(journalText);
    expect(parsedAsWeek.answers).toEqual(["", "", "", ""]);
    expect(parsedAsWeek.freeText).toBe(journalText);
  });
});
