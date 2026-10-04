// @vitest-environment happy-dom
import { createElement as h, useState, type ChangeEvent } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodayPager } from "../../components/home/TodayPager";
import { SessionSummary } from "../../components/home/HomeDashboard";
import type { SessionForDay } from "../../db/queries";

vi.mock("../../components/forest/GroveScene", () => ({ GroveScene: () => null }));
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "scrollTo").mockImplementation(function (this: HTMLElement, options?: ScrollToOptions | number) {
    if (typeof options === "object") this.scrollLeft = options.left ?? 0;
  });
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function Harness() {
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState("");
  return h(TodayPager, { page, onPageChange: setPage, children: [
    h("p", { key: "today" }, "Grove"),
    h("textarea", { key: "journal", "aria-label": "Journal draft", value: draft, onChange: (event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.currentTarget.value) }),
  ] });
}
function pager() { return screen.getByLabelText("Today and daily check-in"); }
describe("Today horizontal navigation", () => {
  it("preserves the same editor and draft when moving between panels", () => {
    render(h(Harness));
    fireEvent.keyDown(pager(), { key: "ArrowRight" });
    const editor = screen.getByRole("textbox", { name: "Journal draft" });
    fireEvent.change(editor, { target: { value: "Keep my unsaved reflection" } });
    fireEvent.keyDown(pager(), { key: "ArrowLeft" });
    expect(editor.closest(".today-panel")?.hasAttribute("inert")).toBe(true);
    fireEvent.keyDown(pager(), { key: "ArrowRight" });
    expect(screen.getByRole("textbox")).toBe(editor);
    expect((editor as HTMLTextAreaElement).value).toBe("Keep my unsaved reflection");
  });
  it("leaves arrow keys and mouse selection inside the editor alone", () => {
    render(h(Harness));
    fireEvent.keyDown(pager(), { key: "ArrowRight" });
    const editor = screen.getByRole("textbox");
    fireEvent.keyDown(editor, { key: "ArrowLeft" });
    fireEvent.pointerDown(editor, { pointerType: "mouse", button: 0, pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(editor, { pointerType: "mouse", pointerId: 1, clientX: 500 });
    fireEvent.pointerUp(editor, { pointerType: "mouse", pointerId: 1 });
    expect(editor.closest(".today-panel")?.hasAttribute("inert")).toBe(false);
    expect(pager().scrollLeft).toBe(1000);
  });
  it("moves to the adjacent panel after a deliberate mouse drag", () => {
    render(h(Harness));
    fireEvent.pointerDown(pager(), { pointerType: "mouse", button: 0, pointerId: 1, clientX: 700 });
    fireEvent.pointerMove(pager(), { pointerType: "mouse", pointerId: 1, clientX: 350 });
    fireEvent.pointerUp(pager(), { pointerType: "mouse", pointerId: 1 });
    expect(pager().scrollLeft).toBe(1000);
    expect(screen.getByRole("textbox").closest(".today-panel")?.hasAttribute("inert")).toBe(false);
  });
  it("reflects native horizontal scrolling in the accessible active panel", () => {
    render(h(Harness));
    pager().scrollLeft = 1000;
    fireEvent.scroll(pager());
    expect(screen.getByRole("textbox").closest(".today-panel")?.hasAttribute("inert")).toBe(false);
  });
});
it("counts only completed sessions, including manual sessions, with the real label names", () => {
  const session = (id: number, status: SessionForDay["status"], labelId = 1, source: SessionForDay["source"] = "timer"): SessionForDay =>
    ({ id, status, labelId, source, labelName: labelId === 1 ? "English" : "Research", labelColor: "#123456" });
  const { container } = render(h(SessionSummary, { sessions: [session(1, "completed"), session(2, "completed", 1, "manual"), session(3, "running"), session(4, "abandoned"), session(5, "completed", 2)] }));
  expect(container.querySelector(".session-total")?.textContent).toBe("3 sessions today");
  expect(container.querySelector(".session-breakdown")?.textContent).toBe("English 2 · Research 1");
});
