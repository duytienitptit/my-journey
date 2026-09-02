/**
 * Dữ liệu khởi đầu — chạy một lần: `npm run db:seed`. An toàn chạy lại (tự bỏ qua nếu đã có
 * dữ liệu, không tạo trùng).
 *
 * Đây là nơi DUY NHẤT định nghĩa nhãn/thói quen/6 việc/prompts mặc định. `components/timer/
 * labels.ts` (mốc 1, hard-code) đã bị xoá — từ mốc 2 trở đi DB là nguồn thật, đọc qua
 * `db/queries.ts` (§12.4: đừng viết cứng tên nhãn vào logic).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  BREAK_MINUTES_DEFAULT,
  DAILY_SESSION_GOAL_DEFAULT,
  DEFAULT_DAILY_TASK_THRESHOLDS,
  SESSION_MINUTES_DEFAULT,
} from "../core/balance";
import { now } from "../core/clock";
import * as schema from "./schema";

// Chữ hiển thị trong app bằng tiếng Anh (CLAUDE.md) — kể cả câu gợi ý nhật ký, dù nội dung
// nhật ký tôi viết là tiếng Việt hay tiếng Anh cũng tuỳ tôi, ô viết luôn để trắng.
export const JOURNAL_PROMPTS: Array<{ text: string; category: string }> = [
  { text: "Any moment today you'd want to keep?", category: "reflection" },
  { text: "What made you feel lighter today?", category: "reflection" },
  { text: "What did you put off today? Why?", category: "work" },
  { text: "When were you most focused today?", category: "work" },
  { text: "How's your body today — any part tired, any part strong?", category: "body" },
  { text: "What did you eat today, and did you actually enjoy it?", category: "body" },
  { text: "Did anyone make you smile today?", category: "people" },
  { text: "Did you think of someone today?", category: "mind" },
  { text: "What's taking up the most space in your head right now?", category: "mind" },
  { text: "Worried about something? Write it down and see if it shrinks.", category: "mind" },
  { text: "One small thing you're grateful for today.", category: "gratitude" },
  { text: "Did someone help you today, even a little?", category: "gratitude" },
  { text: "If today had a headline, what would it say?", category: "reflection" },
  { text: "What did you learn today, even something small?", category: "work" },
  { text: "Any decision today you're still unsure about?", category: "mind" },
  { text: "What's one thing you'd do differently tomorrow?", category: "future" },
  { text: "Did you make time for yourself today?", category: "body" },
  { text: "What didn't go the way you expected today?", category: "reflection" },
  { text: "What are you a little proud of today, even something small?", category: "work" },
  { text: "Any line or thought that stuck with you today?", category: "mind" },
  { text: "When did you laugh today?", category: "gratitude" },
  { text: "If today were a kind of weather, what would it be?", category: "reflection" },
  { text: "What did you do today only because you had to, not because you wanted to?", category: "work" },
  { text: "Have you rested enough, or are you still running on a sleep debt?", category: "body" },
  { text: "What are you looking forward to in the next few days?", category: "future" },
  { text: "Is there something about today you can let yourself off the hook for?", category: "mind" },
  { text: "Any conversation today worth remembering?", category: "people" },
  { text: "What are you avoiding right now?", category: "mind" },
  { text: "If you could say one thing to this morning's you, what would it be?", category: "reflection" },
  { text: "What made you feel like you're headed somewhere good today?", category: "future" },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL chưa đặt — xem .env.local");
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  const existingLabels = await db.select({ id: schema.labels.id }).from(schema.labels).limit(1);
  if (existingLabels.length > 0) {
    console.log("Đã có dữ liệu (labels không rỗng) — bỏ qua seed, không tạo trùng.");
    await client.end();
    return;
  }

  const nowInstant = new Date(now());

  await db.insert(schema.profile).values({
    displayName: "", // chưa hỏi — chốt ở Cài đặt, mốc 8
    startedAt: nowInstant,
  });

  const insertedLabels = await db
    .insert(schema.labels)
    .values([
      { slug: "english", name: "English", emoji: "🗣️", color: "#4f6f93", stat: "mind", sortOrder: 0 },
      { slug: "deep-work", name: "Deep work", emoji: "🎯", color: "#3f5a78", stat: "mind", sortOrder: 1 },
      {
        slug: "new-knowledge",
        name: "New knowledge",
        emoji: "📖",
        color: "#6b8bab",
        stat: "mind",
        sortOrder: 2,
      },
    ])
    .returning({ id: schema.labels.id, slug: schema.labels.slug });

  const insertedHabits = await db
    .insert(schema.habits)
    .values([
      { slug: "sport", name: "Sport", emoji: "🏃", stat: "health", kind: "score_1_5" },
      { slug: "sleep-enough", name: "Sleep enough", emoji: "😴", stat: "health", kind: "score_1_5" },
      { slug: "journal", name: "Journal", emoji: "📔", stat: "spirit", kind: "journal" },
    ])
    .returning({ id: schema.habits.id, slug: schema.habits.slug });

  const labelBySlug = Object.fromEntries(insertedLabels.map((l) => [l.slug, l.id]));
  const habitBySlug = Object.fromEntries(insertedHabits.map((h) => [h.slug, h.id]));

  // 6 việc trong ngày (§4.5) — MỘT BẢNG, đọc ở db/queries.ts, không viết cứng ở đâu khác (§12.4).
  await db.insert(schema.dailyTasks).values([
    {
      refType: "label",
      refId: labelBySlug["english"],
      threshold: DEFAULT_DAILY_TASK_THRESHOLDS.english,
      sortOrder: 0,
    },
    {
      refType: "label",
      refId: labelBySlug["deep-work"],
      threshold: DEFAULT_DAILY_TASK_THRESHOLDS.deepWork,
      sortOrder: 1,
    },
    {
      refType: "label",
      refId: labelBySlug["new-knowledge"],
      threshold: DEFAULT_DAILY_TASK_THRESHOLDS.newKnowledge,
      sortOrder: 2,
    },
    {
      refType: "habit",
      refId: habitBySlug["sport"],
      threshold: DEFAULT_DAILY_TASK_THRESHOLDS.sport,
      sortOrder: 3,
    },
    {
      refType: "habit",
      refId: habitBySlug["sleep-enough"],
      threshold: DEFAULT_DAILY_TASK_THRESHOLDS.sleepEnough,
      sortOrder: 4,
    },
    {
      refType: "habit",
      refId: habitBySlug["journal"],
      threshold: null, // đạt = có chữ trong ô nhật ký, không có ngưỡng số (§4.5)
      sortOrder: 5,
    },
  ]);

  await db.insert(schema.settings).values({
    id: 1,
    dailySessionGoal: DAILY_SESSION_GOAL_DEFAULT,
    sessionMinutes: SESSION_MINUTES_DEFAULT,
    breakMinutes: BREAK_MINUTES_DEFAULT,
    reminderHour: 22, // "Nhắc nghi thức 22h" — SPEC.md §6
    updatedAt: nowInstant,
  });

  await db.insert(schema.prompts).values(JOURNAL_PROMPTS);

  // Đồ đạc mở khoá theo cấp — SPEC.md §4.8, 12 món đầu (4 mỗi chỉ số). Vị trí đặt trong phòng
  // ở components/room/roomItemPlacements.ts, model_key phải khớp components/room/models.ts.
  await db.insert(schema.roomItems).values([
    { stat: "mind", name: "A few books", modelKey: "books", unlockLevel: 1 },
    { stat: "mind", name: "Reading lamp", modelKey: "lampSquareFloor", unlockLevel: 2 },
    { stat: "mind", name: "Open bookcase", modelKey: "bookcaseOpen", unlockLevel: 3 },
    { stat: "mind", name: "Wall of books", modelKey: "bookcaseClosedWide", unlockLevel: 4 },
    { stat: "health", name: "Exercise mat", modelKey: "rugRound", unlockLevel: 1 },
    { stat: "health", name: "Bench", modelKey: "bench", unlockLevel: 2 },
    { stat: "health", name: "Floor cushion", modelKey: "pillowLong", unlockLevel: 3 },
    { stat: "health", name: "Fresh plant", modelKey: "plantSmall3", unlockLevel: 4 },
    { stat: "spirit", name: "Long pillow", modelKey: "pillowBlueLong", unlockLevel: 1 },
    { stat: "spirit", name: "Quiet corner chair", modelKey: "loungeChairRelax", unlockLevel: 2 },
    { stat: "spirit", name: "Small plant", modelKey: "plantSmall2", unlockLevel: 3 },
    { stat: "spirit", name: "Stuffed bear", modelKey: "bear", unlockLevel: 4 },
  ]);

  console.log(
    `Seed xong: ${insertedLabels.length} nhãn, ${insertedHabits.length} thói quen, 6 daily_tasks, 1 settings, ${JOURNAL_PROMPTS.length} prompts, 12 room_items.`,
  );
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
