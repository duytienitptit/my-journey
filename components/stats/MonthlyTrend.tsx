import { STAT_KEYS, type StatKey } from "@/core/types";
import type { MonthKey } from "@/core/engine/longTermStats";

/**
 * Xu hướng ba chỉ số theo tháng — SPEC.md §5.8 khối 3. XP tại thời điểm KẾT THÚC mỗi tháng, nên
 * đường đi NGANG nghĩa là tháng đó đứng yên, đi XUỐNG nghĩa là bị trừ nhiều hơn kiếm được (§4.1
 * decay) — cả hai đều là thông tin thật, không làm mượt, không giấu.
 *
 * SVG viết tay thay vì thêm thư viện biểu đồ: ba đường, một trục, không tương tác — kéo cả một
 * thư viện vào cho ngần này là thừa.
 */

const STAT_META: Record<StatKey, { name: string; emoji: string; color: string }> = {
  mind: { name: "Mind", emoji: "📚", color: "var(--stat-mind)" },
  health: { name: "Health", emoji: "💪", color: "var(--stat-health)" },
  spirit: { name: "Spirit", emoji: "🧘", color: "var(--stat-spirit)" },
};

const VIEW_W = 320;
const VIEW_H = 110;
const PAD_X = 4;
const PAD_Y = 8;

export function MonthlyTrend({
  points,
}: {
  points: readonly { month: MonthKey; xpByStat: Record<StatKey, number> }[];
}) {
  if (points.length < 2) return null;

  const peak = Math.max(0, ...points.flatMap((p) => STAT_KEYS.map((s) => p.xpByStat[s])));
  // Cả ba chỉ số đều 0 → IM LẶNG. Vẽ ra thì được ba đường phẳng CHỒNG KHÍT nhau dưới đáy, và chỉ
  // màu vẽ sau cùng còn nhìn thấy — trông như "chỉ có Spirit tồn tại", tức là biểu đồ nói dối.
  // Cùng tinh thần im lặng của câu tương quan §5.2 (bắt gặp khi chủ dự án xem trên dữ liệu thật).
  if (peak <= 0) return null;
  const max = Math.max(1, peak);
  const stepX = (VIEW_W - PAD_X * 2) / (points.length - 1);
  const yOf = (xp: number) => VIEW_H - PAD_Y - (xp / max) * (VIEW_H - PAD_Y * 2);

  const pathFor = (stat: StatKey) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${PAD_X + i * stepX} ${yOf(p.xpByStat[stat])}`).join(" ");

  // Chỉ ghi nhãn tháng đầu và tháng cuối — 12 nhãn chen nhau ở bề rộng này thì không đọc được.
  const firstMonth = points[0].month;
  const lastMonth = points[points.length - 1].month;

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Mind, Health and Spirit over the last months"
      >
        {STAT_KEYS.map((stat) => (
          <path
            key={stat}
            d={pathFor(stat)}
            fill="none"
            stroke={STAT_META[stat].color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="flex items-center justify-between text-[10px] font-medium text-foreground/40">
        <span>{monthLabel(firstMonth)}</span>
        <span>{monthLabel(lastMonth)}</span>
      </div>

      <div className="flex items-center justify-center gap-4 pt-1">
        {STAT_KEYS.map((stat) => (
          <span key={stat} className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAT_META[stat].color }} />
            {STAT_META[stat].name}
          </span>
        ))}
      </div>
    </div>
  );
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(month: MonthKey): string {
  const monthIndex = Number(month.slice(5, 7)) - 1;
  return `${MONTH_SHORT[monthIndex] ?? month} ${month.slice(0, 4)}`;
}
