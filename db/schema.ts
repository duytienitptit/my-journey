/**
 * Schema Postgres — SPEC.md §7, đầy đủ (mốc 2 dựng bảng dùng ngay: profile, labels, habits,
 * daily_tasks, sessions, habit_entries, day_logs, settings, prompts. Các bảng còn lại
 * (week_reviews, net_worth_entries, chapter_events, room_items, rare_items) tạo sẵn cho mốc
 * 3/5/6/8, chưa có code nào ghi/đọc chúng ở mốc này).
 *
 * §8.1 — KHÔNG có cột XP/cấp/giai đoạn/chuỗi ở đâu trong file này. Mọi con số đó tính lại từ
 * các bảng dưới đây mỗi lần đọc (core/engine/, mốc 3+). Thêm một cột XP vào đây là phá luật.
 *
 * Mọi mốc thời gian dùng `timestamp({ withTimezone: true })` — Postgres lưu UTC nội bộ dù
 * client gửi giờ nào (§4.10). `day_key` là cột riêng (`YYYY-MM-DD`), tính bằng
 * `core/day.ts#dayKeyOf` ở tầng ứng dụng lúc ghi — KHÔNG phải cột sinh tự động trong Postgres,
 * để mốc 4 giờ sáng chỉ có một nơi định nghĩa (§8.3).
 */

import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ─── Enum ────────────────────────────────────────────────────────────────

/** Ba chỉ số — SPEC.md §4.1, tên chốt ở §8.5. Khớp `StatKey` trong core/types.ts. */
export const statEnum = pgEnum("stat", ["mind", "health", "spirit"]);

export const habitKindEnum = pgEnum("habit_kind", ["score_1_5", "boolean", "journal"]);

export const dailyTaskRefTypeEnum = pgEnum("daily_task_ref_type", ["label", "habit"]);

export const sessionSourceEnum = pgEnum("session_source", ["timer", "manual"]);

export const sessionStatusEnum = pgEnum("session_status", [
  "running",
  "completed",
  "abandoned",
]);

// ─── profile — SPEC.md §7 ────────────────────────────────────────────────

export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarConfig: jsonb("avatar_config").notNull().default({}),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  /** Số tài sản mặc định làm mờ (§4.9) — mặc định true, đúng "mặc định làm mờ". */
  hideMoney: boolean("hide_money").notNull().default(true),
});

// ─── labels — nhãn pomodoro, SPEC.md §4.2 ────────────────────────────────

export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  color: text("color").notNull(),
  stat: statEnum("stat").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
});

// ─── habits — thói quen chấm buổi tối, SPEC.md §4.2 ──────────────────────

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  stat: statEnum("stat").notNull(),
  kind: habitKindEnum("kind").notNull(),
  archived: boolean("archived").notNull().default(false),
});

// ─── daily_tasks — 6 việc trong ngày, SPEC.md §4.5, §12.4 ────────────────
// MỘT BẢNG, không phải hằng số trong code — bản trước hỏng đúng chỗ này.
// `refId` trỏ tới labels.id HOẶC habits.id tuỳ `refType` — không thể đặt FK thật cho tham
// chiếu đa hình kiểu này; ràng buộc đúng bảng nằm ở tầng ứng dụng (db/queries.ts).

export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  refType: dailyTaskRefTypeEnum("ref_type").notNull(),
  refId: integer("ref_id").notNull(),
  /** Ngưỡng đạt — số phiên (nhãn) hoặc điểm 1-5 (thói quen chấm điểm). NULL cho habit kind=journal
   *  (đạt = có chữ, không có ngưỡng số — SPEC.md §4.5). */
  threshold: integer("threshold"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ─── sessions — phiên pomodoro, SPEC.md §4.3, §4.4 ───────────────────────

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  labelId: integer("label_id")
    .notNull()
    .references(() => labels.id),
  dayKey: text("day_key").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  /** Mốc kết thúc DỰ KIẾN — đồng hồ đọc mốc này, không đếm lùi (§5.1). */
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  /** Mốc kết thúc THẬT — null khi còn đang chạy. */
  endedAt: timestamp("ended_at", { withTimezone: true }),
  plannedMinutes: integer("planned_minutes").notNull(),
  source: sessionSourceEnum("source").notNull(),
  status: sessionStatusEnum("status").notNull().default("running"),
});

// ─── habit_entries — chấm thói quen mỗi ngày, SPEC.md §7 ─────────────────
// "Viết nhật ký" (kind=journal) KHÔNG có dòng ở đây — đọc thẳng day_logs.journal_text.

export const habitEntries = pgTable(
  "habit_entries",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id),
    dayKey: text("day_key").notNull(),
    /** Dùng cho habit kind=score_1_5 (Sport, Sleep enough — SPEC.md §4.2). */
    score: integer("score"),
    /** Dùng cho habit kind=boolean (chưa có thói quen mặc định nào loại này). */
    done: boolean("done"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [unique().on(table.habitId, table.dayKey)],
);

// ─── day_logs — tâm trạng + nhật ký + đóng ngày, SPEC.md §7 ──────────────

export const dayLogs = pgTable(
  "day_logs",
  {
    id: serial("id").primaryKey(),
    dayKey: text("day_key").notNull(),
    /** 1-5, SPEC.md §11.2 câu Q18. Null nếu chưa chấm tâm trạng hôm đó. */
    mood: integer("mood"),
    journalText: text("journal_text"),
    journalPromptId: integer("journal_prompt_id").references(() => prompts.id),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [unique().on(table.dayKey)],
);

// ─── week_reviews — đúc kết tuần, dùng từ mốc 6 ──────────────────────────

export const weekReviews = pgTable(
  "week_reviews",
  {
    id: serial("id").primaryKey(),
    weekStart: text("week_start").notNull(), // DayKey của Thứ Hai đầu tuần
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [unique().on(table.weekStart)],
);

// ─── net_worth_entries — tài sản, dùng từ mốc 5 ──────────────────────────
// Giữ TOÀN BỘ lịch sử, đừng ghi đè (SPEC.md §4.9, §7).

// `bigint` KHÔNG PHẢI `integer` — bắt gặp lúc soi mốc 5: Postgres `integer` là số nguyên 32-bit,
// trần 2,147,483,647 (~2,1 tỉ), trong khi SPEC.md §4.9 tự đòi tới 26.000.000.000 (Chương 12,
// "Trưởng thành") — ghi bất kỳ số nào ≥ Chương 8 (3 tỉ) là lỗi ngay khi INSERT. `mode: "number"`
// vì 26 tỉ còn cách rất xa trần an toàn của JS number (2^53), không cần BigInt tay ở tầng ứng dụng.
export const netWorthEntries = pgTable("net_worth_entries", {
  id: serial("id").primaryKey(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  stocksVnd: bigint("stocks_vnd", { mode: "number" }).notNull(),
  goldVnd: bigint("gold_vnd", { mode: "number" }).notNull(),
  note: text("note"),
});

// ─── chapter_events — ngày chạm mỗi chương, dùng từ mốc 5 ────────────────
// Ghi MỘT LẦN, đừng bao giờ xoá (SPEC.md §4.9, §7).

export const chapterEvents = pgTable("chapter_events", {
  id: serial("id").primaryKey(),
  chapterIndex: integer("chapter_index").notNull().unique(),
  reachedAt: timestamp("reached_at", { withTimezone: true }).notNull(),
  snapshot: jsonb("snapshot").notNull(),
});

// ─── room_items — đồ đạc mở khoá theo cấp, dùng từ mốc 3 ─────────────────

export const roomItems = pgTable("room_items", {
  id: serial("id").primaryKey(),
  stat: statEnum("stat").notNull(),
  name: text("name").notNull(),
  modelKey: text("model_key").notNull(),
  unlockLevel: integer("unlock_level").notNull(),
});

// ─── rare_items — vật phẩm hiếm, dùng từ mốc 8 ───────────────────────────
// PHẢI lưu (§5.3) — không lưu thì mỗi lần tải trang con mèo lại biến thành chậu cây.

export const rareItems = pgTable("rare_items", {
  id: serial("id").primaryKey(),
  itemKey: text("item_key").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  trigger: text("trigger").notNull(),
});

// ─── prompts — câu gợi ý nhật ký, SPEC.md §5.1 ───────────────────────────

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category"),
  active: boolean("active").notNull().default(true),
});

// ─── settings — một dòng duy nhất (id cố định = 1) ───────────────────────

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  dailySessionGoal: integer("daily_session_goal").notNull(),
  sessionMinutes: integer("session_minutes").notNull(),
  breakMinutes: integer("break_minutes").notNull(),
  /** Giờ nhắc nghi thức tối (SPEC.md §6), giờ Việt Nam 0-23. Null = tắt nhắc. */
  reminderHour: integer("reminder_hour"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
