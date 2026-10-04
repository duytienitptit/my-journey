import type { ExportedData } from "@/db/queries";

type Wire<T> = T extends Date ? Date | string : T extends (infer U)[] ? Wire<U>[] : T extends object ? { [K in keyof T]: Wire<T[K]> } : T;
export type BackupData = Wire<ExportedData>;
type Row = Record<string, unknown>;
type Check = (value: unknown) => boolean;
const object = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const text: Check = (v) => typeof v === "string";
const bool: Check = (v) => typeof v === "boolean";
const int: Check = (v) => typeof v === "number" && Number.isSafeInteger(v);
const positive: Check = (v) => int(v) && (v as number) > 0;
const nonnegative: Check = (v) => int(v) && (v as number) >= 0;
const nullable = (check: Check): Check => (v) => v === null || check(v);
const choice = (...values: unknown[]): Check => (v) => values.includes(v);
const date: Check = (v) => (v instanceof Date || typeof v === "string") && Number.isFinite(new Date(v as string).getTime());
const day: Check = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && date(v) && new Date(v).toISOString().slice(0, 10) === v;
const score: Check = (v) => int(v) && (v as number) >= 1 && (v as number) <= 5;
const stat = choice("mind", "health", "spirit");

const tables: Record<string, Record<string, Check>> = {
  profile: { displayName: text, avatarConfig: object, startedAt: date, hideMoney: bool },
  labels: { slug: text, name: text, emoji: text, color: text, stat, sortOrder: int, archived: bool },
  habits: { slug: text, name: text, emoji: text, stat, kind: choice("score_1_5", "boolean", "journal"), archived: bool },
  dailyTasks: { refType: choice("label", "habit"), refId: positive, threshold: nullable(positive), sortOrder: int, active: bool },
  sessions: { labelId: positive, dayKey: day, startedAt: date, endsAt: date, endedAt: nullable(date), plannedMinutes: positive, source: choice("timer", "manual"), status: choice("running", "completed", "abandoned") },
  habitEntries: { habitId: positive, dayKey: day, score: nullable(score), done: nullable(bool), updatedAt: date },
  dayLogs: { dayKey: day, mood: nullable(score), journalText: nullable(text), journalPromptId: nullable(positive), closedAt: nullable(date) },
  weekReviews: { weekStart: day, text, createdAt: date },
  netWorthEntries: { recordedAt: date, stocksVnd: nonnegative, goldVnd: nonnegative, note: nullable(text) },
  chapterEvents: { chapterIndex: positive, reachedAt: date, snapshot: object },
  settings: { dailySessionGoal: positive, sessionMinutes: positive, breakMinutes: nonnegative, reminderHour: nullable((v) => int(v) && (v as number) >= 0 && (v as number) <= 23), updatedAt: date },
  prompts: { text, category: nullable(text), active: bool },
  rareItems: { itemKey: text, receivedAt: date, trigger: text },
};

/** Validate the entire backup BEFORE any delete. Legacy full exports remain supported. */
export function validateBackup(value: unknown): BackupData {
  if (!object(value) || !date(value.exportedAt)) throw new Error("Not a complete My Journey backup.");
  if (value.version !== undefined && value.version !== 1) throw new Error("Unsupported backup version.");
  const rows: Record<string, Row[]> = {};
  for (const [table, fields] of Object.entries(tables)) {
    const entries = value[table];
    if (!Array.isArray(entries)) throw new Error(`Backup is missing the ${table} table.`);
    const ids = new Set<unknown>();
    rows[table] = entries.map((entry) => {
      if (!object(entry) || !positive(entry.id) || ids.has(entry.id)) throw new Error(`Invalid or duplicate ID in ${table}.`);
      ids.add(entry.id);
      for (const [field, check] of Object.entries(fields)) {
        if (!check(entry[field])) throw new Error(`Invalid ${table}.${field}. Nothing was replaced.`);
      }
      return entry;
    });
  }
  if (rows.profile.length !== 1 || rows.profile[0].id !== 1 || rows.settings.length !== 1 || rows.settings[0].id !== 1) {
    throw new Error("Backup must contain one profile and one settings row (ID 1).");
  }
  const unique = (table: string, fields: string[]) => {
    const seen = new Set<string>();
    for (const row of rows[table]) {
      const key = JSON.stringify(fields.map((field) => row[field]));
      if (seen.has(key)) throw new Error(`Duplicate ${table} entry.`);
      seen.add(key);
    }
  };
  for (const table of ["labels", "habits"]) unique(table, ["slug"]);
  unique("habitEntries", ["habitId", "dayKey"]);
  unique("dayLogs", ["dayKey"]);
  unique("weekReviews", ["weekStart"]);
  unique("chapterEvents", ["chapterIndex"]);
  const hasId = (table: string, id: unknown) => rows[table].some((row) => row.id === id);
  const reference = (table: string, id: unknown) => {
    if (!hasId(table, id)) throw new Error(`Backup has a missing reference in ${table}.`);
  };
  for (const row of rows.sessions) reference("labels", row.labelId);
  for (const row of rows.habitEntries) reference("habits", row.habitId);
  for (const row of rows.dayLogs) if (row.journalPromptId !== null) reference("prompts", row.journalPromptId);
  for (const row of rows.dailyTasks) {
    const table = row.refType === "label" ? "labels" : "habits";
    reference(table, row.refId);
    const habit = table === "habits" ? rows.habits.find((h) => h.id === row.refId) : null;
    if ((habit?.kind === "journal") !== (row.threshold === null)) throw new Error("Invalid daily task threshold.");
    if (habit && habit.kind !== "journal" && !score(row.threshold)) throw new Error("Habit threshold must be 1–5.");
  }
  if (rows.sessions.filter((row) => row.status === "running").length > 1) throw new Error("Backup contains more than one running session.");
  for (const row of rows.sessions) {
    if (new Date(row.endsAt as string).getTime() < new Date(row.startedAt as string).getTime()) throw new Error("Invalid session dates.");
  }
  return value as unknown as BackupData;
}

export function backupSummary(data: BackupData): string {
  return `${data.sessions.length} sessions, ${data.dayLogs.length} daily entries, ${data.habitEntries.length} habit entries, ${data.weekReviews.length} weekly reviews`;
}
