/**
 * SPEC.md §8.2 — MỘT FILE CẤU HÌNH DUY NHẤT.
 *
 * Mọi con số cân bằng của trò chơi (XP mỗi hành động, ngưỡng cấp, mốc chuỗi, mốc chương,
 * ngưỡng thói quen) nằm ở đây, và CHỈ ở đây. `core/engine/` (mốc 3+) đọc từ file này, không
 * viết số trực tiếp trong logic — ép buộc bằng `eslint.config.mjs` (`no-magic-numbers` trong
 * `core/engine/**`).
 *
 * Sửa một con số ở đây là cả lịch sử tự tính lại đúng ở lần đọc sau — không migration, không
 * backfill (§8.1). Mỗi hằng số trỏ về đúng mục trong `SPEC.md` để không lạc mất căn cứ; đổi
 * số ở đây thì sửa `SPEC.md` trong CÙNG lần thay đổi đó (CLAUDE.md, luật số 2).
 *
 * File này chỉ chứa DỮ LIỆU — không có hàm, không có logic, không đụng đồng hồ hay DB.
 */

import type { IsoWeekday } from "./types";

// ─── §4.10 · Mốc ngày ──────────────────────────────────────────────────────

/** Một "ngày" chạy 04:00 → 03:59:59 hôm sau, giờ Việt Nam. */
export const DAY_BOUNDARY_HOUR = 4;

export const TIMEZONE = "Asia/Ho_Chi_Minh";

/** Tuần chạy Thứ Hai → Chủ nhật — SPEC.md §11.2 câu Q29. (1 = Thứ Hai, theo IsoWeekday) */
export const WEEK_START_ISO_WEEKDAY: IsoWeekday = 1;

// ─── §4.3 · Phiên pomodoro ─────────────────────────────────────────────────

export const SESSION_MINUTES_DEFAULT = 25;

/** Nghỉ ngắn sau mỗi phiên. Không có nghỉ dài — bỏ ngày 2026-09-02, SPEC.md §11.3 câu S4. */
export const BREAK_MINUTES_DEFAULT = 5;

// ─── §5.1 · Mục tiêu ngày ────────────────────────────────────────────────

/** Vòng tròn mục tiêu ngày quanh đồng hồ — chỉ là cái thước, vượt/thiếu đều không có gì xảy ra. */
export const DAILY_SESSION_GOAL_DEFAULT = 4;

// ─── §4.4 · Nguồn điểm ─────────────────────────────────────────────────────

export const XP_SESSION_COMPLETE = 30;

/** Ghi bù ăn bằng phiên thật — quên bật đồng hồ đơn giản là quên (§11.3 câu S5). */
export const XP_SESSION_MAKEUP = 30;

/** Chỉ áp cho THÓI QUEN đạt HABIT_KEPT_THRESHOLD_SCORE — nhãn đạt ngưỡng không có khoản này (§4.5, câu Q10). */
export const XP_HABIT_KEPT = 20;

/** Đóng ngày → vào Spirit. Đóng muộn vẫn ăn đủ, không phạt (§4.11). */
export const XP_CLOSE_DAY = 50;

/** Nghỉ ngơi đúng cách → vào Health. Xem REST_WELL_THRESHOLD_AVG. */
export const XP_REST_WELL = 15;

/** Viết đúc kết tuần → vào Spirit. */
export const XP_WEEK_REVIEW = 100;

/**
 * "Thưởng ngày đạt" — cứ ngày nào đạt theo luật §4.5 là được, KHÔNG cần trải đủ ba chỉ số.
 * Đổi tên từ "chạm cả ba chỉ số" ngày 2026-09-02 (§11.4 câu T1, chọn luật Z). Chia đều 3 chỉ số.
 */
export const XP_DAY_ACHIEVED = 30;

// ─── §4.5 · Ngày "đạt" ─────────────────────────────────────────────────────

/**
 * Dữ liệu KHỞI ĐẦU để seed bảng `daily_tasks` (mốc 2) — không phải nguồn thật để tính "ngày
 * đạt". Logic đọc từ DB (`daily_tasks`), không đọc thẳng từ đây — SPEC.md §4.5, §12.4:
 * "đừng viết cứng tên nhãn vào logic". Đơn vị: nhãn tính bằng SỐ PHIÊN, thói quen chấm-điểm
 * tính bằng ĐIỂM 1–5.
 */
export const DEFAULT_DAILY_TASK_THRESHOLDS = {
  english: 4, // phiên
  deepWork: 4, // phiên — nâng từ 2 ngày 2026-09-02 (§11.2 câu R4a)
  newKnowledge: 2, // phiên
  sport: 4, // điểm 1–5
  sleepEnough: 4, // điểm 1–5
  // "Viết nhật ký": không có ngưỡng số — đạt khi ô nhật ký có chữ.
} as const;

/** Số việc cần đạt trong 6 việc, theo thứ. Chủ nhật không đếm số — chỉ cần có viết nhật ký. */
export const DAY_ACHIEVED_REQUIRED_COUNT: Record<IsoWeekday, number | "journal_only"> = {
  1: 4, // Thứ Hai
  2: 4,
  3: 4,
  4: 4,
  5: 4, // Thứ Sáu
  6: 3, // Thứ Bảy
  7: "journal_only", // Chủ nhật
};

/**
 * Ngưỡng "giữ được thói quen" — dùng CHUNG cho cả XP_HABIT_KEPT lẫn việc tính "ngày đạt".
 * Một ngưỡng duy nhất, đừng dựng hai ngưỡng riêng (§4.5). Áp cho Sport và Sleep enough.
 */
export const HABIT_KEPT_THRESHOLD_SCORE = 4;

// ─── §4.7 · "Nghỉ ngơi đúng cách" ────────────────────────────────────────

/** Đạt khi (Sport + Sleep enough) ÷ 2 ≥ ngưỡng này (tức tổng hai điểm ≥ 8). */
export const REST_WELL_THRESHOLD_AVG = 4;

// ─── §4.6 · Hai chuỗi và mốc thưởng ──────────────────────────────────────

/** Thưởng khi chạm mốc chuỗi ngày-đạt — MỘT LẦN trong đời, chia đều 3 chỉ số. */
export const STREAK_DAY_ACHIEVED_MILESTONES: Readonly<Record<number, number>> = {
  7: 150,
  30: 450, // không phải 500 — chia hết cho 3 chỉ số (§11.2 câu Q28)
  100: 1500,
  365: 6000,
};

/** Thưởng khi chạm mốc chuỗi nhật ký — MỘT LẦN trong đời, toàn bộ vào Spirit. */
export const STREAK_JOURNAL_MILESTONES: Readonly<Record<number, number>> = {
  7: 100,
  30: 400,
  100: 1200,
  // Không có mốc 365 cho chuỗi nhật ký — đúng bảng SPEC.md §4.6.
};

/** Cả 7 ngày trong tuần đều đạt VÀ có viết đúc kết tuần → thưởng này, vào Spirit. */
export const WEEK_PERFECT_BONUS = 200;

// ─── §4.1 · Trừ XP khi bỏ bê ─────────────────────────────────────────────

/** Bắt đầu trừ khi một chỉ số không nhận XP đủ ngần này ngày liên tiếp — tức trừ từ ngày thứ 4. */
export const DECAY_GRACE_DAYS = 3;

/** Mức trừ mỗi ngày = hệ số này × max(1, cấp hiện tại của chính chỉ số đó). */
export const DECAY_RATE_PER_LEVEL = 20;

export const DECAY_FLOOR_XP = 0;

// ─── §4.8 · Cấp độ và giai đoạn ──────────────────────────────────────────

/** Cấp n cần LEVEL_XP_COEFFICIENT · n · (n+1) XP tích luỹ trong chính chỉ số đó. */
export const LEVEL_XP_COEFFICIENT = 150;

/**
 * Giai đoạn nhân vật theo TỔNG XP ba chỉ số cộng lại. Chỉ số mảng = giai đoạn − 1 (mảng bắt
 * đầu từ 0 XP cho giai đoạn 1). Phần tử cuối (208.000) là "Thanh niên" = YOUNG_ADULT_STAGE.
 */
export const STAGE_XP_THRESHOLDS: readonly number[] = [
  0, 3000, 10000, 23000, 43000, 73000, 113000, 158000, 208000,
];

export const YOUNG_ADULT_STAGE = 9;

/** "Trưởng thành" cần CẢ HAI: đã Thanh niên (tổng XP ≥ ngưỡng cuối ở trên) VÀ tài sản chạm chương này. */
export const ADULT_REQUIRES_CHAPTER = 12;

// ─── §4.9 · Tài sản và các chương ────────────────────────────────────────

/**
 * Mốc tài sản (VNĐ) cho từng chương. Chỉ số mảng = chương − 1. Chương ứng với một giá trị
 * tài sản = chương lớn nhất có mốc ≤ giá trị đó. Chương 12 cố định VNĐ, không quy đổi tỉ giá
 * USD (§11.2 câu Q31, R7).
 */
export const CHAPTER_NET_WORTH_THRESHOLDS_VND: readonly number[] = [
  0, // Ch.1 — dưới 50tr
  50_000_000, // Ch.2
  100_000_000, // Ch.3
  300_000_000, // Ch.4
  500_000_000, // Ch.5
  1_000_000_000, // Ch.6
  2_000_000_000, // Ch.7
  3_000_000_000, // Ch.8
  5_000_000_000, // Ch.9
  10_000_000_000, // Ch.10
  15_000_000_000, // Ch.11
  26_000_000_000, // Ch.12 — "Trưởng thành"
];

// ─── §4.11 · Ghi bù ──────────────────────────────────────────────────────

/** Nghi thức tối (thói quen, tâm trạng, nhật ký, đóng ngày): hôm nay hoặc hôm qua. */
export const BACKFILL_EVENING_MAX_DAYS_BACK = 1;

/** Phiên pomodoro: chỉ hôm nay, không lùi ngày. */
export const BACKFILL_SESSION_MAX_DAYS_BACK = 0;

// ─── §4.12 · Khi vắng mặt ────────────────────────────────────────────────

/** Biểu cảm nhân vật dịu xuống sau ngần này ngày vắng mặt hoàn toàn. Dừng ở một mức, không có vực sâu. */
export const ABSENCE_SOFTEN_AFTER_DAYS = 3;

// ─── §5.2 · Tương quan tuần ──────────────────────────────────────────────

/** Cần ít nhất ngần này ngày có đủ dữ liệu cả hai vế mới được nói một câu tương quan; không đủ thì im lặng. */
export const CORRELATION_MIN_SAMPLE_DAYS = 14;

// ─── Thang điểm dùng chung ───────────────────────────────────────────────

/** Tâm trạng: 😞😕😐🙂😄 = 1–5 (SPEC.md §11.2 câu Q18). */
export const MOOD_MIN = 1;
export const MOOD_MAX = 5;

/** Sport, Sleep enough: tôi tự chấm 1–5, không phải tích Có/Không (§4.2, giữ nguyên ở §11.3 câu S1). */
export const HABIT_SCORE_MIN = 1;
export const HABIT_SCORE_MAX = 5;
