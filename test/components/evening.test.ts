// @vitest-environment happy-dom
import { useState } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EveningData } from "../../app/actions/evening";
import type { DayKey } from "../../core/types";
import { useEveningRitual } from "../../components/evening/useEveningRitual";

const actions = vi.hoisted(() => ({ getEveningDataAction: vi.fn(), closeDayAction: vi.fn(), saveJournalAction: vi.fn(), saveMoodAction: vi.fn(), saveHabitScoreAction: vi.fn() }));
vi.mock("../../app/actions/evening", () => actions);
const day = "2026-09-30" as DayKey;
function data(): EveningData {
  return { dayKey: day, summaryLine: "", mood: null, journalText: "", journalPrompt: null, closedAt: null,
    checkIn: [{ kind: "label", stat: "mind", labelId: 1, name: "English", emoji: "", count: 0, manualCount: 0, threshold: 4, done: false }, { kind: "journal_status", stat: "spirit", name: "Journal", emoji: "", done: false }] };
}
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function useHarness(initial: EveningData) {
  const [todayData, onTodayDataChange] = useState(initial);
  return useEveningRitual({ todayKey: day, todayData, onTodayDataChange, onBackfillOneSession: async () => true, onUndoBackfillSession: async () => true });
}
describe("shared check-in data", () => {
  it("sees timer/backfill snapshots from the parent without a reload", () => {
    const { result, rerender } = renderHook(({ snapshot }) => useEveningRitual({ todayKey: day, todayData: snapshot, onTodayDataChange: vi.fn(), onBackfillOneSession: async () => true, onUndoBackfillSession: async () => true }), { initialProps: { snapshot: data() } });
    const fresh = data();
    fresh.checkIn[0] = { kind: "label", stat: "mind", labelId: 1, name: "English", emoji: "", count: 4, manualCount: 4, threshold: 4, done: true };
    rerender({ snapshot: fresh });
    expect(result.current.data?.checkIn[0].done).toBe(true);
  });
  it("updates Journal status from the confirmed save without reloading the whole day", async () => {
    actions.saveJournalAction.mockResolvedValue("saved words");
    const onXpMightHaveChanged = vi.fn();
    const { result } = renderHook(() => {
      const [todayData, onTodayDataChange] = useState(data);
      return useEveningRitual({ todayKey: day, todayData, onTodayDataChange, onXpMightHaveChanged,
        onBackfillOneSession: async () => true, onUndoBackfillSession: async () => true });
    });
    await act(async () => { await result.current.saveJournal("saved words"); });
    expect(result.current.data?.checkIn[1].done).toBe(true);
    expect(result.current.data?.journalText).toBe("saved words");
    expect(actions.getEveningDataAction).not.toHaveBeenCalled();
    expect(onXpMightHaveChanged).toHaveBeenCalledTimes(1);

    actions.saveJournalAction.mockResolvedValue("saved words, edited");
    await act(async () => { await result.current.saveJournal("saved words, edited"); });
    expect(result.current.data?.journalText).toBe("saved words, edited");
    expect(actions.getEveningDataAction).not.toHaveBeenCalled();
    expect(onXpMightHaveChanged).toHaveBeenCalledTimes(1);
  });
  it("leaves the last confirmed journal visible after a failed save", async () => {
    const initial = data(); initial.journalText = "saved words"; initial.checkIn[1].done = true;
    actions.saveJournalAction.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useHarness(initial));
    await act(async () => { await expect(result.current.saveJournal("new words")).rejects.toThrow("offline"); });
    expect(result.current.data?.journalText).toBe("saved words");
  });
  it("does not report a closed day when saving fails", async () => {
    actions.closeDayAction.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useHarness(data()));
    await act(async () => { expect(await result.current.close()).toBe(false); });
    expect(result.current.data?.closedAt).toBeNull();
    expect(result.current.error).toBe("offline");
  });
});
