/**
 * SPEC.md §8.3 — một chỗ DUY NHẤT trong toàn bộ code được đọc đồng hồ hệ thống.
 *
 * Mọi nơi khác gọi `now()` ở đây, không bao giờ `Date.now()` hay `new Date()` (không đối số)
 * trực tiếp — ép buộc bằng `eslint.config.mjs`, không phải quy ước. Nhờ vậy công cụ tua thời
 * gian để test (mốc ngày 4h sáng, chuỗi 7/30 ngày, phiên bỏ quên, trừ XP theo cấp — mốc 3+)
 * chỉ cần ghi đè đúng một hàm này, không phải đi sửa từng chỗ.
 *
 * `core/day.ts` và `core/engine/*` (mốc 3+) vẫn giữ đúng hình dạng "hàm thuần nhận thời điểm
 * làm tham số" (§8.4) — chúng KHÔNG tự gọi `now()` bên trong. Chỗ gọi `now()` là biên trên
 * cùng: trang, route API, hoặc test — lấy một mốc thời gian rồi truyền xuống.
 */

// Lưu vào `globalThis`, KHÔNG phải biến module-scope thường (`let overrideMs`) — bắt gặp lúc
// soi mốc 4 (2026-09-04): route `/api/dev/clock` (Route Handler) và Server Action gọi từ client
// (vd `getComputedStatsAction` sau khi bấm nút) hoá ra KHÔNG dùng chung một instance module của
// chính file này dưới Next.js 16 + Turbopack — mỗi "đơn vị biên dịch" (route handler / server
// action / page render) dường như tự nạp lại module riêng trong dev mode, nên `let overrideMs`
// đặt ở route này không hề thấy được từ route/action khác. `globalThis` là object toàn cục THẬT
// của tiến trình Node — không bị nhân bản theo module, dùng chung được xuyên suốt mọi ngữ cảnh
// biên dịch. Đặt tên khoá dài, đặc thù để không đụng global nào khác.
const OVERRIDE_KEY = "__myJourneyClockOverrideMs__";

type GlobalWithOverride = typeof globalThis & { [OVERRIDE_KEY]?: number | null };

/** Số mili-giây hiện tại (epoch UTC). Hàm DUY NHẤT được phép đọc đồng hồ thật. */
export function now(): number {
  const override = (globalThis as GlobalWithOverride)[OVERRIDE_KEY];
  return override ?? Date.now();
}

/**
 * Chỉ dùng cho test và panel tua thời gian (mốc 3+): ghim đồng hồ vào một thời điểm cố định.
 * Gọi lại với `null` để trả về đồng hồ thật.
 */
export function setClockOverride(ms: number | null): void {
  (globalThis as GlobalWithOverride)[OVERRIDE_KEY] = ms;
}
