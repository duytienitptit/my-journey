import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { setClockOverride } from "../../core/clock";
import type { DayKey } from "../../core/types";

// Never infer a target from DATABASE_URL: destructive integration tests require an explicit,
// dedicated local review database. These tests are skipped in the normal unit-test command.
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
let q: typeof import("../../db/queries");
let sql: ReturnType<typeof postgres>;
let baseline: Awaited<ReturnType<typeof import("../../db/queries").exportAllData>>;
const day = "2026-09-30" as DayKey;

suite("isolated Postgres regressions", () => {
  beforeAll(async () => {
    const target = new URL(url!);
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/^\/myjourney_review_\d+$/.test(target.pathname)) {
      throw new Error("Refusing to test against anything except a dedicated local myjourney_review_<date> database.");
    }
    process.env.DATABASE_URL = url;
    sql = postgres(url!, { max: 5 });
    q = await import("../../db/queries");
    baseline = await q.exportAllData();
  });
  beforeEach(async () => {
    setClockOverride(Date.parse("2026-09-30T20:00:00+07:00"));
    await q.importAllData(baseline);
  });
  afterAll(async () => {
    setClockOverride(null);
    if (q && baseline) await q.importAllData(baseline);
    if (sql) await sql.end();
  });
  it("invalid import cannot delete existing records", async () => {
    await expect(q.importAllData({ profile: [], labels: [] })).rejects.toThrow();
    expect((await q.exportAllData()).labels).toEqual(baseline.labels);
    expect((await q.exportAllData()).profile).toEqual(baseline.profile);
  });
  it("restores journal prompt references and resets sequences in the transaction", async () => {
    const prompt = baseline.prompts[0];
    await q.upsertJournal(day, "A saved journal", prompt.id);
    const snapshot = await q.exportAllData();
    await q.importAllData(JSON.parse(JSON.stringify(snapshot)));
    expect((await q.getDayLog(day))?.journalPromptId).toBe(prompt.id);
    expect((await q.getDayLog(day))?.journalText).toBe("A saved journal");
    const label = await q.createLabel({ name: "After restore", emoji: "", color: "#000000", stat: "mind" });
    expect(label.id).toBeGreaterThan(Math.max(...snapshot.labels.map((l) => l.id)));
  });
  it("only one of two concurrent starts can succeed", async () => {
    const results = await Promise.allSettled([q.startSession(baseline.labels[0].id), q.startSession(baseline.labels[0].id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rows = await sql`select id from sessions where status = 'running'`;
    expect(rows).toHaveLength(1);
  });
  it("rejects early completion and completes a forgotten session using its stored deadline", async () => {
    const session = await q.startSession(baseline.labels[0].id);
    expect(await q.finalizeSession(session.id)).toBe(false);
    expect((await q.getActiveSession())?.id).toBe(session.id);
    setClockOverride(session.endsAt.getTime());
    expect(await q.getActiveSession()).toBeNull();
    const [row] = await sql`select status, ended_at, ends_at from sessions where id = ${session.id}`;
    expect(row.status).toBe("completed");
    expect(row.ended_at).toEqual(row.ends_at);
  });
  it("keeps bedtime checkbox and task threshold consistent after settings changes", async () => {
    const sleep = baseline.habits.find((h) => h.slug === "sleep-enough")!;
    const task = baseline.dailyTasks.find((t) => t.refType === "habit" && t.refId === sleep.id)!;
    await q.updateDailyTaskThreshold(task.id, 5);
    expect((await q.listDailyTasksWithRef()).find((t) => t.id === task.id)?.threshold).toBe(4);
    await q.upsertHabitScore(sleep.id, day, 4);
    expect((await q.getEngineRawData()).dailyTasks.find((t) => t.refType === "habit" && t.refId === sleep.id)?.threshold).toBe(4);
  });
  it("enforces bedtime cutoff on server, including a stale page and yesterday", async () => {
    const sleep = baseline.habits.find((h) => h.slug === "sleep-enough")!;
    setClockOverride(Date.parse("2026-09-30T22:29:59+07:00"));
    await q.upsertHabitScore(sleep.id, day, 4);
    setClockOverride(Date.parse("2026-09-30T22:30:00+07:00"));
    await expect(q.upsertHabitScore(sleep.id, day, 4)).rejects.toThrow(/22:30/);
    await q.upsertHabitScore(sleep.id, day, 1); // Correct an accidental check-in without adding credit.
    setClockOverride(Date.parse("2026-10-01T08:00:00+07:00"));
    await expect(q.upsertHabitScore(sleep.id, day, 4)).rejects.toThrow(/backfilled/);
  });
});
