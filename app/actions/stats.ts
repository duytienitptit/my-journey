"use server";

import { now } from "@/core/clock";
import { chapterForNetWorth } from "@/core/engine/chapters";
import { foldTimeline } from "@/core/engine/timeline";
import type { DayAchievedStreakInfo, StreakMilestoneEvent } from "@/core/engine/types";
import type { StatKey } from "@/core/types";
import { getEngineRawData, getHideMoney, getLatestNetWorth } from "@/db/queries";

export type ComputedStats = {
  levelByStat: Record<StatKey, number>;
  /** Chuỗi ngày-đạt, tính TỚI HẾT HÔM QUA (§4.6/R5) — hiện ở góc màn chính (§5.1), mốc 4. Có
   *  `.danger` (ân hạn 1 ngày, [CHỐT — 2026-09-04]) — chuỗi nhật ký không có, gãy là về 0 ngay. */
  dayAchievedStreak: DayAchievedStreakInfo;
  /** TOÀN BỘ mốc chuỗi đã chạm từ trước tới giờ (cả ngày-đạt lẫn nhật ký), luôn tăng dần theo
   *  ngày — client tự so sánh độ dài mảng để phát hiện "vừa chạm mốc mới" (useComputedStats),
   *  y hệt cách phát hiện lên cấp. Không lưu XP nào ở đây (§8.1) — chỉ để hiện ăn mừng. */
  streakMilestoneEvents: readonly StreakMilestoneEvent[];
  /** Chương hiện tại (§4.9) — bám theo bản ghi tài sản MỚI NHẤT, KHÔNG phải mốc cao nhất từng
   *  chạm. Vỏ nhà (RoomScene) đọc field này. Chưa từng nhập gì → Chương 1 (tài sản coi như 0). */
  chapter: number;
  /** Bản ghi tài sản mới nhất, hoặc `null` nếu chưa từng nhập (§4.9: "đừng bao giờ ép tôi nhập"). */
  netWorth: { stocksVnd: number; goldVnd: number; totalVnd: number } | null;
  /** `profile.hide_money` — mặc định `false`: số tài sản LUÔN HIỆN ([SỬA/CHỐT — 2026-09-05],
   *  §4.9). Nút ẩn vẫn còn cho khoảnh khắc không muốn nhìn, và trạng thái đó phải lưu lại. */
  hideMoney: boolean;
};

/**
 * Tính lại TOÀN BỘ từ bản ghi thô (§8.1) — không cache. Gọi sau bất kỳ hành động nào có thể
 * đổi XP (hoàn thành phiên, ghi bù, chấm thói quen, đóng ngày) HOẶC đổi chương (nhập tài sản)
 * để phát hiện lên/tụt cấp và đổi vỏ nhà.
 *
 * Chương KHÔNG đi qua `foldTimeline` (đọc bản ghi tài sản mới nhất riêng, song song) — đây là
 * trục độc lập với XP, xem ghi chú kiến trúc trong core/engine/chapters.ts.
 */
export async function getComputedStatsAction(): Promise<ComputedStats> {
  const [raw, latestNetWorth, hideMoney] = await Promise.all([
    getEngineRawData(),
    getLatestNetWorth(),
    getHideMoney(),
  ]);
  const nowMs = now();
  const result = foldTimeline(raw, nowMs);

  const chapter = chapterForNetWorth(latestNetWorth?.totalVnd ?? 0);
  return {
    levelByStat: result.levelByStat,
    dayAchievedStreak: result.dayAchievedStreak,
    streakMilestoneEvents: result.events.streakMilestones,
    chapter,
    netWorth: latestNetWorth
      ? { stocksVnd: latestNetWorth.stocksVnd, goldVnd: latestNetWorth.goldVnd, totalVnd: latestNetWorth.totalVnd }
      : null,
    hideMoney,
  };
}
