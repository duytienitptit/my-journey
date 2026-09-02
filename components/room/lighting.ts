import type { StatKey } from "@/core/types";

/**
 * Ánh sáng phòng đổi NHẸ theo chỉ số của nhãn đang chạy — SPEC.md §5.1. Màu ấm, gần trắng —
 * đây là sắc thái tinh tế, không phải đèn sân khấu đổi màu rực rỡ (nguyên tắc 1, §5.7: hoạt
 * ảnh/hiệu ứng chỉ ở khoảnh khắc chuyển tiếp, lúc đồng hồ chạy gần như trống).
 */
export const ROOM_LIGHT_COLOR: Readonly<Record<StatKey | "neutral", string>> = {
  neutral: "#fff1d6",
  mind: "#dfe9f8",
  health: "#ffe4cd",
  spirit: "#e1f0e3",
};
