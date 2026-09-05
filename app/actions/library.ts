"use server";

/**
 * Thư viện hành trình — SPEC.md §5.4, mốc 7. Tính lại toàn bộ từ bản ghi thô mỗi lần đọc (§8.1).
 */

import { CHAPTER_NAMES, YOUNG_ADULT_STAGE } from "@/core/balance";
import { chapterForNetWorth } from "@/core/engine/chapters";
import { buildChapterCards, type ChapterCard } from "@/core/engine/journeyLibrary";
import { now } from "@/core/clock";
import { dayKeyOf } from "@/core/day";
import { getEngineRawData, getLatestNetWorth, listChapterEvents } from "@/db/queries";

export type ChapterCardView = ChapterCard & {
  name: string;
  stageLabel: string;
};

/** Nhãn hiển thị cho "hình hài cuối chương" — không có model 3D riêng cho từng giai đoạn nên
 *  không dựng cảnh 3D thu nhỏ (mọi giai đoạn hiện đang dùng CHUNG một model placeholder, xem
 *  characterModelForStage — dựng cảnh riêng cho mỗi khung lúc này sẽ trông giống hệt nhau, vô
 *  nghĩa). Dùng chữ đúng thuật ngữ đã [CHỐT] ở SPEC.md §4.8 thay vì bịa tên mới. */
function stageLabel(stage: number): string {
  if (stage > YOUNG_ADULT_STAGE) return "Grown up";
  if (stage === YOUNG_ADULT_STAGE) return "Young adult";
  return `Stage ${stage}`;
}

export async function getJourneyLibraryDataAction(): Promise<ChapterCardView[]> {
  const todayKey = dayKeyOf(now());
  const [raw, chapterEvents, latestNetWorth] = await Promise.all([
    getEngineRawData(),
    listChapterEvents(),
    getLatestNetWorth(),
  ]);
  const currentChapter = chapterForNetWorth(latestNetWorth?.totalVnd ?? 0);

  const cards = buildChapterCards(raw, chapterEvents, currentChapter, todayKey);
  // Mới nhất (chương cao nhất) lên đầu — đi qua "hành lang" từ gần tới xa, như spec mô tả.
  return [...cards].reverse().map((c) => ({
    ...c,
    name: CHAPTER_NAMES[c.chapter - 1] ?? `Chapter ${c.chapter}`,
    stageLabel: stageLabel(c.characterStage),
  }));
}
