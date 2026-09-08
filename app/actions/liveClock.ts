"use server";

/**
 * Nhịp "đồng hồ sống" — mốc 8b. Client hỏi lại định kỳ (components/theme/NightModeSync.tsx) để
 * biết (1) có nên bật chế độ tối chưa (§5.7) và (2) có tới giờ nhắc nghi thức tối chưa (§6).
 * Cả hai đều PHẢI đi qua `now()` (core/clock.ts) — không tự đọc `new Date()` phía client — để
 * công cụ tua thời gian dev vẫn kiểm tra được (§8.3), và để múi giờ Việt Nam luôn là nguồn thật
 * (core/day.ts), không lệ thuộc múi giờ máy người dùng.
 */

import { now } from "@/core/clock";
import { dayKeyOf, hourOfDay, isNightHour } from "@/core/day";
import type { DayKey } from "@/core/types";
import { getDayLog, getSettings } from "@/db/queries";

export type LiveClockState = {
  isNight: boolean;
  todayKey: DayKey;
  /** Đã tới giờ nhắc VÀ hôm nay chưa đóng ngày — client tự lo phần xin quyền/bắn Notification
   *  + nhớ "đã nhắc hôm nay chưa" (localStorage), phía server chỉ trả lời true/false thô. */
  shouldRemindEveningRitual: boolean;
};

export async function getLiveClockStateAction(): Promise<LiveClockState> {
  const nowMs = now();
  const todayKey = dayKeyOf(nowMs);

  const [settings, todayLog] = await Promise.all([getSettings(), getDayLog(todayKey)]);
  const reminderHour = settings?.reminderHour ?? null;
  const dayClosed = todayLog?.closedAt != null;
  const shouldRemindEveningRitual = reminderHour !== null && !dayClosed && hourOfDay(nowMs) >= reminderHour;

  return {
    isNight: isNightHour(nowMs),
    todayKey,
    shouldRemindEveningRitual,
  };
}
