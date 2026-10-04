// @vitest-environment happy-dom
import { createElement as h } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { JournalCard } from "../../components/evening/JournalCard";
import { parseJournalText } from "../../core/journalCompose";

const prompt = { id: 7, text: "What did you learn today?" };
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

it("shows three fixed questions, a daily prompt, and a separate free journal that saves with the prompt", async () => {
  const save = vi.fn(async (text: string) => { void text; });
  render(h(JournalCard, { prompt, value: "", dayKey: "2026-10-04", onSave: save, onSaveStateChange: vi.fn() }));
  expect(screen.getAllByRole("textbox")).toHaveLength(5);
  fireEvent.change(screen.getByRole("textbox", { name: prompt.text }), { target: { value: "I learned one thing." } });
  fireEvent.change(screen.getByRole("textbox", { name: "Free journal" }), { target: { value: "I also want to write freely." } });
  await act(async () => { fireEvent.blur(screen.getByRole("textbox", { name: "Free journal" })); });
  await waitFor(() => expect(save).toHaveBeenCalled());
  const parsed = parseJournalText(save.mock.calls.at(-1)![0], prompt.text);
  expect(parsed.answers[3]).toBe("I learned one thing.");
  expect(parsed.freeText).toBe("I also want to write freely.");
});

it("shows a saved legacy entry in the separate free journal", () => {
  render(h(JournalCard, { prompt, value: "Earlier writing stays here.", dayKey: "2026-10-03", onSave: vi.fn(), onSaveStateChange: vi.fn() }));
  expect((screen.getByRole("textbox", { name: "Free journal" }) as HTMLTextAreaElement).value).toBe("Earlier writing stays here.");
});
