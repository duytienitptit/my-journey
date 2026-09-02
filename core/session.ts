/**
 * Trạng thái phiên pomodoro — hàm thuần theo (bản ghi thô, thời điểm) → kết quả (§8.4).
 *
 * SPEC.md §5.1: "đồng hồ phải đúng khi tôi chuyển tab hoặc máy ngủ. Đừng dùng `setInterval`
 * đếm lùi — lưu mốc kết thúc, tính lại mỗi lần render." `RunningSession` lưu `endsAt` (mốc kết
 * thúc tuyệt đối); mọi nơi hiển thị đếm ngược tự tính lại từ mốc đó và `now()` của
 * `core/clock.ts`, không đụng vào các hàm ở đây.
 */

/**
 * `labelId` generic vì core/ không cần biết (và không nên biết) nhãn được định danh bằng kiểu
 * gì ở tầng lưu trữ — mốc 1 dùng slug chuỗi (localStorage), từ mốc 2 là serial int (Postgres).
 */
export type RunningSession<TLabelId = number> = {
  labelId: TLabelId;
  startedAt: number;
  endsAt: number;
};

/** Mốc kết thúc tuyệt đối cho một phiên bắt đầu lúc `startedAt`, dài `minutes` phút. */
export function sessionEndsAt(startedAt: number, minutes: number): number {
  return startedAt + minutes * 60_000;
}

/** Số giây còn lại, không bao giờ âm. */
export function secondsRemaining<TLabelId>(session: RunningSession<TLabelId>, now: number): number {
  return Math.max(0, Math.ceil((session.endsAt - now) / 1000));
}

/**
 * Phiên chỉ tính điểm khi chạy hết trọn thời lượng (§4.3) — bao gồm cả lúc tôi đã đóng tab và
 * máy chủ/tab khác đọc lại sau: quá `endsAt` là hoàn thành, không có hạn quay lại (§11.2 R6).
 */
export function isSessionComplete<TLabelId>(session: RunningSession<TLabelId>, now: number): boolean {
  return now >= session.endsAt;
}
