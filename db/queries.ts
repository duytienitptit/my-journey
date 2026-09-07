/**
 * Lớp truy cập dữ liệu — mọi đọc/ghi Postgres đi qua đây, không viết SQL/Drizzle rải rác trong
 * component hay server action (§8.4: giữ ranh giới DB tách khỏi mọi thứ khác rõ ràng).
 *
 * File này KHÔNG phải "hàm thuần" (đụng DB thật) nên không nằm trong `core/`. Nó gọi các hàm
 * thuần ở `core/` (dayKeyOf, isSessionComplete…) để tính toán, rồi mới đọc/ghi.
 */
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import { chapterForNetWorth, chaptersNewlyReached, totalNetWorth } from "@/core/engine/chapters";
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
  /** Chỉ có khi refType="habit" — Cài đặt (mốc 8) cần biết đây là habit "journal" (đạt = có
   *  chữ, không có ngưỡng số, §4.5) để không vẽ ô nhập ngưỡng cho dòng này. */
  habitKind: "score_1_5" | "boolean" | "journal" | null;
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
        habitKind: t.refType === "habit" ? (ref as (typeof habitRows)[number]).kind : null,
      },
    ];
  });
}

export async function getSettings() {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.id, 1)).limit(1);
  return rows[0] ?? null;
}

// ─── Cài đặt: nhãn/thói quen/6 việc/câu gợi ý/độ dài phiên — mốc 8, SPEC.md §5.6 ──
// §12.4: thêm/xoá/đổi tên nhãn không được làm hỏng phép tính "ngày đạt" — engine đọc mọi thứ
// động từ DB (id, không phải tên), nên CRUD ở đây an toàn với foldTimeline/dayAchieved.

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu tiếng Việt nếu tên có dấu (NFD tách dấu ra thành ký tự riêng ở dải này)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return base || "item";
}

async function uniqueSlug(base: string, table: typeof schema.labels | typeof schema.habits): Promise<string> {
  let slug = slugify(base);
  let suffix = 2;
  while (true) {
    const existing = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
    if (existing.length === 0) return slug;
    slug = `${slugify(base)}-${suffix++}`;
  }
}

export async function createLabel(input: { name: string; emoji: string; color: string; stat: StatKey }) {
  const slug = await uniqueSlug(input.name, schema.labels);
  const rows = await db.select({ v: schema.labels.sortOrder }).from(schema.labels).orderBy(desc(schema.labels.sortOrder)).limit(1);
  const [row] = await db
    .insert(schema.labels)
    .values({ ...input, slug, sortOrder: (rows[0]?.v ?? 0) + 1 })
    .returning();
  return row;
}

export async function updateLabel(id: number, input: { name: string; emoji: string; color: string; stat: StatKey }) {
  await db.update(schema.labels).set(input).where(eq(schema.labels.id, id));
}

/** Không xoá thật (khoá ngoại từ sessions) — đánh dấu lưu trữ + tự gỡ khỏi "6 việc" nếu có. */
export async function archiveLabel(id: number) {
  await db.update(schema.labels).set({ archived: true }).where(eq(schema.labels.id, id));
  await db
    .update(schema.dailyTasks)
    .set({ active: false })
    .where(and(eq(schema.dailyTasks.refType, "label"), eq(schema.dailyTasks.refId, id)));
}

export async function createHabit(input: { name: string; emoji: string; stat: StatKey; kind: "score_1_5" | "boolean" }) {
  const slug = await uniqueSlug(input.name, schema.habits);
  const [row] = await db.insert(schema.habits).values({ ...input, slug }).returning();
  return row;
}

export async function updateHabit(id: number, input: { name: string; emoji: string; stat: StatKey }) {
  await db.update(schema.habits).set(input).where(eq(schema.habits.id, id));
}

export async function archiveHabit(id: number) {
  await db.update(schema.habits).set({ archived: true }).where(eq(schema.habits.id, id));
  await db
    .update(schema.dailyTasks)
    .set({ active: false })
    .where(and(eq(schema.dailyTasks.refType, "habit"), eq(schema.dailyTasks.refId, id)));
}

export async function addDailyTask(input: { refType: "label" | "habit"; refId: number; threshold: number | null }) {
  const rows = await db
    .select({ v: schema.dailyTasks.sortOrder })
    .from(schema.dailyTasks)
    .orderBy(desc(schema.dailyTasks.sortOrder))
    .limit(1);
  await db.insert(schema.dailyTasks).values({ ...input, sortOrder: (rows[0]?.v ?? 0) + 1, active: true });
}

export async function updateDailyTaskThreshold(id: number, threshold: number | null) {
  await db.update(schema.dailyTasks).set({ threshold }).where(eq(schema.dailyTasks.id, id));
}

/** "Xoá" khỏi 6 việc = active=false, không xoá dòng — giữ đúng tinh thần không xoá thật ở đây. */
export async function removeDailyTask(id: number) {
  await db.update(schema.dailyTasks).set({ active: false }).where(eq(schema.dailyTasks.id, id));
}

export async function listAllPrompts() {
  return db.select().from(schema.prompts).where(eq(schema.prompts.active, true)).orderBy(asc(schema.prompts.id));
}

export async function createPrompt(text: string, category: string | null) {
  await db.insert(schema.prompts).values({ text, category, active: true });
}

export async function updatePromptText(id: number, text: string) {
  await db.update(schema.prompts).set({ text }).where(eq(schema.prompts.id, id));
}

export async function deactivatePrompt(id: number) {
  await db.update(schema.prompts).set({ active: false }).where(eq(schema.prompts.id, id));
}

export async function updateSettingsRow(input: {
  sessionMinutes: number;
  dailySessionGoal: number;
  reminderHour: number | null;
}) {
  await db
    .update(schema.settings)
    .set({ ...input, updatedAt: new Date(now()) })
    .where(eq(schema.settings.id, 1));
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
    promptRows,
    rareItemRows,
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
    db.select().from(schema.prompts),
    db.select().from(schema.rareItems),
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
    prompts: promptRows,
    rareItems: rareItemRows,
  };
}

export type ExportedData = Awaited<ReturnType<typeof exportAllData>>;

function toDate(v: string | Date | null): Date | null {
  if (v === null) return null;
  return v instanceof Date ? v : new Date(v);
}

/**
 * NHẬP dữ liệu — thay thế TOÀN BỘ bằng một bản đã xuất trước đó (§5.6, §8.5: "bản xuất JSON
 * hằng tuần là lưới an toàn duy nhất" vì app công khai ai cũng sửa được). Trong MỘT transaction:
 * xoá sạch rồi chèn lại ĐÚNG id cũ (giữ nguyên quan hệ sessions/habit_entries ↔ labels/habits),
 * chỉnh lại các sequence sau khi chèn để lần tạo mới tiếp theo không trùng id với dữ liệu vừa
 * nhập. KHÔNG gộp với dữ liệu hiện có — đúng ngữ nghĩa "khôi phục từ bản sao lưu", không phải
 * "hợp nhất hai nguồn". Tầng gọi (Server Action) chịu trách nhiệm xác nhận với người dùng trước.
 */
export async function importAllData(data: ExportedData): Promise<void> {
  await db.transaction(async (tx) => {
    // Xoá theo thứ tự phụ thuộc khoá ngoại — bảng con trước, bảng cha sau.
    await tx.delete(schema.chapterEvents);
    await tx.delete(schema.netWorthEntries);
    await tx.delete(schema.weekReviews);
    await tx.delete(schema.dayLogs);
    await tx.delete(schema.habitEntries);
    await tx.delete(schema.sessions);
    await tx.delete(schema.dailyTasks);
    await tx.delete(schema.rareItems);
    await tx.delete(schema.prompts);
    await tx.delete(schema.habits);
    await tx.delete(schema.labels);
    await tx.delete(schema.profile);
    await tx.delete(schema.settings);

    if (data.profile?.length) {
      await tx
        .insert(schema.profile)
        .values(data.profile.map((p) => ({ ...p, startedAt: toDate(p.startedAt)! })));
    }
    if (data.labels?.length) await tx.insert(schema.labels).values(data.labels);
    if (data.habits?.length) await tx.insert(schema.habits).values(data.habits);
    if (data.dailyTasks?.length) await tx.insert(schema.dailyTasks).values(data.dailyTasks);
    if (data.sessions?.length) {
      await tx.insert(schema.sessions).values(
        data.sessions.map((s) => ({ ...s, startedAt: toDate(s.startedAt)!, endsAt: toDate(s.endsAt)!, endedAt: toDate(s.endedAt) })),
      );
    }
    if (data.habitEntries?.length) {
      await tx.insert(schema.habitEntries).values(data.habitEntries.map((e) => ({ ...e, updatedAt: toDate(e.updatedAt)! })));
    }
    if (data.dayLogs?.length) {
      await tx.insert(schema.dayLogs).values(data.dayLogs.map((d) => ({ ...d, closedAt: toDate(d.closedAt) })));
    }
    if (data.weekReviews?.length) {
      await tx.insert(schema.weekReviews).values(data.weekReviews.map((w) => ({ ...w, createdAt: toDate(w.createdAt)! })));
    }
    if (data.netWorthEntries?.length) {
      await tx
        .insert(schema.netWorthEntries)
        .values(data.netWorthEntries.map((n) => ({ ...n, recordedAt: toDate(n.recordedAt)! })));
    }
    if (data.chapterEvents?.length) {
      await tx
        .insert(schema.chapterEvents)
        .values(data.chapterEvents.map((c) => ({ ...c, reachedAt: toDate(c.reachedAt)! })));
    }
    if (data.prompts?.length) await tx.insert(schema.prompts).values(data.prompts);
    if (data.rareItems?.length) {
      await tx.insert(schema.rareItems).values(data.rareItems.map((r) => ({ ...r, receivedAt: toDate(r.receivedAt)! })));
    }
    if (data.settings?.length) {
      await tx
        .insert(schema.settings)
        .values(data.settings.map((s) => ({ ...s, updatedAt: toDate(s.updatedAt)! })));
    }
  });

  // Serial id đã chèn THẲNG từ file nhập (giữ đúng quan hệ) — sequence của mỗi bảng cần chỉnh
  // lại về sau MAX(id) hiện có, nếu không lần INSERT tự-sinh-id tiếp theo sẽ trùng id vừa nhập.
  const idTables = [
    "profile",
    "labels",
    "habits",
    "daily_tasks",
    "sessions",
    "habit_entries",
    "day_logs",
    "week_reviews",
    "net_worth_entries",
    "chapter_events",
    "prompts",
    "rare_items",
  ];
  for (const table of idTables) {
    await db.execute(
      sql.raw(
        `select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 1), (select max(id) from ${table}) is not null)`,
      ),
    );
  }
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
        .select({ dayKey: schema.sessions.dayKey, labelId: schema.sessions.labelId, source: schema.sessions.source })
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
    completedSessions: sessionRows.map((s) => ({ dayKey: s.dayKey as DayKey, labelId: s.labelId, source: s.source })),
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
      mood: d.mood,
      journalText: d.journalText,
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

// ─── Tài sản + chương — SPEC.md §4.9, dùng từ mốc 5 ───────────────────────
// KHÔNG đi qua getEngineRawData()/foldTimeline() — chương bám giá trị HIỆN TẠI (bản ghi mới
// nhất), không phải một phép fold theo ngày như XP (core/engine/chapters.ts giải thích kỹ hơn).

export type NetWorthSnapshot = { stocksVnd: number; goldVnd: number; totalVnd: number; recordedAtMs: number };

/** Bản ghi tài sản MỚI NHẤT — nhà bám theo giá trị NÀY, không phải mốc cao nhất (§4.9). `null` nếu chưa từng nhập. */
export async function getLatestNetWorth(): Promise<NetWorthSnapshot | null> {
  const rows = await db
    .select()
    .from(schema.netWorthEntries)
    .orderBy(desc(schema.netWorthEntries.recordedAt))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    stocksVnd: row.stocksVnd,
    goldVnd: row.goldVnd,
    totalVnd: totalNetWorth(row.stocksVnd, row.goldVnd),
    recordedAtMs: row.recordedAt.getTime(),
  };
}

/** Chương CAO NHẤT đã từng có dòng trong `chapter_events` — 0 nếu chưa ghi gì (Chương 1 không ghi, xem chapters.ts). */
async function getMaxChapterEverReached(): Promise<number> {
  const rows = await db.select({ chapterIndex: schema.chapterEvents.chapterIndex }).from(schema.chapterEvents);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.chapterIndex));
}

export type SubmitNetWorthResult = { chapter: number; newlyReachedChapters: readonly number[] };

/**
 * Nhập một lần tài sản mới (§4.9: "nhập bất cứ khi nào tôi muốn, đừng bao giờ ép, không lùi
 * ngày") — LUÔN ghi thêm dòng mới vào `net_worth_entries`, giữ TOÀN BỘ lịch sử, không ghi đè.
 * Tự ghi `chapter_events` cho MỌI chương mới chạm kể cả chương trung gian (§11.1 câu Q30) —
 * đây là MỘT TRONG BA chỗ cố ý ghi DB không thuần (kế hoạch mốc 5), vì "chương cao nhất từng
 * chạm" không tính lại được bằng max() mỗi lần đọc (§4.9, bản trước sai đúng chỗ này).
 */
export async function submitNetWorthEntry(
  stocksVnd: number,
  goldVnd: number,
  note?: string,
): Promise<SubmitNetWorthResult> {
  const maxChapterBefore = await getMaxChapterEverReached();
  const recordedAt = new Date(now());
  await db.insert(schema.netWorthEntries).values({ recordedAt, stocksVnd, goldVnd, note: note ?? null });

  const total = totalNetWorth(stocksVnd, goldVnd);
  const newChapter = chapterForNetWorth(total);
  const newlyReachedChapters = chaptersNewlyReached(maxChapterBefore, newChapter);
  if (newlyReachedChapters.length > 0) {
    await db
      .insert(schema.chapterEvents)
      .values(
        newlyReachedChapters.map((chapterIndex) => ({
          chapterIndex,
          reachedAt: recordedAt,
          snapshot: { stocksVnd, goldVnd, totalVnd: total },
        })),
      )
      // Phòng hai request chồng nhau — chapterIndex là UNIQUE, ghi trùng thì bỏ qua thay vì lỗi.
      .onConflictDoNothing({ target: schema.chapterEvents.chapterIndex });
  }
  return { chapter: newChapter, newlyReachedChapters };
}

/** Số tài sản mặc định LUÔN HIỆN ([SỬA/CHỐT — 2026-09-05], §4.9) — đọc/ghi `profile.hide_money`,
 *  mặc định `false`. Một dòng profile duy nhất. */
export async function getHideMoney(): Promise<boolean> {
  const rows = await db.select({ hideMoney: schema.profile.hideMoney }).from(schema.profile).limit(1);
  return rows[0]?.hideMoney ?? false;
}

export async function setHideMoney(hide: boolean): Promise<void> {
  await db.update(schema.profile).set({ hideMoney: hide });
}

/** Hình dáng nhân vật đã chọn (mốc 8, §5.6) — lưu ở `profile.avatar_config.characterKey`, một
 *  trường jsonb tự do (§7) chứ không phải cột riêng. `null` nếu chưa từng chọn (dùng mặc định). */
export async function getCharacterLook(): Promise<string | null> {
  const rows = await db.select({ avatarConfig: schema.profile.avatarConfig }).from(schema.profile).limit(1);
  const config = rows[0]?.avatarConfig as { characterKey?: string } | undefined;
  return config?.characterKey ?? null;
}

export async function setCharacterLook(characterKey: string): Promise<void> {
  const rows = await db.select({ avatarConfig: schema.profile.avatarConfig }).from(schema.profile).limit(1);
  const current = (rows[0]?.avatarConfig as Record<string, unknown> | undefined) ?? {};
  await db.update(schema.profile).set({ avatarConfig: { ...current, characterKey } });
}

// ─── week_reviews — đúc kết tuần, SPEC.md §5.2, dùng từ mốc 6 ─────────────

export async function getWeekReview(weekStart: DayKey): Promise<{ text: string } | null> {
  const rows = await db
    .select({ text: schema.weekReviews.text })
    .from(schema.weekReviews)
    .where(eq(schema.weekReviews.weekStart, weekStart))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Không khoá ngày lại (§11.2 câu Q16) — sửa được nhiều lần trong tuần, giống nhật ký. CHỈ cập
 * nhật `text` khi đã có dòng — GIỮ NGUYÊN `created_at` gốc, vì đó là "ngày viết" mà `foldTimeline`
 * đọc để tính +100 XP (§4.4) và điều kiện tuần trọn vẹn (§4.6); nếu bump theo mỗi lần sửa, sửa
 * đúc kết muộn vài ngày sẽ âm thầm dời khoản XP đó sang ngày khác.
 */
export async function upsertWeekReview(weekStart: DayKey, text: string): Promise<void> {
  await db
    .insert(schema.weekReviews)
    .values({ weekStart, text, createdAt: new Date(now()) })
    .onConflictDoUpdate({ target: schema.weekReviews.weekStart, set: { text } });
}

// ─── chapter_events — thư viện hành trình, SPEC.md §5.4, dùng từ mốc 7 ────
// Ghi ở mốc 5 (submitNetWorthEntry), ĐỌC LẠI lần đầu ở đây — xem core/engine/journeyLibrary.ts.

export type ChapterEventRow = { chapterIndex: number; reachedAtDayKey: DayKey; snapshotTotalVnd: number };

export async function listChapterEvents(): Promise<ChapterEventRow[]> {
  const rows = await db
    .select()
    .from(schema.chapterEvents)
    .orderBy(asc(schema.chapterEvents.chapterIndex));
  return rows.map((r) => ({
    chapterIndex: r.chapterIndex,
    reachedAtDayKey: dayKeyOf(r.reachedAt.getTime()),
    // snapshot lưu dạng jsonb tự do (§7) — đọc lại đúng hình dạng đã ghi ở submitNetWorthEntry.
    snapshotTotalVnd: (r.snapshot as { totalVnd: number }).totalVnd,
  }));
}

// ─── Kho lưu trữ — SPEC.md §5.5, dùng từ mốc 7 ────────────────────────────

/** Mọi day_logs có CHỮ NHẬT KÝ trong khoảng [from, to] (hai đầu đều gồm), mới nhất trước. */
export async function listDayLogsInRange(fromDayKey: DayKey, toDayKey: DayKey) {
  return db
    .select()
    .from(schema.dayLogs)
    .where(and(gte(schema.dayLogs.dayKey, fromDayKey), lte(schema.dayLogs.dayKey, toDayKey)))
    .orderBy(desc(schema.dayLogs.dayKey));
}
