/**
 * Kiểu dữ liệu THÔ mà `core/engine/` cần — không phải kiểu bảng DB (Drizzle) trực tiếp. Tầng
 * gọi (`db/queries.ts`) chịu trách nhiệm dịch bản ghi DB sang các kiểu này; engine không biết
 * gì về Postgres (§8.4).
 */

import type { DayKey, StatKey } from "../types";

export type HabitKind = "score_1_5" | "boolean" | "journal";

/** Một dòng trong `daily_tasks` — SPEC.md §4.5, §12.4: đọc từ đây, không viết cứng tên nhãn/thói quen. */
export type DailyTaskConfig = {
  refType: "label" | "habit";
  refId: number;
  /** null cho habit kind=journal — đạt = có chữ, không có ngưỡng số. */
  threshold: number | null;
};

/** Một nhãn — chỉ cần đủ để engine biết chỉ số của nó. */
export type LabelConfig = {
  id: number;
  stat: StatKey;
};

/**
 * Một thói quen — đủ để engine biết chỉ số + loại chấm của nó. `slug` chỉ dùng để tìm
 * "Sport"/"Sleep enough" cho công thức nghỉ ngơi (§4.7, xem ghi chú trong timeline.ts) — mọi
 * chỗ khác của engine không đọc theo tên/slug (§12.4).
 */
export type HabitConfig = {
  id: number;
  slug: string;
  stat: StatKey;
  kind: HabitKind;
};

/**
 * Một phiên đã hoàn thành (source timer hoặc manual — cả hai cùng mức XP, §4.4). `source` không
 * ảnh hưởng gì tới `foldTimeline` (chỉ đọc `labelId`) — thêm ở mốc 6 cho "% ghi bù" (§5.2,
 * `core/engine/weeklyStats.ts`), dùng chung một lần fetch thô duy nhất (§8.1).
 */
export type RawCompletedSession = {
  dayKey: DayKey;
  labelId: number;
  source: "timer" | "manual";
};

/** Một lần chấm thói quen (chỉ score_1_5 / boolean — journal đọc từ RawDayLog.hasJournalText). */
export type RawHabitEntry = {
  dayKey: DayKey;
  habitId: number;
  score: number | null;
  done: boolean | null;
};

export type RawDayLog = {
  dayKey: DayKey;
  hasJournalText: boolean;
  /** null nếu chưa đóng ngày hôm đó. */
  closedAtMs: number | null;
  /** null nếu chưa chấm tâm trạng hôm đó. `foldTimeline` không đọc field này — thêm ở mốc 6 cho
   *  đường cong tâm trạng + tương quan tuần (§5.2). */
  mood: number | null;
  /** Toàn văn nhật ký, hoặc null nếu trống. `foldTimeline` không đọc field này — thêm ở mốc 6 để
   *  trích vài dòng nhật ký trong tuần (§5.2). `hasJournalText` ở trên vẫn là nguồn thật cho mọi
   *  phép tính XP/ngày-đạt hiện có, đừng suy từ field này để tránh hai nguồn sự thật. */
  journalText: string | null;
};

export type RawWeekReview = {
  /** DayKey của Thứ Hai đầu tuần mà đúc kết này viết cho. */
  weekStart: DayKey;
  createdAtDayKey: DayKey;
};

/** Toàn bộ dữ liệu thô cần cho một lần fold — SPEC.md §8.1: tính lại từ đây mỗi lần đọc. */
export type EngineRawData = {
  profileStartedDayKey: DayKey;
  labels: readonly LabelConfig[];
  habits: readonly HabitConfig[];
  dailyTasks: readonly DailyTaskConfig[];
  completedSessions: readonly RawCompletedSession[];
  habitEntries: readonly RawHabitEntry[];
  dayLogs: readonly RawDayLog[];
  weekReviews: readonly RawWeekReview[];
};

// ─── Kết quả fold ─────────────────────────────────────────────────────────

export type StreakInfo = {
  current: number;
  longest: number;
};

/** Chuỗi ngày-đạt có thêm "nguy hiểm" (ân hạn 1 ngày, SPEC.md §4.6, [CHỐT — 2026-09-04]) — chuỗi
 *  nhật ký không có, vẫn dùng StreakInfo trơn. Xem streaks.ts#advanceDayAchievedStreak. */
export type DayAchievedStreakInfo = StreakInfo & {
  danger: boolean;
};

export type LevelUpEvent = {
  dayKey: DayKey;
  stat: StatKey;
  fromLevel: number;
  toLevel: number;
};

export type StageChangeEvent = {
  dayKey: DayKey;
  fromStage: number;
  toStage: number;
};

export type StreakMilestoneEvent = {
  dayKey: DayKey;
  kind: "dayAchieved" | "journal";
  milestone: number;
  xpAwarded: number;
};

export type TimelineResult = {
  /** XP hiện tại của từng chỉ số — đã trừ decay, sàn 0. */
  xpByStat: Record<StatKey, number>;
  levelByStat: Record<StatKey, number>;
  totalXp: number;
  stage: number;
  /** `.current` tính TỚI HẾT HÔM QUA (§4.6) — hôm nay đạt hay chưa không đổi số này, chỉ đổi
   *  sáng mai. XP thưởng ngày đạt (+30) thì KHÔNG chờ — cộng ngay hôm đó, xem timeline.ts. */
  dayAchievedStreak: DayAchievedStreakInfo;
  journalStreak: StreakInfo;
  events: {
    levelUps: readonly LevelUpEvent[];
    stageChanges: readonly StageChangeEvent[];
    streakMilestones: readonly StreakMilestoneEvent[];
  };
};
