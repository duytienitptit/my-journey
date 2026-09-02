/**
 * Lớp truy cập dữ liệu — mọi đọc/ghi Postgres đi qua đây, không viết SQL/Drizzle rải rác trong
 * component hay server action (§8.4: giữ ranh giới DB tách khỏi mọi thứ khác rõ ràng).
 *
 * File này KHÔNG phải "hàm thuần" (đụng DB thật) nên không nằm trong `core/`. Nó gọi các hàm
 * thuần ở `core/` (dayKeyOf, isSessionComplete…) để tính toán, rồi mới đọc/ghi.
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import type { RoomItemCatalogEntry } from "@/core/engine/room";
import type { EngineRawData } from "@/core/engine/types";
import { isSessionComplete, type RunningSession } from "@/core/session";
import type { DayKey, StatKey } from "@/core/types";
import { db } from "./client";
import * as schema from "./schema";

// ─── Labels & habits & daily_tasks (đọc; ghi/sửa là mốc 8) ───────────────

export async function listActiveLabels() {
  return db
    .select()
    .from(schema.labels)
    .where(eq(schema.labels.archived, false))
    .orderBy(asc(schema.labels.sortOrder));
}

export async function listActiveHabits() {
  return db.select().from(schema.habits).where(eq(schema.habits.archived, false)).orderBy(asc(schema.habits.id));
}

export type DailyTaskWithRef = {
  id: number;
  refType: "label" | "habit";
  refId: number;
  threshold: number | null;
  name: string;
  emoji: string;
  stat: StatKey;
};

/** 6 việc trong ngày kèm tên/emoji/chỉ số thật của nhãn hoặc thói quen — SPEC.md §4.5, §12.4. */
export async function listDailyTasksWithRef(): Promise<DailyTaskWithRef[]> {
  const [tasks, labelRows, habitRows] = await Promise.all([
    db
      .select()
      .from(schema.dailyTasks)
      .where(eq(schema.dailyTasks.active, true))
      .orderBy(asc(schema.dailyTasks.sortOrder)),
    db.select().from(schema.labels),
    db.select().from(schema.habits),
  ]);
  const labelById = new Map(labelRows.map((l) => [l.id, l]));
  const habitById = new Map(habitRows.map((h) => [h.id, h]));

  return tasks.flatMap((t) => {
    const ref = t.refType === "label" ? labelById.get(t.refId) : habitById.get(t.refId);
    if (!ref) return []; // tham chiếu treo (nhãn/thói quen bị xoá) — bỏ qua thay vì crash
    return [
      {
        id: t.id,
        refType: t.refType,
        refId: t.refId,
        threshold: t.threshold,
        name: ref.name,
        emoji: ref.emoji,
        stat: ref.stat,
      },
    ];
  });
}

export async function getSettings() {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1);
  return rows[0] ?? null;
}

// ─── Sessions — SPEC.md §4.3, §4.4 ────────────────────────────────────────

export type PersistedSession = RunningSession<number> & { id: number };

/**
 * Đọc phiên đang chạy — nếu đã quá `endsAt` thì tự đóng thành `completed` trước khi trả về
 * (kế hoạch mốc 2: "tự đóng phiên quá ends_at"). Trả `null` nếu không có phiên nào đang chạy.
 */
export async function getActiveSession(): Promise<PersistedSession | null> {
  const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.status, "running")).limit(1);
  const row = rows[0];
  if (!row) return null;

  const shape: RunningSession<number> = {
    labelId: row.labelId,
    startedAt: row.startedAt.getTime(),
    endsAt: row.endsAt.getTime(),
  };
  if (isSessionComplete(shape, now())) {
    await finalizeSession(row.id, row.endsAt.getTime());
    return null;
  }
  return { id: row.id, ...shape };
}

/** Chỉ cho phép một phiên chạy tại một thời điểm (§4.3) — gọi getActiveSession() trước ở caller. */
export async function startSession(labelId: number, plannedMinutes: number, endsAtMs: number) {
  const startedAt = new Date(now());
  const [row] = await db
    .insert(schema.sessions)
    .values({
      labelId,
      dayKey: dayKeyOf(startedAt.getTime()),
      startedAt,
      endsAt: new Date(endsAtMs),
      plannedMinutes,
      source: "timer",
      status: "running",
    })
    .returning();
  return row;
}

/** Đánh dấu hoàn thành — gọi khi client PHÁT HIỆN hoàn thành lúc tab đang mở (chuông/pháo giấy). */
export async function finalizeSession(sessionId: number, endsAtMs: number) {
  await db
    .update(schema.sessions)
    .set({ status: "completed", endedAt: new Date(endsAtMs) })
    .where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.status, "running")));
}

/** Không có tạm dừng — chỉ có bỏ phiên, 0 điểm, vẫn giữ bản ghi (§4.3). */
export async function abandonSession(sessionId: number) {
  await db
    .update(schema.sessions)
    .set({ status: "abandoned", endedAt: new Date(now()) })
    .where(and(eq(schema.sessions.id, sessionId), eq(schema.sessions.status, "running")));
}

/** Ghi bù — chỉ hôm nay, không giới hạn số phiên, không phạt gì (§4.3, §4.11). */
export async function backfillSessions(labelId: number, count: number, plannedMinutes: number) {
  const instant = new Date(now());
  const dayKey = dayKeyOf(instant.getTime());
  if (count <= 0) return [];
  const values = Array.from({ length: count }, () => ({
    labelId,
    dayKey,
    startedAt: instant,
    endsAt: instant,
    endedAt: instant,
    plannedMinutes,
    source: "manual" as const,
    status: "completed" as const,
  }));
  return db.insert(schema.sessions).values(values).returning();
}

export type SessionForDay = {
  id: number;
  labelId: number;
  labelName: string;
  labelColor: string;
  status: "running" | "completed" | "abandoned";
  source: "timer" | "manual";
};

/** Mọi phiên của một ngày (đủ mọi trạng thái) — dải chấm hôm nay đọc từ đây. */
export async function listSessionsForDay(dayKey: DayKey): Promise<SessionForDay[]> {
  const rows = await db
    .select({
      id: schema.sessions.id,
      labelId: schema.sessions.labelId,
      labelName: schema.labels.name,
      labelColor: schema.labels.color,
      status: schema.sessions.status,
      source: schema.sessions.source,
    })
    .from(schema.sessions)
    .innerJoin(schema.labels, eq(schema.sessions.labelId, schema.labels.id))
    .where(eq(schema.sessions.dayKey, dayKey))
    .orderBy(asc(schema.sessions.startedAt));
  return rows;
}

/** Số phiên HOÀN THÀNH trong ngày, theo từng nhãn — dùng để tính "ngày đạt" (mốc 4) và hiển thị. */
export async function countCompletedSessionsByLabelForDay(
  dayKey: DayKey,
): Promise<Map<number, number>> {
  const rows = await db
    .select({ labelId: schema.sessions.labelId })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.dayKey, dayKey), eq(schema.sessions.status, "completed")));
  const counts = new Map<number, number>();
  for (const r of rows) counts.set(r.labelId, (counts.get(r.labelId) ?? 0) + 1);
  return counts;
}

// ─── Habit entries — SPEC.md §4.2, §7 ─────────────────────────────────────

export async function listHabitEntriesForDay(dayKey: DayKey) {
  return db.select().from(schema.habitEntries).where(eq(schema.habitEntries.dayKey, dayKey));
}

/** Sport, Sleep enough — chấm 1-5 (§4.2). Ghi đè nếu đã chấm hôm đó (unique habit_id+day_key). */
export async function upsertHabitScore(habitId: number, dayKey: DayKey, score: number) {
  await db
    .insert(schema.habitEntries)
    .values({ habitId, dayKey, score, updatedAt: new Date(now()) })
    .onConflictDoUpdate({
      target: [schema.habitEntries.habitId, schema.habitEntries.dayKey],
      set: { score, updatedAt: new Date(now()) },
    });
}

// ─── day_logs — tâm trạng, nhật ký, đóng ngày. SPEC.md §5.1, §7 ──────────

export async function getDayLog(dayKey: DayKey) {
  const rows = await db.select().from(schema.dayLogs).where(eq(schema.dayLogs.dayKey, dayKey)).limit(1);
  return rows[0] ?? null;
}

async function ensureDayLog(dayKey: DayKey) {
  await db.insert(schema.dayLogs).values({ dayKey }).onConflictDoNothing({ target: schema.dayLogs.dayKey });
}

export async function upsertMood(dayKey: DayKey, mood: number) {
  await ensureDayLog(dayKey);
  await db.update(schema.dayLogs).set({ mood }).where(eq(schema.dayLogs.dayKey, dayKey));
}

export async function upsertJournal(dayKey: DayKey, text: string, promptId: number | null) {
  await ensureDayLog(dayKey);
  await db
    .update(schema.dayLogs)
    .set({ journalText: text, journalPromptId: promptId })
    .where(eq(schema.dayLogs.dayKey, dayKey));
}

/** Đóng ngày — không khoá lại, vẫn sửa được sau (SPEC.md §11.2 câu Q16). Đóng muộn vẫn tính. */
export async function closeDay(dayKey: DayKey) {
  await ensureDayLog(dayKey);
  await db.update(schema.dayLogs).set({ closedAt: new Date(now()) }).where(eq(schema.dayLogs.dayKey, dayKey));
}

// ─── prompts — câu gợi ý nhật ký ───────────────────────────────────────────

export async function listActivePrompts() {
  return db
    .select()
    .from(schema.prompts)
    .where(eq(schema.prompts.active, true))
    .orderBy(asc(schema.prompts.id));
}

// ─── Xuất dữ liệu — SPEC.md §5.5, thủ công ───────────────────────────────

export async function exportAllData() {
  const [
    profileRows,
    labelRows,
    habitRows,
    dailyTaskRows,
    sessionRows,
    habitEntryRows,
    dayLogRows,
    weekReviewRows,
    netWorthRows,
    chapterEventRows,
    settingsRows,
  ] = await Promise.all([
    db.select().from(schema.profile),
    db.select().from(schema.labels),
    db.select().from(schema.habits),
    db.select().from(schema.dailyTasks),
    db.select().from(schema.sessions).orderBy(desc(schema.sessions.startedAt)),
    db.select().from(schema.habitEntries),
    db.select().from(schema.dayLogs).orderBy(desc(schema.dayLogs.dayKey)),
    db.select().from(schema.weekReviews),
    db.select().from(schema.netWorthEntries),
    db.select().from(schema.chapterEvents),
    db.select().from(schema.settings),
  ]);
  return {
    exportedAt: new Date(now()).toISOString(),
    profile: profileRows,
    labels: labelRows,
    habits: habitRows,
    dailyTasks: dailyTaskRows,
    sessions: sessionRows,
    habitEntries: habitEntryRows,
    dayLogs: dayLogRows,
    weekReviews: weekReviewRows,
    netWorthEntries: netWorthRows,
    chapterEvents: chapterEventRows,
    settings: settingsRows,
  };
}

// ─── Bản ghi thô cho core/engine/ — SPEC.md §8.1, §8.4 ────────────────────
// Tầng DỊCH duy nhất giữa bảng Postgres và kiểu `EngineRawData` engine cần. `core/engine/` không
// biết gì về Drizzle/Postgres — mọi decode (day_key ép kiểu DayKey, journalText → boolean,
// timestamp → dayKey) nằm ở đây, không rải trong component/action.

export async function getEngineRawData(): Promise<EngineRawData> {
  const [profileRow, labelRows, habitRows, dailyTaskRows, sessionRows, habitEntryRows, dayLogRows, weekReviewRows] =
    await Promise.all([
      db.select().from(schema.profile).limit(1),
      db.select().from(schema.labels),
      db.select().from(schema.habits),
      db.select().from(schema.dailyTasks).where(eq(schema.dailyTasks.active, true)),
      db
        .select({ dayKey: schema.sessions.dayKey, labelId: schema.sessions.labelId })
        .from(schema.sessions)
        .where(eq(schema.sessions.status, "completed")),
      db.select().from(schema.habitEntries),
      db.select().from(schema.dayLogs),
      db.select().from(schema.weekReviews),
    ]);

  const profile = profileRow[0];
  if (!profile) throw new Error("Chưa có profile — chạy `npm run db:seed` trước.");

  return {
    profileStartedDayKey: dayKeyOf(profile.startedAt.getTime()),
    labels: labelRows.map((l) => ({ id: l.id, stat: l.stat })),
    habits: habitRows.map((h) => ({ id: h.id, slug: h.slug, stat: h.stat, kind: h.kind })),
    dailyTasks: dailyTaskRows.map((t) => ({ refType: t.refType, refId: t.refId, threshold: t.threshold })),
    completedSessions: sessionRows.map((s) => ({ dayKey: s.dayKey as DayKey, labelId: s.labelId })),
    habitEntries: habitEntryRows.map((e) => ({
      dayKey: e.dayKey as DayKey,
      habitId: e.habitId,
      score: e.score,
      done: e.done,
    })),
    dayLogs: dayLogRows.map((d) => ({
      dayKey: d.dayKey as DayKey,
      hasJournalText: (d.journalText?.trim().length ?? 0) > 0,
      closedAtMs: d.closedAt ? d.closedAt.getTime() : null,
    })),
    weekReviews: weekReviewRows.map((w) => ({
      weekStart: w.weekStart as DayKey,
      createdAtDayKey: dayKeyOf(w.createdAt.getTime()),
    })),
  };
}

export async function getRoomItemsCatalog(): Promise<RoomItemCatalogEntry[]> {
  const rows = await db.select().from(schema.roomItems);
  return rows.map((r) => ({ id: r.id, stat: r.stat, modelKey: r.modelKey, unlockLevel: r.unlockLevel }));
}
