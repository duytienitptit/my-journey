"use server";

import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import { sessionEndsAt } from "@/core/session";
import { daySummaryLine } from "@/core/summary";
import { SESSION_MINUTES_DEFAULT } from "@/core/balance";
import type { DayKey } from "@/core/types";
import {
  abandonSession,
  backfillSessions,
  finalizeSession,
  getActiveSession,
  getSettings,
  listSessionsForDay,
  startSession,
  type SessionForDay,
} from "@/db/queries";

export type SessionsSnapshot = {
  todaySessions: SessionForDay[];
  summaryLine: string;
};

async function buildSnapshot(dayKey: DayKey): Promise<SessionsSnapshot> {
  const sessions = await listSessionsForDay(dayKey);
  const completed = sessions.filter((s) => s.status === "completed");
  return {
    todaySessions: sessions,
    summaryLine: daySummaryLine(completed.map((s) => ({ labelName: s.labelName }))),
  };
}

/** Chỉ cho phép một phiên chạy tại một thời điểm (§4.3) — ném lỗi nếu đã có phiên đang chạy. */
export async function startSessionAction(labelId: number) {
  const active = await getActiveSession();
  if (active) throw new Error("A session is already running.");

  const settings = await getSettings();
  const minutes = settings?.sessionMinutes ?? SESSION_MINUTES_DEFAULT;
  const startedAt = now();
  const endsAt = sessionEndsAt(startedAt, minutes);
  const row = await startSession(labelId, minutes, endsAt);

  return {
    id: row.id,
    labelId: row.labelId,
    startedAt: row.startedAt.getTime(),
    endsAt: row.endsAt.getTime(),
  };
}

/** Client phát hiện đã tới/quá endsAt trong lúc tab mở — chốt lại phía server, trả dữ liệu mới. */
export async function completeSessionAction(sessionId: number, endsAtMs: number) {
  await finalizeSession(sessionId, endsAtMs);
  return buildSnapshot(dayKeyOf(endsAtMs));
}

/** Không có tạm dừng — chỉ có bỏ phiên (§4.3). */
export async function abandonSessionAction(sessionId: number) {
  await abandonSession(sessionId);
  return buildSnapshot(dayKeyOf(now()));
}

/** Ghi bù — chỉ hôm nay, không giới hạn (§4.3, §4.11). */
export async function backfillSessionsAction(labelId: number, count: number) {
  const settings = await getSettings();
  const minutes = settings?.sessionMinutes ?? SESSION_MINUTES_DEFAULT;
  await backfillSessions(labelId, count, minutes);
  return buildSnapshot(dayKeyOf(now()));
}
