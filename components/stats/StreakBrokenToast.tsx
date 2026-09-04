"use client";

/**
 * Trách móc thật đầu tiên trong app (SPEC.md §4.12, R3) — câu chữ đã chủ dự án duyệt trực tiếp
 * ngày 2026-09-04, giọng "hờn dỗi dễ thương", KHÔNG phải Claude tự nghĩ ra. Chỉ hiện khi chuỗi
 * ngày-đạt GÃY THẬT (qua khỏi ngày ân hạn mà vẫn không đủ 6/6) — không hiện lúc chỉ mới "vào
 * nguy hiểm" (badge đổi màu là đủ, xem TimerOverlay.tsx). Không có pháo giấy — đây không phải
 * khoảnh khắc ăn mừng.
 */
export function StreakBrokenToast({ notice }: { notice: number | null }) {
  if (notice === null) return null;
  return (
    // top-60, không phải top-28/top-44 như LevelUpToast/StreakMilestoneToast — cả ba đều SỐNG
    // ĐỘC LẬP (lên cấp, chạm mốc chuỗi, gãy chuỗi là ba sự kiện không loại trừ nhau, có thể cùng
    // xảy ra trong một lần refresh), xếp so le để không đè chồng lên nhau nếu cùng lúc hiện.
    <div className="absolute left-1/2 top-60 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg">
      Okay. {notice} days, gone. We&apos;re not talking about it.
    </div>
  );
}
