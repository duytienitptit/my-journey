"use server";

/** Cài đặt — SPEC.md §5.6, mốc 8. Nhãn, thói quen, 6 việc, độ dài phiên, câu gợi ý, nhân vật, xuất/nhập. */

import {
  CHARACTER_LOOKS,
  DEFAULT_CHARACTER_LOOK,
  isValidCharacterLook,
} from "@/components/room/models";
import type { StatKey } from "@/core/types";
import {
  addDailyTask,
  archiveHabit,
  archiveLabel,
  createHabit,
  createLabel,
  createPrompt,
  deactivatePrompt,
  getCharacterLook,
  getHideMoney,
  getSettings,
  importAllData,
  listActiveHabits,
  listActiveLabels,
  listAllPrompts,
  listDailyTasksWithRef,
  removeDailyTask,
  setCharacterLook,
  updateDailyTaskThreshold,
  updateHabit,
  updateLabel,
  updatePromptText,
  updateSettingsRow,
  type DailyTaskWithRef,
  type ExportedData,
} from "@/db/queries";

export type SettingsData = {
  labels: { id: number; name: string; emoji: string; color: string; stat: StatKey }[];
  habits: { id: number; name: string; emoji: string; stat: StatKey; kind: "score_1_5" | "boolean" | "journal" }[];
  dailyTasks: DailyTaskWithRef[];
  prompts: { id: number; text: string; category: string | null }[];
  sessionMinutes: number;
  dailySessionGoal: number;
  reminderHour: number | null;
  hideMoney: boolean;
  characterLook: string;
  characterLooks: readonly string[];
};

export async function getSettingsDataAction(): Promise<SettingsData> {
  const [labels, habits, dailyTasks, prompts, settings, hideMoney, characterLook] = await Promise.all([
    listActiveLabels(),
    listActiveHabits(),
    listDailyTasksWithRef(),
    listAllPrompts(),
    getSettings(),
    getHideMoney(),
    getCharacterLook(),
  ]);
  return {
    labels: labels.map((l) => ({ id: l.id, name: l.name, emoji: l.emoji, color: l.color, stat: l.stat })),
    habits: habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, stat: h.stat, kind: h.kind })),
    dailyTasks,
    prompts: prompts.map((p) => ({ id: p.id, text: p.text, category: p.category })),
    sessionMinutes: settings?.sessionMinutes ?? 25,
    dailySessionGoal: settings?.dailySessionGoal ?? 4,
    reminderHour: settings?.reminderHour ?? null,
    hideMoney,
    characterLook: characterLook ?? DEFAULT_CHARACTER_LOOK,
    characterLooks: CHARACTER_LOOKS,
  };
}

// ─── Nhãn ───────────────────────────────────────────────────────────────

export async function createLabelAction(name: string, emoji: string, color: string, stat: StatKey) {
  if (!name.trim()) throw new Error("Tên nhãn không được để trống.");
  await createLabel({ name: name.trim(), emoji: emoji || "🏷️", color, stat });
}

export async function updateLabelAction(id: number, name: string, emoji: string, color: string, stat: StatKey) {
  if (!name.trim()) throw new Error("Tên nhãn không được để trống.");
  await updateLabel(id, { name: name.trim(), emoji: emoji || "🏷️", color, stat });
}

export async function archiveLabelAction(id: number) {
  await archiveLabel(id);
}

// ─── Thói quen ──────────────────────────────────────────────────────────

export async function createHabitAction(name: string, emoji: string, stat: StatKey) {
  if (!name.trim()) throw new Error("Tên thói quen không được để trống.");
  await createHabit({ name: name.trim(), emoji: emoji || "✅", stat, kind: "score_1_5" });
}

export async function updateHabitAction(id: number, name: string, emoji: string, stat: StatKey) {
  if (!name.trim()) throw new Error("Tên thói quen không được để trống.");
  await updateHabit(id, { name: name.trim(), emoji: emoji || "✅", stat });
}

export async function archiveHabitAction(id: number) {
  await archiveHabit(id);
}

// ─── 6 việc trong ngày ──────────────────────────────────────────────────

export async function addDailyTaskAction(refType: "label" | "habit", refId: number, threshold: number | null) {
  await addDailyTask({ refType, refId, threshold });
}

export async function updateDailyTaskThresholdAction(id: number, threshold: number | null) {
  await updateDailyTaskThreshold(id, threshold);
}

export async function removeDailyTaskAction(id: number) {
  await removeDailyTask(id);
}

// ─── Câu gợi ý nhật ký ──────────────────────────────────────────────────

export async function createPromptAction(text: string) {
  if (!text.trim()) throw new Error("Câu gợi ý không được để trống.");
  await createPrompt(text.trim(), null);
}

export async function updatePromptAction(id: number, text: string) {
  if (!text.trim()) throw new Error("Câu gợi ý không được để trống.");
  await updatePromptText(id, text.trim());
}

export async function deletePromptAction(id: number) {
  await deactivatePrompt(id);
}

// ─── Độ dài phiên, mục tiêu ngày, giờ nhắc ────────────────────────────────

export async function updateSessionSettingsAction(
  sessionMinutes: number,
  dailySessionGoal: number,
  reminderHour: number | null,
) {
  if (sessionMinutes < 1 || dailySessionGoal < 1) throw new Error("Số phút/mục tiêu phải lớn hơn 0.");
  if (reminderHour !== null && (reminderHour < 0 || reminderHour > 23)) throw new Error("Giờ nhắc phải từ 0-23.");
  await updateSettingsRow({ sessionMinutes, dailySessionGoal, reminderHour });
}

// ─── Nhân vật ────────────────────────────────────────────────────────────
// Ẩn/hiện tài sản đã có `setHideMoneyAction` riêng ở app/actions/assets.ts (mốc 5, dùng chung
// với NetWorthControl trên màn chính) — Cài đặt gọi lại đúng action đó, không tạo bản thứ hai.

export async function setCharacterLookAction(characterKey: string) {
  if (!isValidCharacterLook(characterKey)) throw new Error("Hình dáng không hợp lệ.");
  await setCharacterLook(characterKey);
}

// ─── Nhập dữ liệu ───────────────────────────────────────────────────────
// Xuất đã có route /api/export (mốc 2, §5.5) — tự set Content-Disposition để trình duyệt tải
// file thật, một Server Action không làm được việc đó gọn bằng. Cài đặt chỉ LIÊN KẾT tới route
// đó (xem DataSection.tsx), không định nghĩa lại.

export type ImportResult = { ok: true } | { ok: false; error: string };

/**
 * THAY THẾ toàn bộ dữ liệu — không gộp (§8.5, khôi phục từ bản sao lưu). Kiểm tra hình dạng JSON
 * ở mức tối thiểu (đủ các khối chính) trước khi chạm DB; lỗi thật (sai schema, thiếu cột) để
 * transaction trong `importAllData` tự cuộn lại, không có gì bị ghi dở dang.
 */
export async function importDataAction(jsonText: string): Promise<ImportResult> {
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Không đọc được file — không phải JSON hợp lệ." };
  }
  if (typeof data !== "object" || data === null || !("profile" in data) || !("labels" in data)) {
    return { ok: false, error: "File không đúng khuôn dạng đã xuất từ chính app này." };
  }
  try {
    await importAllData(data as ExportedData);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Nhập dữ liệu thất bại." };
  }
}
