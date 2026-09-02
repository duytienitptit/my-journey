import { describe, expect, it } from "vitest";
import { isSessionComplete, secondsRemaining, sessionEndsAt } from "../../core/session";
import type { RunningSession } from "../../core/session";

describe("core/session — sessionEndsAt", () => {
  it("cộng đúng số phút thành mili-giây", () => {
    expect(sessionEndsAt(1000, 25)).toBe(1000 + 25 * 60_000);
  });
});

describe("core/session — secondsRemaining", () => {
  const session: RunningSession = { labelId: "english", startedAt: 0, endsAt: 100_000 };

  it("còn nguyên phiên → xấp xỉ tổng thời lượng", () => {
    expect(secondsRemaining(session, 0)).toBe(100);
  });

  it("giữa phiên → làm tròn LÊN giây (còn hiện '1 giây' cho tới khi thực sự hết)", () => {
    expect(secondsRemaining(session, 99_001)).toBe(1); // còn 999ms vẫn hiện 1s, không hiện 0s
  });

  it("đúng lúc hết → 0", () => {
    expect(secondsRemaining(session, 100_000)).toBe(0);
  });

  it("không bao giờ âm, kể cả khi now() vượt xa endsAt (đọc lại sau khi bỏ quên tab)", () => {
    expect(secondsRemaining(session, 500_000)).toBe(0);
  });
});

describe("core/session — isSessionComplete", () => {
  const session: RunningSession = { labelId: "english", startedAt: 0, endsAt: 100_000 };

  it("chưa tới mốc kết thúc → chưa hoàn thành", () => {
    expect(isSessionComplete(session, 99_999)).toBe(false);
  });

  it("đúng mốc kết thúc → hoàn thành", () => {
    expect(isSessionComplete(session, 100_000)).toBe(true);
  });

  it("đọc lại rất lâu sau khi hết (bỏ quên tab nhiều ngày) → vẫn hoàn thành, không có hạn (§11.2 R6)", () => {
    const fiveDaysLater = 100_000 + 5 * 24 * 60 * 60 * 1000;
    expect(isSessionComplete(session, fiveDaysLater)).toBe(true);
  });
});
