import { describe, expect, it } from "vitest";
import { validateBackup } from "../../lib/backup";

export function validBackup() {
  const date = "2026-09-30T10:00:00Z";
  return {
    version: 1, exportedAt: date,
    profile: [{ id: 1, displayName: "Test", avatarConfig: {}, startedAt: date, hideMoney: false }],
    settings: [{ id: 1, dailySessionGoal: 4, sessionMinutes: 25, breakMinutes: 5, reminderHour: 22, updatedAt: date }],
    labels: [{ id: 1, slug: "english", name: "English", emoji: "", color: "#000000", stat: "mind", sortOrder: 0, archived: false }],
    habits: [], dailyTasks: [], sessions: [], habitEntries: [], dayLogs: [], weekReviews: [],
    netWorthEntries: [], chapterEvents: [], prompts: [], rareItems: [],
  };
}

describe("backup validation", () => {
  it("accepts complete new and legacy backups", () => {
    expect(validateBackup(validBackup()).profile).toHaveLength(1);
    const legacy: Record<string, unknown> = validBackup();
    delete legacy.version;
    expect(validateBackup(legacy).settings).toHaveLength(1);
  });
  it("rejects the destructive two-key file and missing tables", () => {
    expect(() => validateBackup({ profile: [], labels: [] })).toThrow();
    const missing: Record<string, unknown> = validBackup();
    delete missing.sessions;
    expect(() => validateBackup(missing)).toThrow(/sessions/);
  });
  it("requires the singleton rows, valid dates, enums, and unique IDs", () => {
    expect(() => validateBackup({ ...validBackup(), profile: [] })).toThrow();
    const invalidProfile = validBackup();
    invalidProfile.profile[0].id = 2;
    expect(() => validateBackup(invalidProfile)).toThrow(/profile/);
    const b = validBackup();
    b.settings[0].sessionMinutes = 0;
    expect(() => validateBackup(b)).toThrow();
    expect(() => validateBackup({ ...validBackup(), labels: [...validBackup().labels, ...validBackup().labels] })).toThrow();
    expect(() => validateBackup({ ...validBackup(), version: 999 })).toThrow();
  });
  it("rejects dangling references and invalid calendar dates", () => {
    const log = { id: 1, dayKey: "2026-09-30", mood: null, journalText: "test", journalPromptId: 99, closedAt: null };
    expect(() => validateBackup({ ...validBackup(), dayLogs: [log] })).toThrow(/reference/);
    expect(() => validateBackup({ ...validBackup(), dayLogs: [{ ...log, journalPromptId: null, dayKey: "2026-02-30" }] })).toThrow();
  });
});
