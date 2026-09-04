/**
 * ★ Bộ gấp theo ngày — trái tim của toàn bộ engine. SPEC.md §8.1: mọi con số tính lại từ bản
 * ghi thô mỗi lần đọc, bằng hàm thuần — không cache, không lưu XP. Hàm DUY NHẤT ở đây
 * (`foldTimeline`) duyệt từng ngày kể từ `profile.started_at` tới hôm nay, tính XP/cấp/giai
 * đoạn/chuỗi CỘNG DỒN, đúng thứ tự "cộng trước, trừ sau" mỗi ngày.
 *
 * Hai nhịp độ khác nhau cố tình tồn tại song song (đọc kỹ trước khi sửa gì ở đây):
 *   - XP (kể cả +30 "thưởng ngày đạt" và thưởng mốc chuỗi) tính SỐNG — hôm nay đóng góp ngay,
 *     y hệt phiên pomodoro vừa xong đã cộng điểm ngay lập tức.
 *   - CHUỖI HIỂN THỊ (dayAchievedStreak/journalStreak trả về) tính TỚI HẾT HÔM QUA (§4.6) — hôm
 *     nay chưa đổi số cho tới sáng mai. Vì vậy có HAI bộ đếm chuỗi chạy song song: một bộ SỐNG
 *     (advance mỗi ngày kể cả hôm nay) chỉ dùng nội bộ để biết CHÍNH XÁC ngày nào vừa chạm mốc
 *     mới — vì "chạm mốc" (để thưởng XP) là sự kiện sống, không chờ; một bộ HIỂN THỊ (advance
 *     tới hết hôm qua) là con số trả ra cho giao diện.
 */

import { STREAK_DAY_ACHIEVED_MILESTONES, STREAK_JOURNAL_MILESTONES, WEEK_PERFECT_BONUS } from "../balance";
import { addDays, dayKeyOf, enumerateDayKeys } from "../day";
import { STAT_KEYS, type DayKey, type StatKey } from "../types";
import { isRestWell, xpEarnedForDay } from "./xp";
import { isDayAchieved, isDayPerfect } from "./dayAchieved";
import { decayAmountForDay } from "./decay";
import { levelForXp, stageForTotalXp } from "./levels";
import {
  advanceDayAchievedStreak,
  advanceStreak,
  INITIAL_DAY_ACHIEVED_STREAK_STATE,
  INITIAL_STREAK_STATE,
  newlyReachedMilestone,
  type DayAchievedStreakState,
  type StreakState,
} from "./streaks";
import type {
  EngineRawData,
  LevelUpEvent,
  StageChangeEvent,
  StreakMilestoneEvent,
  TimelineResult,
} from "./types";

const ZERO_BY_STAT: Readonly<Record<StatKey, number>> = { mind: 0, health: 0, spirit: 0 };

function zeroByStat(): Record<StatKey, number> {
  return { ...ZERO_BY_STAT };
}

export function foldTimeline(raw: EngineRawData, nowMs: number): TimelineResult {
  const todayKey = dayKeyOf(nowMs);
  const allDays = enumerateDayKeys(raw.profileStartedDayKey, todayKey);

  // ─── Bảng tra cứu ────────────────────────────────────────────────────────
  const labelStatById = new Map(raw.labels.map((l) => [l.id, l.stat]));
  const habitStatById = new Map(raw.habits.map((h) => [h.id, h.stat]));
  const habitKindById = new Map(raw.habits.map((h) => [h.id, h.kind]));
  const journalHabit = raw.habits.find((h) => h.kind === "journal");
  const journalHabitId = journalHabit?.id ?? null;

  // Sport/Sleep enough cho công thức "nghỉ ngơi đúng cách" — SPEC.md §4.7 nêu đích danh hai
  // thói quen này (khác daily_tasks vốn cố ý tổng quát). Nhận qua slug vì slug là định danh ổn
  // định hơn tên hiển thị (tên đổi được qua Cài đặt — §4.2). Nếu sau này chủ dự án xoá/đổi slug
  // hai thói quen này qua Cài đặt (mốc 8), công thức này cần xét lại — đã ghi ở SPEC.md §4.7.
  const sportHabit = raw.habits.find((h) => h.slug === "sport");
  const sleepHabit = raw.habits.find((h) => h.slug === "sleep-enough");

  // ─── Gom bản ghi thô theo ngày ───────────────────────────────────────────
  const sessionsByDay = groupBy(raw.completedSessions, (s) => s.dayKey);
  const habitEntriesByDay = groupBy(raw.habitEntries, (e) => e.dayKey);
  const dayLogByDay = new Map(raw.dayLogs.map((d) => [d.dayKey, d]));
  const weekReviewsByCreatedDay = groupBy(raw.weekReviews, (w) => w.createdAtDayKey);

  // ─── Pass 1 — "ngày đạt" + "ngày trọn vẹn 6/6" cho MỌI ngày (kể cả hôm nay, dùng dữ liệu tới
  // giờ) — "trọn vẹn" chỉ dùng để cứu chuỗi ngày-đạt sau 1 ngày ân hạn (isDayPerfect), tách khỏi
  // "đạt" thường (isDayAchieved, đã nới theo thứ trong tuần).
  const dayAchievedByDay = new Map<DayKey, boolean>();
  const dayPerfectByDay = new Map<DayKey, boolean>();
  for (const day of allDays) {
    const sessionCountByLabel = countByLabel(sessionsByDay.get(day) ?? []);
    const habitScoreByHabitId = scoreMapFor(habitEntriesByDay.get(day) ?? []);
    const hasJournalText = dayLogByDay.get(day)?.hasJournalText ?? false;
    const dayAchievedInput = {
      dayKey: day,
      dailyTasks: raw.dailyTasks,
      completedSessionCountByLabelId: sessionCountByLabel,
      habitScoreByHabitId,
      journalHabitId,
      hasJournalText,
    };
    dayAchievedByDay.set(day, isDayAchieved(dayAchievedInput));
    dayPerfectByDay.set(day, isDayPerfect(dayAchievedInput));
  }

  // ─── Pass 2 — gấp từng ngày ──────────────────────────────────────────────
  const xpByStat = zeroByStat();
  const consecutiveZeroDays = zeroByStat();
  const prevLevelByStat = zeroByStat();
  let prevStage = 1;

  let liveDayAchievedStreak: DayAchievedStreakState = INITIAL_DAY_ACHIEVED_STREAK_STATE;
  let liveJournalStreak: StreakState = INITIAL_STREAK_STATE;
  let displayDayAchievedStreak: DayAchievedStreakState = INITIAL_DAY_ACHIEVED_STREAK_STATE;
  let displayJournalStreak: StreakState = INITIAL_STREAK_STATE;

  const dayAchievedMilestonesAwarded = new Set<number>();
  const journalMilestonesAwarded = new Set<number>();
  const weekPerfectAwardedWeeks = new Set<DayKey>();

  const levelUps: LevelUpEvent[] = [];
  const stageChanges: StageChangeEvent[] = [];
  const streakMilestones: StreakMilestoneEvent[] = [];

  for (const day of allDays) {
    const isToday = day === todayKey;
    const dayAchievedToday = dayAchievedByDay.get(day) ?? false;
    const dayPerfectToday = dayPerfectByDay.get(day) ?? false;
    const hasJournalToday = dayLogByDay.get(day)?.hasJournalText ?? false;

    // Streak SỐNG advance trước — để biết "vừa chạm mốc mới" trước khi gộp vào XP hôm nay.
    liveDayAchievedStreak = advanceDayAchievedStreak(liveDayAchievedStreak, dayAchievedToday, dayPerfectToday);
    liveJournalStreak = advanceStreak(liveJournalStreak, hasJournalToday);

    const sessionsToday = sessionsByDay.get(day) ?? [];
    const habitEntriesToday = habitEntriesByDay.get(day) ?? [];
    const dayLogToday = dayLogByDay.get(day);
    const sportScore = sportHabit ? (scoreMapFor(habitEntriesToday).get(sportHabit.id) ?? null) : null;
    const sleepScore = sleepHabit ? (scoreMapFor(habitEntriesToday).get(sleepHabit.id) ?? null) : null;
    const weekReviewsToday = weekReviewsByCreatedDay.get(day) ?? [];

    const earned = xpEarnedForDay({
      completedSessionsToday: sessionsToday,
      labelStatById,
      dailyTasks: raw.dailyTasks,
      habitStatById,
      habitKindById,
      habitScoreByHabitId: scoreMapFor(habitEntriesToday),
      hasJournalText: hasJournalToday,
      closedToday: (dayLogToday?.closedAtMs ?? null) !== null,
      restWellToday: isRestWell(sportScore, sleepScore),
      weekReviewWrittenToday: weekReviewsToday.length > 0,
      dayAchievedToday,
    });

    // Thưởng mốc chuỗi — chạm mốc là sự kiện SỐNG, chia đều 3 chỉ số (chuỗi ngày-đạt) hoặc toàn
    // bộ Spirit (chuỗi nhật ký) — SPEC.md §4.6.
    if (dayAchievedToday) {
      const milestone = newlyReachedMilestone(
        liveDayAchievedStreak.current,
        STREAK_DAY_ACHIEVED_MILESTONES,
        dayAchievedMilestonesAwarded,
      );
      if (milestone !== null) {
        dayAchievedMilestonesAwarded.add(milestone);
        const bonus = STREAK_DAY_ACHIEVED_MILESTONES[milestone];
        const share = bonus / STAT_KEYS.length;
        for (const stat of STAT_KEYS) earned[stat] += share;
        streakMilestones.push({ dayKey: day, kind: "dayAchieved", milestone, xpAwarded: bonus });
      }
    }
    if (hasJournalToday) {
      const milestone = newlyReachedMilestone(
        liveJournalStreak.current,
        STREAK_JOURNAL_MILESTONES,
        journalMilestonesAwarded,
      );
      if (milestone !== null) {
        journalMilestonesAwarded.add(milestone);
        const bonus = STREAK_JOURNAL_MILESTONES[milestone];
        earned.spirit += bonus;
        streakMilestones.push({ dayKey: day, kind: "journal", milestone, xpAwarded: bonus });
      }
    }

    // Thưởng tuần trọn vẹn — chỉ xét tuần đã HOÀN TOÀN là quá khứ (không chứa hôm nay), để
    // "ngày đạt" của mọi ngày trong tuần đó đã chốt, không còn có thể đổi (§4.6).
    for (const review of weekReviewsToday) {
      if (weekPerfectAwardedWeeks.has(review.weekStart)) continue;
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(review.weekStart, i));
      const weekFullyPast = weekDays.every((d) => d < todayKey);
      if (!weekFullyPast) continue;
      const allAchieved = weekDays.every((d) => dayAchievedByDay.get(d) === true);
      if (allAchieved) {
        earned.spirit += WEEK_PERFECT_BONUS;
        weekPerfectAwardedWeeks.add(review.weekStart);
      }
    }

    // Cộng dồn + decay — CỘNG TRƯỚC, TRỪ SAU (chỉ số nhận XP hôm nay thì hôm nay không bị trừ).
    for (const stat of STAT_KEYS) {
      if (earned[stat] > 0) {
        xpByStat[stat] += earned[stat];
        consecutiveZeroDays[stat] = 0;
      } else {
        consecutiveZeroDays[stat] += 1;
        const currentLevel = levelForXp(xpByStat[stat]);
        const amount = decayAmountForDay(consecutiveZeroDays[stat], currentLevel);
        xpByStat[stat] = Math.max(0, xpByStat[stat] - amount);
      }
    }

    // Sự kiện lên/tụt cấp.
    for (const stat of STAT_KEYS) {
      const newLevel = levelForXp(xpByStat[stat]);
      if (newLevel !== prevLevelByStat[stat]) {
        levelUps.push({ dayKey: day, stat, fromLevel: prevLevelByStat[stat], toLevel: newLevel });
        prevLevelByStat[stat] = newLevel;
      }
    }

    // Sự kiện đổi giai đoạn.
    const totalXpToday = STAT_KEYS.reduce((sum, stat) => sum + xpByStat[stat], 0);
    const newStage = stageForTotalXp(totalXpToday);
    if (newStage !== prevStage) {
      stageChanges.push({ dayKey: day, fromStage: prevStage, toStage: newStage });
      prevStage = newStage;
    }

    // Chuỗi HIỂN THỊ — chỉ advance nếu đây không phải hôm nay (§4.6: tính tới hết hôm qua).
    if (!isToday) {
      displayDayAchievedStreak = advanceDayAchievedStreak(displayDayAchievedStreak, dayAchievedToday, dayPerfectToday);
      displayJournalStreak = advanceStreak(displayJournalStreak, hasJournalToday);
    }
  }

  const totalXp = STAT_KEYS.reduce((sum, stat) => sum + xpByStat[stat], 0);

  return {
    xpByStat,
    levelByStat: {
      mind: levelForXp(xpByStat.mind),
      health: levelForXp(xpByStat.health),
      spirit: levelForXp(xpByStat.spirit),
    },
    totalXp,
    stage: stageForTotalXp(totalXp),
    dayAchievedStreak: displayDayAchievedStreak,
    journalStreak: displayJournalStreak,
    events: { levelUps, stageChanges, streakMilestones },
  };
}

// ─── Hàm phụ trợ nội bộ ─────────────────────────────────────────────────────

function groupBy<T>(items: readonly T[], keyOf: (item: T) => DayKey): Map<DayKey, T[]> {
  const map = new Map<DayKey, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function countByLabel(sessions: readonly { labelId: number }[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const s of sessions) counts.set(s.labelId, (counts.get(s.labelId) ?? 0) + 1);
  return counts;
}

function scoreMapFor(entries: readonly { habitId: number; score: number | null }[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const e of entries) if (e.score !== null) map.set(e.habitId, e.score);
  return map;
}
