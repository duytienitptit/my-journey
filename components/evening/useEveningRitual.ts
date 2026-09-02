"use client";

import { useEffect, useState } from "react";
import { now } from "@/core/clock";
import { addDays } from "@/core/day";
import type { DayKey } from "@/core/types";
import {
  closeDayAction,
  getEveningDataAction,
  saveHabitScoreAction,
  saveJournalAction,
  saveMoodAction,
  type EveningData,
} from "@/app/actions/evening";

/**
 * Nghi thức tối — SPEC.md §5.1 phần dưới. Ghi bù cho nghi thức tối được tới hôm nay HOẶC hôm
 * qua (§4.11), khác phiên pomodoro (chỉ hôm nay) — vì vậy có `selectedDay`, còn đồng hồ
 * (useSessionTimer) thì không.
 */

export type SelectedDay = "today" | "yesterday";

type Props = {
  todayKey: DayKey;
  /** Dữ liệu "today" đã tải sẵn từ Server Component — khỏi phải xin lại ngay lúc mở trang. */
  initialTodayData: EveningData;
  /** Gọi sau habit/journal/close — ba việc có thể đổi XP (§4.4). Tâm trạng KHÔNG đổi XP nên
   *  saveMood không gọi. Xem components/stats/useComputedStats.ts. */
  onXpMightHaveChanged?: () => void;
};

export function useEveningRitual({ todayKey, initialTodayData, onXpMightHaveChanged }: Props) {
  const yesterdayKey = addDays(todayKey, -1);
  const [selectedDay, setSelectedDay] = useState<SelectedDay>("today");
  const [dataByDay, setDataByDay] = useState<Record<SelectedDay, EveningData | null>>({
    today: initialTodayData,
    yesterday: null,
  });

  const dayKey = selectedDay === "today" ? todayKey : yesterdayKey;
  const data = dataByDay[selectedDay];

  // Chuyển sang "Hôm qua" lần đầu — tải dữ liệu ngày đó. Đây là cách DUY NHẤT lấy dữ liệu từ
  // bên ngoài (server) khi tôi đổi tab, không có lựa chọn nào khác ngoài effect.
  useEffect(() => {
    if (dataByDay[selectedDay]) return;
    let cancelled = false;
    void getEveningDataAction(selectedDay === "today" ? todayKey : yesterdayKey).then((fresh) => {
      if (cancelled) return;
      setDataByDay((prev) => ({ ...prev, [selectedDay]: fresh }));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDay, todayKey, yesterdayKey, dataByDay]);

  function patch(patchFn: (d: EveningData) => EveningData) {
    setDataByDay((prev) => {
      const current = prev[selectedDay];
      if (!current) return prev;
      return { ...prev, [selectedDay]: patchFn(current) };
    });
  }

  function saveHabitScore(habitId: number, score: number) {
    patch((d) => ({ ...d, habits: d.habits.map((h) => (h.id === habitId ? { ...h, score } : h)) }));
    void saveHabitScoreAction(habitId, dayKey, score).then(() => onXpMightHaveChanged?.());
  }

  function saveMood(mood: number) {
    patch((d) => ({ ...d, mood }));
    void saveMoodAction(dayKey, mood); // không đổi XP (§4.4) — không gọi onXpMightHaveChanged
  }

  function saveJournal(text: string) {
    patch((d) => ({ ...d, journalText: text }));
    void saveJournalAction(dayKey, text, data?.journalPrompt?.id ?? null).then(() => onXpMightHaveChanged?.());
  }

  function close() {
    const closedAtOptimistic = now(); // chỉ để hiện UI ngay — giá trị thật lấy từ server bên dưới
    patch((d) => ({ ...d, closedAt: closedAtOptimistic }));
    void closeDayAction(dayKey).then((realClosedAt) => {
      patch((d) => ({ ...d, closedAt: realClosedAt }));
      onXpMightHaveChanged?.();
    });
  }

  return { selectedDay, setSelectedDay, dayKey, data, saveHabitScore, saveMood, saveJournal, close };
}
