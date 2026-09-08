"use client";

import { useEffect, useRef } from "react";
import { getLiveClockStateAction } from "@/app/actions/liveClock";

const POLL_MS = 60_000;
const NOTIFIED_KEY_PREFIX = "myjourney:evening-reminder-notified:";

/**
 * Đồng bộ chế độ tối tự động (SPEC.md §5.7, [CHỐT — 2026-09-08]: theo GIỜ THẬT, không theo cài
 * đặt hệ thống) + bắn nhắc nghi thức tối (SPEC.md §6). Mount MỘT LẦN ở root layout, sống suốt
 * vòng đời tab — đúng [CHỐT] §6: "thông báo trình duyệt chỉ chạy khi tab còn mở, dựng bản đơn
 * giản trước".
 *
 * KHÔNG tự xin quyền Notification ở đây — `components/timer/useSessionTimer.ts` đã xin ngay lúc
 * bấm Start (cử chỉ người dùng thật), dùng lại đúng quyền đó. Nếu người dùng chưa từng bấm Start
 * lần nào thì `Notification.permission` vẫn là "default" — bỏ qua lặng lẽ, không tự ý xin thêm
 * lần nữa ở một chỗ không phải cử chỉ trực tiếp.
 */
export function NightModeSync() {
  const lastNotifiedDayRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function alreadyNotifiedToday(todayKey: string): boolean {
      if (lastNotifiedDayRef.current === todayKey) return true;
      try {
        return window.localStorage.getItem(`${NOTIFIED_KEY_PREFIX}${todayKey}`) === "1";
      } catch {
        return false; // localStorage chặn (chế độ riêng tư) — coi như chưa nhắc, chấp nhận nhắc lại
      }
    }

    function markNotified(todayKey: string) {
      lastNotifiedDayRef.current = todayKey;
      try {
        window.localStorage.setItem(`${NOTIFIED_KEY_PREFIX}${todayKey}`, "1");
      } catch {
        // Không lưu được cờ thì thôi — không chặn việc bắn thông báo vì lý do này.
      }
    }

    async function tick() {
      const state = await getLiveClockStateAction();
      if (cancelled) return;

      document.documentElement.dataset.theme = state.isNight ? "dark" : "light";

      if (!state.shouldRemindEveningRitual) return;
      if (alreadyNotifiedToday(state.todayKey)) return;
      markNotified(state.todayKey);

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Evening's here", {
          body: "Habits, mood, a few lines in the journal — whenever you're ready.",
        });
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
