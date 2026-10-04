// @vitest-environment happy-dom
import { createElement as h } from "react";
import { FocusSession, TimerOverlay } from "../../components/timer/TimerOverlay";
import { act, cleanup, fireEvent, render, screen, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSessionTimer } from "../../components/timer/useSessionTimer";

const actions = vi.hoisted(() => ({
  startSessionAction: vi.fn(), completeSessionAction: vi.fn(), abandonSessionAction: vi.fn(),
  backfillSessionsAction: vi.fn(), undoLastManualSessionAction: vi.fn(), getSessionStateAction: vi.fn(),
}));
vi.mock("../../app/actions/sessions", () => actions);
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("timer error recovery", () => {
  it("refreshes after an uncertain write instead of adding sessions a second time", async () => {
    actions.backfillSessionsAction.mockRejectedValue(new Error("Response lost"));
    actions.getSessionStateAction.mockResolvedValue({ activeSession: null, todaySessions: [], summaryLine: "1 session" });
    const { result } = renderHook(() => useSessionTimer({ initialActiveSession: null,
      initialTodaySessions: [], initialSummaryLine: "", defaultLabelId: 1 }));
    await act(async () => { expect(await result.current.backfill(1, 1)).toBe(false); });
    expect(result.current.error).toBe("Response lost");
    await act(async () => { result.current.retry(); });
    expect(actions.backfillSessionsAction).toHaveBeenCalledTimes(1);
    expect(actions.getSessionStateAction).toHaveBeenCalledTimes(1);
    expect(result.current.summaryLine).toBe("1 session");
    expect(result.current.error).toBeNull();
  });
});


it("starts the selected label, shows the server deadline, and returns after abandonment", async () => {
  const startedAt = Date.now();
  actions.startSessionAction.mockResolvedValue({ id: 7, labelId: 2, startedAt, endsAt: startedAt + 25 * 60_000 });
  actions.abandonSessionAction.mockResolvedValue({ todaySessions: [], summaryLine: "No sessions yet today." });
  function Harness() {
    const timer = useSessionTimer({ initialActiveSession: null, initialTodaySessions: [], initialSummaryLine: "", defaultLabelId: 1 });
    const labels = [{ id: 1, name: "English", emoji: "", color: "", stat: "mind" as const }, { id: 2, name: "Deep work", emoji: "", color: "", stat: "mind" as const }];
    return h("div", null, h(TimerOverlay, { timer, labels, active: true }), h(FocusSession, { timer, labels }));
  }
  render(h(Harness));
  fireEvent.click(screen.getByRole("button", { name: "Deep work" }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Start focus" })); });
  expect(actions.startSessionAction).toHaveBeenCalledWith(2);
  expect(screen.getByRole("timer").textContent).toBe("25:00");
  expect(screen.getByRole("dialog", { name: "Focus session" }).textContent).toContain("Deep work");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Abandon session" })); });
  expect(actions.abandonSessionAction).toHaveBeenCalledWith(7);
  expect(screen.queryByRole("dialog", { name: "Focus session" })).toBeNull();
});
