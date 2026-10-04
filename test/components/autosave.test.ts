// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "../../components/useAutosave";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("durable autosave", () => {
  it("retains a failed draft across unmount and only clears it after retry succeeds", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const first = renderHook(() => useAutosave<string>("journal-test", "", save));
    act(() => first.result.current.change("My unsaved words"));
    await act(async () => { expect(await first.result.current.flush()).toBe(false); });
    expect(first.result.current.status).toBe("error");
    expect(localStorage.getItem("journal-test")).toBe(JSON.stringify("My unsaved words"));
    first.unmount();
    const restored = renderHook(() => useAutosave<string>("journal-test", "", save));
    expect(restored.result.current.value).toBe("My unsaved words");
    await act(async () => { expect(await restored.result.current.flush()).toBe(true); });
    expect(restored.result.current.status).toBe("saved");
    expect(localStorage.getItem("journal-test")).toBeNull();
  });
  it("serializes writes so a slow old request cannot overwrite newer text", async () => {
    let finishFirst!: () => void;
    const firstRequest = new Promise<void>((resolve) => { finishFirst = resolve; });
    const save = vi.fn().mockReturnValueOnce(firstRequest).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave<string>("journal-test", "", save));
    act(() => result.current.change("first"));
    let pending!: Promise<boolean>;
    act(() => { pending = result.current.flush(); });
    act(() => result.current.change("second"));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => { finishFirst(); await pending; });
    expect(save.mock.calls.map(([value]) => value)).toEqual(["first", "second"]);
    expect(result.current.status).toBe("saved");
    expect(localStorage.getItem("journal-test")).toBeNull();
  });
  it("finishes saving when an edit is reverted to the saved value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave<string>("journal-test", "saved", save));
    act(() => result.current.change("edited"));
    act(() => result.current.change("saved"));
    await act(async () => { await result.current.flush(); });
    expect(result.current.status).toBe("saved");
    expect(localStorage.getItem("journal-test")).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });
  it("does not save unchanged text again on blur", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave<string>("journal-test", "saved", save));
    await act(async () => { await result.current.flush(); });
    await waitFor(() => expect(save).not.toHaveBeenCalled());
  });
});
