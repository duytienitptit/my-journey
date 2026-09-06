import { isoWeekdayOf } from "@/core/day";
import type { DayKey } from "@/core/types";
import { monthKeyOf, type HeatmapCell } from "@/core/engine/longTermStats";

/**
 * Bản đồ nhiệt 12 tháng — SPEC.md §5.8 khối 2. Ô đậm dần theo SỐ PHIÊN hoàn thành trong ngày
 * ([CHỐT — 2026-09-06], chủ dự án chọn số phiên chứ không phải số giờ hay ngày-đạt).
 *
 * Xếp theo CỘT = một tuần, hàng = thứ trong tuần (Thứ Hai trên cùng) — giống lưới đóng góp của
 * GitHub, vì đó là hình dạng mà mắt đã quen đọc "nhịp". Ngày đầu khung gần như không rơi đúng
 * Thứ Hai, nên cột đầu tiên được chèn ô rỗng cho tới đúng thứ của nó.
 */

const TONE_STEPS = 4;
/** Đậm dần rõ rệt, không phải bốn sắc gần nhau — chủ dự án đã phàn nàn "các màu rất giống nhau". */
const TONE_MIX = [0.3, 0.55, 0.78, 1];

/**
 * Màu của MỘT BẬC (0 = không có phiên nào, 1..4 = đậm dần). Bậc 0 vẫn phải THẤY được là một ô —
 * nếu nó trong suốt thì lưới vỡ thành các đốm rời, không đọc ra nhịp nữa.
 */
function toneOfLevel(level: number): string {
  if (level <= 0) return "var(--surface-muted)";
  const mix = TONE_MIX[Math.min(TONE_STEPS, level) - 1];
  return `color-mix(in srgb, var(--stat-mind) ${mix * 100}%, var(--surface-muted))`;
}

/** Bậc của một ngày, chia theo tỉ lệ với ngày cao nhất trong khung. */
function levelFor(sessions: number, max: number): number {
  if (sessions <= 0) return 0;
  return Math.min(TONE_STEPS, Math.max(1, Math.ceil((sessions / Math.max(1, max)) * TONE_STEPS)));
}

export function YearHeatmap({ cells }: { cells: readonly HeatmapCell[] }) {
  if (cells.length === 0) return null;
  const max = cells.reduce((m, c) => Math.max(m, c.sessions), 0);

  // Gom thành cột theo tuần.
  const columns: (HeatmapCell | null)[][] = [];
  let current: (HeatmapCell | null)[] = [];
  const firstWeekday = isoWeekdayOf(cells[0].dayKey);
  for (let i = 1; i < firstWeekday; i++) current.push(null);
  for (const cell of cells) {
    current.push(cell);
    if (current.length === 7) {
      columns.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    columns.push(current);
  }

  // Nhãn tháng gắn vào cột CHỨA NGÀY MÙNG 1 của tháng đó. Cách này bảo đảm mỗi tháng trong khung
  // được gắn nhãn đúng một lần: hai ngày mùng 1 không bao giờ rơi vào cùng một cột 7 ngày.
  // (Bản đầu lấy tháng của ô ĐẦU cột rồi so với tháng trước — tháng cuối cùng bị MẤT nhãn khi
  // mùng 1 của nó nằm chung cột với ngày cuối tháng trước, bắt gặp lúc soi bằng mắt.)
  const monthLabelByColumn = new Map<number, string>();
  const labelOf = (dayKey: DayKey) => MONTH_SHORT[Number(monthKeyOf(dayKey).slice(5, 7)) - 1];
  columns.forEach((col, index) => {
    const firstOfMonth = col.find((c) => c !== null && c.dayKey.endsWith("-01"));
    if (!firstOfMonth) return;
    monthLabelByColumn.set(index, labelOf(firstOfMonth.dayKey));
  });
  // Khung nay bat dau tai NGAY BAT DAU cua chu du an, khong phai mung 1 (§5.8 [SUA — 2026-09-06])
  // — thang dau tien vi vay khong co o "-01" nao trong khung va se mat nhan neu chi dua vao vong
  // lap tren. Gan bu cho cot dau. Khong the trung nhan voi cot sau: mung 1 cua chinh thang do
  // nam TRUOC khung, nen khong cot nao khac mang nhan thang nay.
  if (!monthLabelByColumn.has(0)) {
    const firstReal = columns[0].find((c) => c !== null);
    if (firstReal) monthLabelByColumn.set(0, labelOf(firstReal.dayKey));
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full flex-col gap-1">
        <div className="flex gap-[3px] pl-6">
          {columns.map((_, index) => (
            <span key={index} className="w-[10px] shrink-0 text-[9px] font-medium text-foreground/40">
              {monthLabelByColumn.get(index) ?? ""}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          <div className="flex w-6 shrink-0 flex-col gap-[3px] pr-1 text-[9px] font-medium text-foreground/35">
            {WEEKDAY_SHORT.map((d, i) => (
              <span key={i} className="flex h-[10px] items-center leading-none">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>

          {columns.map((col, index) => (
            <div key={index} className="flex shrink-0 flex-col gap-[3px]">
              {col.map((cell, row) =>
                cell ? (
                  <span
                    key={cell.dayKey}
                    title={`${cell.dayKey} · ${cell.sessions} session${cell.sessions === 1 ? "" : "s"}`}
                    className="h-[10px] w-[10px] rounded-[2px]"
                    style={{ backgroundColor: toneOfLevel(levelFor(cell.sessions, max)) }}
                  />
                ) : (
                  <span key={`empty-${row}`} className="h-[10px] w-[10px]" />
                ),
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-foreground/40">
          <span>Less</span>
          {/* Vẽ thẳng theo BẬC, không quy ngược qua số phiên: lúc mới dùng, ngày cao nhất mới có
              1 phiên nên mọi bậc đều quy về cùng một con số và bốn ô chú giải hiện GIỐNG HỆT
              nhau — chủ dự án bắt gặp đúng lỗi này. */}
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ backgroundColor: toneOfLevel(level) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
