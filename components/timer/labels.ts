import type { StatKey } from "@/core/types";

/**
 * TẠM — danh sách nhãn khởi đầu, hard-code cho mốc 1 (SPEC.md §9: "Điểm số hard-code, chưa cần
 * DB" ở mốc này). Từ mốc 2 trở đi đây là dữ liệu SEED cho bảng `labels`, và mọi nơi phải đọc
 * từ DB — không được tiếp tục import file này vào logic (đúng lỗi bản cũ mắc phải, §12.4).
 */

export type LabelSeed = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  stat: StatKey;
};

export const SEED_LABELS: readonly LabelSeed[] = [
  { id: "english", name: "English", emoji: "🗣️", color: "#4f6f93", stat: "mind" },
  { id: "deep-work", name: "Deep work", emoji: "🎯", color: "#3f5a78", stat: "mind" },
  { id: "new-knowledge", name: "New knowledge", emoji: "📖", color: "#6b8bab", stat: "mind" },
];
