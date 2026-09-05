/**
 * Thư viện hành trình — SPEC.md §5.4, mốc 7. Mỗi chương một khung: nhân vật ở hình hài CUỐI
 * chương, tổng số phiên, ngày chạm chương, mốc tài sản cao nhất, vài dòng đã viết. Hàm thuần:
 * (bản ghi thô + chapter_events + chương hiện tại) → danh sách khung, không đụng DB.
 *
 * Chương 1 KHÔNG có dòng trong `chapter_events` (§4.9, §12.4/nguyên tắc "đừng bịa sự kiện cho
 * điểm xuất phát mặc định" — xem core/engine/chapters.ts) — tự tổng hợp một "mốc ảo" cho Chương 1
 * từ `profileStartedDayKey`, ghép vào ĐẦU danh sách trước khi xử lý, để mọi chương đều có một
 * "khoảng thời gian" rõ ràng (từ lúc chạm chương đó tới lúc chạm chương kế tiếp, hoặc tới hôm nay
 * nếu là chương đang sống).
 *
 * "Hình hài cuối chương" đọc bằng cách gọi LẠI `foldTimeline` với `nowMs` = cuối ngày cuối cùng
 * của chương đó (chương đang sống thì = hôm nay) — không lưu gì thêm, đúng tinh thần §8.1: một
 * bản ghi thô, tính lại ở BẤT KỲ điểm thời gian nào trong quá khứ đều cho kết quả đúng.
 */

import { addDays, endOfDayMs } from "../day";
import type { DayKey } from "../types";
import { effectiveCharacterStage } from "./chapters";
import { foldTimeline } from "./timeline";
import type { EngineRawData } from "./types";

export type ChapterEventInput = {
  chapterIndex: number;
  reachedAtDayKey: DayKey;
  snapshotTotalVnd: number;
};

export type ChapterCard = {
  chapter: number;
  reachedAtDayKey: DayKey;
  /** true nếu đây là chương ĐANG SỐNG (chương cao nhất hiện tại) — chưa có "ngày kết thúc". */
  isCurrent: boolean;
  /** Số phiên HOÀN THÀNH trong khoảng thời gian chương này còn là chương hiện tại. */
  totalSessions: number;
  /** null cho Chương 1 (không có snapshot — không phải một "sự kiện", xem chapters.ts). */
  peakNetWorthVnd: number | null;
  /** Vài dòng đã viết trong khoảng thời gian đó — MỚI NHẤT trước, chưa cắt ngắn (tầng hiển thị tự cắt). */
  journalExcerpts: readonly string[];
  /** "Hình hài cuối chương" — effectiveCharacterStage tại thời điểm chương này kết thúc (hoặc hôm nay, nếu đang sống). */
  characterStage: number;
};

const MAX_JOURNAL_EXCERPTS_PER_CHAPTER = 3;

export function buildChapterCards(
  raw: EngineRawData,
  chapterEvents: readonly ChapterEventInput[],
  currentChapter: number,
  todayKey: DayKey,
): ChapterCard[] {
  const sortedEvents = [...chapterEvents].sort((a, b) => a.chapterIndex - b.chapterIndex);
  const milestones: { chapter: number; reachedAtDayKey: DayKey; snapshotTotalVnd: number | null }[] = [
    { chapter: 1, reachedAtDayKey: raw.profileStartedDayKey, snapshotTotalVnd: null },
    ...sortedEvents.map((e) => ({
      chapter: e.chapterIndex,
      reachedAtDayKey: e.reachedAtDayKey,
      snapshotTotalVnd: e.snapshotTotalVnd,
    })),
  ];

  return milestones.map((m, i) => {
    const next = milestones[i + 1];
    const isCurrent = next === undefined;
    // Ngày CUỐI CÙNG chương này còn là chương hiện tại — chương đang sống thì là hôm nay; chương
    // đã qua thì là ngày ngay trước khi chương kế tiếp được chạm (chương trung gian bị nhảy qua
    // trong CÙNG một lần nhập tài sản có `reachedAtDayKey` trùng chương kế tiếp → khoảng rỗng,
    // 0 phiên/0 dòng nhật ký — đúng, vì thực tế không có ngày nào sống ở chương đó).
    const lastDayOfChapter = isCurrent ? todayKey : addDays(next.reachedAtDayKey, -1);
    const inRange = (d: DayKey) => d >= m.reachedAtDayKey && d <= lastDayOfChapter;

    const totalSessions = raw.completedSessions.filter((s) => inRange(s.dayKey)).length;

    const journalExcerpts = raw.dayLogs
      .filter((d) => inRange(d.dayKey) && (d.journalText?.trim().length ?? 0) > 0)
      .sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1)) // mới nhất trước
      .slice(0, MAX_JOURNAL_EXCERPTS_PER_CHAPTER)
      .map((d) => d.journalText!.trim());

    const historicalNowMs = isCurrent ? endOfDayMs(todayKey) : endOfDayMs(lastDayOfChapter);
    const stageAtEnd = foldTimeline(raw, historicalNowMs).stage;

    return {
      chapter: m.chapter,
      reachedAtDayKey: m.reachedAtDayKey,
      isCurrent,
      totalSessions,
      peakNetWorthVnd: m.snapshotTotalVnd,
      journalExcerpts,
      characterStage: effectiveCharacterStage(stageAtEnd, m.chapter),
    };
  });
}
