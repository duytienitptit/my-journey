import { describe, expect, it } from "vitest";
import { canCheckBedtime, assertEditableDay } from "../../core/bedtime";
import type { DayKey } from "../../core/types";

const day = "2026-09-30" as DayKey;
describe("bedtime check-in — Vietnam time", () => {
  it("allows 22:29:59 but rejects 22:30 exactly", () => {
    expect(canCheckBedtime(day, Date.parse("2026-09-30T22:29:59.999+07:00"))).toBe(true);
    expect(canCheckBedtime(day, Date.parse("2026-09-30T22:30:00+07:00"))).toBe(false);
  });
  it("does not reopen after midnight or allow yesterday/future dates", () => {
    expect(canCheckBedtime(day, Date.parse("2026-10-01T02:00:00+07:00"))).toBe(false);
    expect(canCheckBedtime(day, Date.parse("2026-10-01T08:00:00+07:00"))).toBe(false);
    expect(canCheckBedtime(day, Date.parse("2026-09-29T20:00:00+07:00"))).toBe(false);
  });
  it("retains today/yesterday editing for the other evening fields", () => {
    const now = Date.parse("2026-10-01T02:00:00+07:00");
    expect(() => assertEditableDay(day, now)).not.toThrow();
    expect(() => assertEditableDay("2026-09-29" as DayKey, now)).not.toThrow();
    expect(() => assertEditableDay("2026-10-01" as DayKey, now)).toThrow();
  });
});
