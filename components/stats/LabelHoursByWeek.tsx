import type { LabelHoursView } from "@/app/actions/longTermStats";
import type { DayKey } from "@/core/types";

/**
 * Phân bổ giờ theo nhãn, theo TUẦN — SPEC.md §5.8 khối 6.
 *
 * **Một hàng cho mỗi nhãn, một cột cho mỗi tuần** ([SỬA — 2026-09-06]). Hai lần sửa liên tiếp,
 * đều do chủ dự án xem trên dữ liệu thật:
 *   1. Bản đầu là cột xếp chồng theo THÁNG — ba nhãn cùng sắc xanh Mind chồng lên nhau, không
 *      thấy ranh giới. Tách thành hàng riêng.
 *   2. Vẫn theo tháng thì cả năm chỉ có 12 điểm, quá thô để thấy một nhãn bắt đầu bị bỏ đói từ
 *      lúc nào. Đổi sang TUẦN — cùng đơn vị với bản đồ nhiệt ngay phía trên, nên hai biểu đồ đọc
 *      chung một nhịp.
 *
 * **Màu lấy từ ba màu chỉ số** (`--stat-mind` · `--stat-health` · `--stat-spirit`) — đúng bộ màu
 * biểu đồ "Mind · Health · Spirit" phía trên đang dùng, theo yêu cầu của chủ dự án. Đây CỐ Ý
 * không phải màu riêng của từng nhãn: cả ba nhãn khởi đầu đều thuộc chỉ số Mind nên màu riêng
 * của chúng là ba sắc xanh gần như trùng nhau (`#4f6f93` · `#3f5a78` · `#6b8bab`, xem db/seed.ts)
 * — dùng chúng thì các hàng lại không phân biệt được, đúng thứ chủ dự án đã phàn nàn.
 *
 * *Đánh đổi đã biết:* xanh/cam/lục ở đây KHÔNG mang nghĩa Mind/Health/Spirit như ở biểu đồ trên —
 * chúng chỉ là ba màu phân biệt, gán theo `labelId` tăng dần nên ỔN ĐỊNH giữa các lần mở (không
 * nhảy màu khi thứ tự giờ đổi). Tên và emoji nhãn nằm ngay đầu mỗi hàng nên không ai phải đoán
 * màu nào là nhãn nào.
 */

/** Đúng bộ màu của MonthlyTrend.tsx — ba màu phân biệt rõ nhất mà bảng màu app đang có. */
const ROW_COLORS = ["var(--stat-mind)", "var(--stat-health)", "var(--stat-spirit)"];

export function LabelHoursByWeek({
  weeks,
}: {
  weeks: readonly { weekStart: DayKey; labels: readonly LabelHoursView[] }[];
}) {
  const rows = buildRows(weeks);
  if (rows.length === 0) return null;

  const max = Math.max(...rows.flatMap((r) => r.hoursByWeek));
  if (max <= 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <div key={row.labelId} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-foreground/70">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              {row.emoji} {row.name}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-foreground/40">{round1(row.total)}h</span>
          </div>

          <div className="flex h-10 items-end gap-[3px]">
            {row.hoursByWeek.map((hours, index) => (
              <div
                key={weeks[index].weekStart}
                className="flex h-full min-w-0 flex-1 items-end"
                title={`Week of ${weeks[index].weekStart} · ${row.name} · ${round1(hours)}h`}
              >
                {/* Tuần không có giờ nào vẫn để lại một vạch mờ — nếu bỏ hẳn, mắt không đếm được
                    đã trống bao nhiêu tuần liền, mà đó chính là thứ khối này cần cho thấy. */}
                <div
                  className="w-full rounded-sm"
                  style={
                    hours > 0
                      ? { height: `${Math.max(8, (hours / max) * 100)}%`, backgroundColor: row.color }
                      : { height: "2px", backgroundColor: "var(--border)" }
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-[3px]">
        {weeks.map((w, index) => (
          <span
            key={w.weekStart}
            className="min-w-0 flex-1 text-center text-[9px] font-medium text-foreground/35"
          >
            {monthTickAt(weeks, index)}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Nhãn trục dưới: chỉ ghi tên tháng ở tuần ĐẦU TIÊN của mỗi tháng — 52 nhãn tuần chen nhau ở bề
 * rộng này thì không đọc được chữ nào. Cùng cách bản đồ nhiệt phía trên gắn nhãn tháng.
 */
function monthTickAt(
  weeks: readonly { weekStart: DayKey }[],
  index: number,
): string {
  const month = weeks[index].weekStart.slice(0, 7);
  if (index > 0 && weeks[index - 1].weekStart.slice(0, 7) === month) return "";
  return MONTH_SHORT[Number(month.slice(5, 7)) - 1] ?? "";
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type LabelRow = {
  labelId: number;
  name: string;
  emoji: string;
  color: string;
  /** Cùng độ dài và cùng thứ tự với `weeks`. */
  hoursByWeek: number[];
  total: number;
};

/**
 * Đảo bảng từ (tuần → các nhãn) sang (nhãn → các tuần). Chỉ giữ nhãn THẬT SỰ có giờ trong khung —
 * nhãn chưa dùng bao giờ thì không cần một hàng trống để nhìn.
 */
function buildRows(weeks: readonly { weekStart: DayKey; labels: readonly LabelHoursView[] }[]): LabelRow[] {
  const byLabel = new Map<number, LabelRow>();
  weeks.forEach((w, index) => {
    for (const l of w.labels) {
      let row = byLabel.get(l.labelId);
      if (!row) {
        row = {
          labelId: l.labelId,
          name: l.name,
          emoji: l.emoji,
          color: "",
          hoursByWeek: new Array<number>(weeks.length).fill(0),
          total: 0,
        };
        byLabel.set(l.labelId, row);
      }
      row.hoursByWeek[index] = l.hours;
      row.total += l.hours;
    }
  });

  // Màu gán theo labelId tăng dần → ổn định giữa các lần mở; thứ tự HIỂN THỊ thì theo tổng giờ
  // giảm dần (nhãn ngốn nhiều giờ nhất lên đầu). Hai thứ tự này cố ý tách rời nhau.
  const byIdAscending = [...byLabel.values()].sort((a, b) => a.labelId - b.labelId);
  byIdAscending.forEach((row, i) => {
    row.color = ROW_COLORS[i % ROW_COLORS.length];
  });
  return [...byLabel.values()].sort((a, b) => b.total - a.total);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
