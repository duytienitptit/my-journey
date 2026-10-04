// @vitest-environment happy-dom
import { createElement as h } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SundayWrapUp } from "../../components/week/SundayWrapUp";
import type { WeeklyReviewData } from "../../app/actions/week";

const actions = vi.hoisted(() => ({ saveWeekReviewAction: vi.fn() }));
vi.mock("../../app/actions/week", () => actions);
const weekDays = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"] as WeeklyReviewData["weekDays"];
const data: WeeklyReviewData = {
  weekStart: "2026-09-28" as WeeklyReviewData["weekStart"],
  weekDays,
  todayKey: "2026-10-04" as WeeklyReviewData["todayKey"],
  sessionCountByStat: { mind: 2, health: 1, spirit: 0 }, totalSessions: 3, backfillRate: 0,
  habitKeepRates: [], moodCurve: weekDays.map((dayKey) => ({ dayKey, mood: null })), journalExcerpts: [],
  correlationSentence: null, reviewText: "", netWorth: null, hideMoney: false,
};
afterEach(() => { cleanup(); localStorage.clear(); vi.resetAllMocks(); });

it("places an open weekly editor before the optional questions and saves the same review", async () => {
  actions.saveWeekReviewAction.mockResolvedValue(undefined);
  render(h(SundayWrapUp, { data }));
  expect(screen.getByRole("heading", { name: "Wrap up your week." })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Open full week ↗" }).getAttribute("href")).toBe("/week");
  const free = screen.getByRole("textbox", { name: "Weekly free reflection" });
  const firstQuestion = screen.getByRole("textbox", { name: "What stood out this week? What will you do differently next week?" });
  expect(free.compareDocumentPosition(firstQuestion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.change(free, { target: { value: "A calm week with small progress." } });
  await act(async () => { fireEvent.blur(free); });
  await waitFor(() => expect(actions.saveWeekReviewAction).toHaveBeenCalledWith("A calm week with small progress."));
});
