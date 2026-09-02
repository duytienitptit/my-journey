import { describe, expect, it } from "vitest";
import { daySummaryLine } from "../../core/summary";

describe("core/summary — daySummaryLine", () => {
  it("chưa có phiên nào", () => {
    expect(daySummaryLine([])).toBe("No sessions yet today.");
  });

  it("một phiên — số ít 'session'", () => {
    expect(daySummaryLine([{ labelName: "Deep work" }])).toBe("1 session · mostly Deep work");
  });

  it("nhiều phiên cùng nhãn", () => {
    const sessions = Array.from({ length: 4 }, () => ({ labelName: "Deep work" }));
    expect(daySummaryLine(sessions)).toBe("4 sessions · mostly Deep work");
  });

  it("nhiều nhãn — chọn đúng nhãn nhiều nhất", () => {
    const sessions = [
      { labelName: "English" },
      { labelName: "Deep work" },
      { labelName: "Deep work" },
      { labelName: "Deep work" },
    ];
    expect(daySummaryLine(sessions)).toBe("4 sessions · mostly Deep work");
  });
});
