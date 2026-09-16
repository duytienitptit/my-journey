"use client";

import { TreeOfProgress } from "./TreeOfProgress";
import type { CheckInItem } from "@/app/actions/evening";
import type { DayAchievedStreakInfo } from "@/core/engine/types";
import type { StatKey } from "@/core/types";

/**
 * Màn chính dạng dashboard (2026-09-16) — THAY căn phòng 3D sau bốn vòng chủ dự án chê phòng
 * ("quá xấu" → "không hiệu quả và trực quan" → "không nên làm mô hình 3D phức tạp"). Chọn
 * phương án C trong ba phương án đã phác: nửa trái là "hôm nay", nửa phải là MỘT hình duy nhất
 * lớn lên theo dữ liệu (`TreeOfProgress`).
 *
 * Vì sao vẫn giữ một hình thay vì dashboard thuần: bỏ hết hình thì XP và cấp thành con số không
 * dẫn tới đâu — cả vòng lặp thưởng của app (làm việc → XP → lên cấp → CÓ GÌ ĐÓ hiện ra, §4.8)
 * mất đầu ra. Cây gánh đúng vai trò căn phòng từng gánh, với một phần nhỏ công sức.
 *
 * KHÔNG lặp lại thứ `TimerOverlay` đã hiện (nút Start, chọn nhãn, chuỗi ở góc, dải chấm phiên,
 * số tài sản, cụm nav) — component này chỉ thay phần NỀN mà canvas 3D từng chiếm.
 */

const STAT_LABEL: Record<StatKey, string> = { mind: "mind", health: "health", spirit: "spirit" };
const STAT_DOT: Record<StatKey, string> = { mind: "#5f8fbf", health: "#d98e5a", spirit: "#5f9e86" };

type Props = {
  levelByStat: Record<StatKey, number>;
  dayAchievedStreak: DayAchievedStreakInfo;
  chapter: number;
  /** Sáu việc trong ngày (§4.5) — cùng nguồn với khối check-in của nghi thức tối, không tính lại. */
  checkIn: readonly CheckInItem[];
  /** Đang chạy phiên → "chế độ tập trung" (§5.1, nguyên tắc 1 §2: tĩnh ở chỗ tập trung). */
  focusMode?: boolean;
};

/** Chữ trong app LUÔN tiếng Anh (luật CLAUDE.md) — giọng "như người nói chuyện" theo §5.7,
 *  không phải "Tasks remaining: 6". */
function remainingLabel(items: readonly CheckInItem[]): string {
  const left = items.filter((i) => !i.done).length;
  if (items.length === 0) return "Nothing set up yet";
  if (left === 0) return "All done today";
  if (left === items.length) return "Nothing done yet today";
  return `${left} left today`;
}

export function HomeDashboard({ levelByStat, dayAchievedStreak, chapter, checkIn, focusMode = false }: Props) {
  const done = checkIn.filter((i) => i.done).length;
  const undone = checkIn.filter((i) => !i.done);

  return (
    // Chế độ tập trung: nền TỐI + dashboard mờ hẳn đi. Bắt buộc phải tối, không chỉ mờ nội dung —
    // đồng hồ đếm ngược của TimerOverlay dùng chữ TRẮNG (xưa nay nền là phòng 3D tối gần đen);
    // để nền kem sáng thì đồng hồ biến mất khỏi màn hình. Cùng lúc đó đây cũng đúng §5.1.
    <div
      className={`relative flex h-full w-full items-center justify-center px-8 pb-72 pt-20 transition-colors duration-700 md:pb-44 ${
        focusMode ? "bg-[#12100f]" : "bg-transparent"
      }`}
    >
      <div
        className={`flex w-full max-w-5xl flex-col items-center gap-6 transition-opacity duration-500 md:flex-row md:items-center md:justify-between md:gap-12 ${
          focusMode ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={focusMode}
      >
        <div className="order-2 w-full max-w-sm md:order-1">
          <p className="text-sm text-foreground/45">chapter {chapter}</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-foreground md:text-5xl">{remainingLabel(checkIn)}</h1>
          {undone.length > 0 && (
            <p className="mt-2 text-sm text-foreground/55">{undone.map((i) => i.name.toLowerCase()).join(", ")}</p>
          )}

          <div className="mt-5 flex gap-1.5">
            {checkIn.map((item, i) => (
              <span
                key={i}
                title={item.name}
                className={`h-2 w-10 rounded-full ${item.done ? "" : "bg-foreground/15"}`}
                style={item.done ? { backgroundColor: "#5f9e86" } : undefined}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-foreground/40">
            {done}/{checkIn.length} today
          </p>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
            {(Object.keys(STAT_LABEL) as StatKey[]).map((stat) => (
              <span key={stat} className="flex items-center gap-1.5 text-sm text-foreground/55">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAT_DOT[stat] }} />
                {STAT_LABEL[stat]} {levelByStat[stat]}
              </span>
            ))}
          </div>
        </div>

        <div className="order-1 h-52 w-52 shrink-0 md:order-2 md:h-[26rem] md:w-[26rem]">
          <TreeOfProgress
            levels={levelByStat}
            streak={dayAchievedStreak.current}
            danger={dayAchievedStreak.danger}
          />
        </div>
      </div>
    </div>
  );
}
