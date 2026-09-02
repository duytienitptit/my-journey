"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import { SESSION_MINUTES_DEFAULT } from "@/core/balance";
import { isSessionComplete, sessionEndsAt, type RunningSession } from "@/core/session";
import { SEED_LABELS } from "./labels";

/**
 * TẠM — mốc 1 "điểm số hard-code, chưa cần DB" (SPEC.md §9). Phiên đang chạy và danh sách
 * phiên hôm nay lưu `localStorage`, không phải DB thật. Mốc 2 thay toàn bộ file này bằng
 * server action + bảng `sessions` — giữ đúng các hàm thuần ở `core/session.ts`, chỉ đổi
 * chỗ lưu trữ. Không có "abandoned" record ở mốc này (0 XP, không XP nào để mất — DB mốc 2
 * mới ghi lại status đó).
 */

const RUNNING_KEY = "myjourney:running-session";
const TODAY_SESSIONS_KEY = "myjourney:today-sessions";
const TICK_MS = 1000;

export type CompletedTodaySession = {
  labelId: string;
  completedAt: number;
  backfilled: boolean;
};

function readRunning(): RunningSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RUNNING_KEY);
    return raw ? (JSON.parse(raw) as RunningSession) : null;
  } catch {
    return null;
  }
}

function writeRunning(session: RunningSession | null) {
  if (session) {
    window.localStorage.setItem(RUNNING_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(RUNNING_KEY);
  }
}

function readAllCompleted(): CompletedTodaySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TODAY_SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as CompletedTodaySession[]) : [];
  } catch {
    return [];
  }
}

function writeAllCompleted(entries: CompletedTodaySession[]) {
  window.localStorage.setItem(TODAY_SESSIONS_KEY, JSON.stringify(entries));
}

export function useSessionTimer() {
  const [selectedLabelId, setSelectedLabelId] = useState<string>(SEED_LABELS[0].id);
  const [running, setRunning] = useState<RunningSession | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => now());
  const [todaySessions, setTodaySessions] = useState<CompletedTodaySession[]>([]);
  const [justCompletedLabelId, setJustCompletedLabelId] = useState<string | null>(null);
  const hasRequestedNotificationPermission = useRef(false);

  // Nạp trạng thái đã lưu — chỉ chạy một lần lúc mount (localStorage không có trên server).
  useEffect(() => {
    const persisted = readRunning();
    const all = readAllCompleted();
    const todayKey = dayKeyOf(now());
    const stillToday = all.filter((e) => dayKeyOf(e.completedAt) === todayKey);
    if (stillToday.length !== all.length) writeAllCompleted(stillToday);
    // Đọc localStorage (hệ thống ngoài) sau khi mount rồi mới setState — ĐÚNG mẫu hình effect
    // được khuyến nghị, không phải chống chỉ định: localStorage không tồn tại lúc SSR, nên phải
    // đợi qua effect. Đưa thẳng vào lazy initializer của useState sẽ gây lệch hydrate (server
    // render "chưa có phiên", client lại muốn render "đang chạy" ngay từ lần vẽ đầu).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodaySessions(stillToday);

    if (persisted) {
      if (isSessionComplete(persisted, now())) {
        // Hoàn thành trong lúc tôi vắng mặt (đóng tab) — ghi nhận lặng lẽ, không chuông/pháo
        // giấy cho một khoảnh khắc đã trôi qua.
        writeRunning(null);
        const finished: CompletedTodaySession = {
          labelId: persisted.labelId,
          completedAt: persisted.endsAt,
          backfilled: false,
        };
        const merged = [...stillToday, finished];
        writeAllCompleted(merged);
        setTodaySessions(merged);
      } else {
        setRunning(persisted);
      }
    }
  }, []);

  // Đồng hồ hiển thị: tick mỗi giây CHỈ để ép re-render — số giây còn lại luôn tính lại từ
  // endsAt (đã lưu) và now() thật, không phải đếm lùi bằng setInterval (SPEC.md §5.1).
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNowMs(now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  // Phát hiện hoàn thành trong lúc tab đang mở — đây mới là lúc chuông + pháo giấy nổ ra.
  useEffect(() => {
    if (!running) return;
    if (!isSessionComplete(running, nowMs)) return;

    writeRunning(null);
    const finished: CompletedTodaySession = {
      labelId: running.labelId,
      completedAt: running.endsAt,
      backfilled: false,
    };
    // Chuyển trạng thái khi thời gian THẬT vượt mốc endsAt — chỉ phát hiện được bên trong effect
    // (không phải thứ tính được thuần tại thời điểm render), và luôn đi kèm side effect thật
    // (phát chuông, bắn Notification) nên tách state ra khỏi effect này không có ý nghĩa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodaySessions((prev) => {
      const merged = [...prev, finished];
      writeAllCompleted(merged);
      return merged;
    });
    setRunning(null);
    setJustCompletedLabelId(running.labelId);

    void new Audio("/sounds/session-complete.ogg").play().catch(() => {
      // Trình duyệt chặn autoplay khi chưa có tương tác — im lặng bỏ qua, không phải lỗi.
    });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Xong rồi — nghỉ chút đi", {
        body: "Hết một phiên. Nghỉ 5 phút rồi quay lại cũng được.",
        silent: true, // đã có chuông riêng, tránh kêu hai lần
      });
    }

  }, [running, nowMs]);

  // Tự ẩn thông báo "Xong rồi" sau 4 giây — TÁCH RIÊNG khỏi effect phát hiện hoàn thành ở trên.
  // Gộp chung sẽ có bug: setRunning(null) trong effect đó đổi dependency `running`, effect tự
  // re-run, cleanup của chính nó hủy luôn cái setTimeout vừa đặt trước khi nó kịp chạy.
  useEffect(() => {
    if (!justCompletedLabelId) return;
    const timeout = window.setTimeout(() => setJustCompletedLabelId(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [justCompletedLabelId]);

  const start = useCallback(() => {
    if (running) return; // chỉ một phiên tại một thời điểm (§4.3)
    if (
      !hasRequestedNotificationPermission.current &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      hasRequestedNotificationPermission.current = true;
      void Notification.requestPermission();
    }
    const startedAt = now();
    const session: RunningSession = {
      labelId: selectedLabelId,
      startedAt,
      endsAt: sessionEndsAt(startedAt, SESSION_MINUTES_DEFAULT),
    };
    writeRunning(session);
    setRunning(session);
    setNowMs(startedAt);
  }, [running, selectedLabelId]);

  /** Không có tạm dừng — chỉ có bỏ phiên. 0 điểm, không tín dụng một phần (§4.3). */
  const abandon = useCallback(() => {
    writeRunning(null);
    setRunning(null);
  }, []);

  /** Ghi bù — chỉ cho hôm nay, không giới hạn số phiên, không đánh dấu gì tiêu cực (§4.3). */
  const backfill = useCallback((labelId: string, count: number) => {
    const entries: CompletedTodaySession[] = Array.from({ length: count }, () => ({
      labelId,
      completedAt: now(),
      backfilled: true,
    }));
    setTodaySessions((prev) => {
      const merged = [...prev, ...entries];
      writeAllCompleted(merged);
      return merged;
    });
  }, []);

  return {
    labels: SEED_LABELS,
    selectedLabelId,
    setSelectedLabelId,
    running,
    nowMs,
    todaySessions,
    justCompletedLabelId,
    start,
    abandon,
    backfill,
  };
}
