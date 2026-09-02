"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { now } from "@/core/clock";
import { isSessionComplete, secondsRemaining } from "@/core/session";
import {
  abandonSessionAction,
  backfillSessionsAction,
  completeSessionAction,
  startSessionAction,
} from "@/app/actions/sessions";
import type { SessionForDay } from "@/db/queries";

/**
 * Đồng hồ pomodoro — từ mốc 2, phiên sống thật trong Postgres (bảng `sessions`), không phải
 * localStorage nữa. Trang tải lên với dữ liệu SERVER đã đọc sẵn (`initial*`); hook này chỉ lo
 * phần SỐNG: đếm ngược (tính lại từ `endsAt` mỗi tick — §5.1, không setInterval đếm lùi) và
 * gọi Server Action khi tôi bấm gì đó.
 */

export type ActiveSession = { id: number; labelId: number; startedAt: number; endsAt: number };

type Props = {
  initialActiveSession: ActiveSession | null;
  initialTodaySessions: SessionForDay[];
  initialSummaryLine: string;
  defaultLabelId: number;
  /** Gọi sau khi phiên HOÀN THÀNH hoặc GHI BÙ — hai việc duy nhất ở đây có thể đổi XP (§4.4).
   *  Bỏ phiên (abandon) ăn 0 điểm nên không gọi. Xem components/stats/useComputedStats.ts. */
  onXpMightHaveChanged?: () => void;
};

const TICK_MS = 1000;

export function useSessionTimer({
  initialActiveSession,
  initialTodaySessions,
  initialSummaryLine,
  defaultLabelId,
  onXpMightHaveChanged,
}: Props) {
  const [selectedLabelId, setSelectedLabelId] = useState<number>(defaultLabelId);
  const [running, setRunning] = useState<ActiveSession | null>(initialActiveSession);
  const [nowMs, setNowMs] = useState<number>(() => now());
  const [todaySessions, setTodaySessions] = useState<SessionForDay[]>(initialTodaySessions);
  const [summaryLine, setSummaryLine] = useState(initialSummaryLine);
  const [justCompletedLabelId, setJustCompletedLabelId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const hasRequestedNotificationPermission = useRef(false);

  // Đồng hồ hiển thị: tick mỗi giây CHỈ để ép re-render — số giây còn lại luôn tính lại từ
  // endsAt (đã lưu) và now() thật (SPEC.md §5.1).
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNowMs(now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  // Phát hiện hoàn thành trong lúc tab đang mở — đây mới là lúc chuông + pháo giấy nổ ra.
  // Chốt lại phía server (finalizeSession) rồi mới cập nhật dải chấm — DB là nguồn thật.
  useEffect(() => {
    if (!running) return;
    if (!isSessionComplete(running, nowMs)) return;

    const finished = running;
    // Đổi state khi thời gian THẬT vượt endsAt — chỉ phát hiện được trong effect, luôn kèm side
    // effect thật (chuông, Notification) nên tách state khỏi effect này không có ý nghĩa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRunning(null);
    setJustCompletedLabelId(finished.labelId);

    void new Audio("/sounds/session-complete.ogg").play().catch(() => {
      // Trình duyệt chặn autoplay khi chưa có tương tác — im lặng bỏ qua, không phải lỗi.
    });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Nice — take a break", {
        body: "One session done. A short break sounds good.",
        silent: true, // đã có chuông riêng, tránh kêu hai lần
      });
    }

    void completeSessionAction(finished.id, finished.endsAt).then((snapshot) => {
      setTodaySessions(snapshot.todaySessions);
      setSummaryLine(snapshot.summaryLine);
      onXpMightHaveChanged?.();
    });
  }, [running, nowMs, onXpMightHaveChanged]);

  // Tự ẩn thông báo "Nice — take a break" sau 4 giây — TÁCH RIÊNG khỏi effect ở trên (gộp
  // chung sẽ tự huỷ setTimeout của chính nó ngay khi running đổi thành null).
  useEffect(() => {
    if (!justCompletedLabelId) return;
    const timeout = window.setTimeout(() => setJustCompletedLabelId(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [justCompletedLabelId]);

  const start = useCallback(() => {
    if (running || pending) return;
    if (
      !hasRequestedNotificationPermission.current &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      hasRequestedNotificationPermission.current = true;
      void Notification.requestPermission();
    }
    setPending(true);
    startSessionAction(selectedLabelId)
      .then((session) => {
        setRunning(session);
        setNowMs(session.startedAt);
      })
      .catch((err: unknown) => {
        console.error(err);
      })
      .finally(() => setPending(false));
  }, [running, pending, selectedLabelId]);

  /** Không có tạm dừng — chỉ có bỏ phiên. 0 điểm, không tín dụng một phần (§4.3). */
  const abandon = useCallback(() => {
    if (!running) return;
    const sessionId = running.id;
    setRunning(null);
    void abandonSessionAction(sessionId).then((snapshot) => {
      setTodaySessions(snapshot.todaySessions);
      setSummaryLine(snapshot.summaryLine);
    });
  }, [running]);

  /** Ghi bù — chỉ cho hôm nay, không giới hạn số phiên (§4.3). */
  const backfill = useCallback(
    (labelId: number, count: number) => {
      void backfillSessionsAction(labelId, count).then((snapshot) => {
        setTodaySessions(snapshot.todaySessions);
        setSummaryLine(snapshot.summaryLine);
        onXpMightHaveChanged?.();
      });
    },
    [onXpMightHaveChanged],
  );

  return {
    selectedLabelId,
    setSelectedLabelId,
    running,
    nowMs,
    todaySessions,
    summaryLine,
    justCompletedLabelId,
    pending,
    start,
    abandon,
    backfill,
  };
}

export { secondsRemaining };
