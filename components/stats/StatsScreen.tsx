import Link from "next/link";
import type { LongTermStatsData } from "@/app/actions/longTermStats";
import { LabelHoursByWeek } from "./LabelHoursByWeek";
import { MonthlyTrend } from "./MonthlyTrend";
import { YearHeatmap } from "./YearHeatmap";

/**
 * Thống kê dài hạn — SPEC.md §5.8, màn riêng `/stats`. NĂM khối, theo đúng thứ tự spec. Hai khối
 * đã **[GỠ — 2026-09-06]** theo yêu cầu chủ dự án sau khi xem trên dữ liệu thật: khối 4
 * ("Focus time" — chỉ nói lại con số giờ mà khối 1 đã nói) và khối 7 ("What's in your way" — khối
 * duy nhất từng có giọng KHUYÊN). **Đừng dựng lại cả hai.** Số thứ tự các khối còn lại GIỮ
 * NGUYÊN theo spec (1, 2, 3, 5, 6) để chú thích trong code và spec vẫn khớp nhau.
 *
 * Mỗi khối TỰ IM LẶNG khi chưa đủ dữ liệu thay vì hiện một biểu đồ rỗng — cùng tinh thần với câu
 * tương quan §5.2 ("không đủ thì im lặng hoàn toàn, không bịa"). Với dữ liệu vài ngày đầu, màn
 * này gần như trống, và đó là ĐÚNG (đã ghi rõ ở cuối §5.8).
 */
export function StatsScreen({ data }: { data: LongTermStatsData }) {
  const hasAnySession = data.lifetime.totalSessions > 0;
  const hasTrend =
    data.monthlyTrend.length >= 2 &&
    data.monthlyTrend.some((p) => p.xpByStat.mind + p.xpByStat.health + p.xpByStat.spirit > 0);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-6 bg-background px-6 py-12">
      <Link href="/" className="text-sm font-medium text-foreground/50 hover:text-foreground/80">
        ← Today
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Stats</h1>
        <p className="text-sm text-foreground/50">The long view — last 12 months</p>
      </div>

      {/* Khối 1 — toàn thời gian, không giới hạn 12 tháng (§5.8). */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">
          Since {longDate(data.lifetime.startedDayKey)}
        </p>
        <div className="flex items-end justify-between pt-3">
          <Figure value={String(data.lifetime.totalSessions)} unit={plural(data.lifetime.totalSessions, "session")} />
          <Figure
            value={round1(data.lifetime.totalHours).toLocaleString("en-US")}
            unit={plural(round1(data.lifetime.totalHours), "hour")}
          />
          <Figure
            value={String(data.lifetime.daysAchieved)}
            unit={`${plural(data.lifetime.daysAchieved, "day")} achieved`}
          />
        </div>
      </Card>

      {!hasAnySession && (
        <p className="px-1 text-sm leading-relaxed text-foreground/45">
          Nothing to show yet. Run a few sessions and this page starts filling in — most of it needs a
          couple of months before it can say anything honest.
        </p>
      )}

      {hasAnySession && (
        <>
          {/* Khối 2 */}
          <Card>
            <CardTitle>Your year</CardTitle>
            <CardHint>Darker means more sessions that day.</CardHint>
            <div className="pt-3">
              <YearHeatmap cells={data.heatmap} />
            </div>
          </Card>

          {/* Khối 3 — chỉ hiện khi biểu đồ thật sự có gì để vẽ (xem MonthlyTrend.tsx: cần ≥2
              tháng VÀ ít nhất một chỉ số > 0). Thẻ rỗng còn tệ hơn không có thẻ. */}
          {hasTrend && (
            <Card>
              <CardTitle>Mind · Health · Spirit</CardTitle>
              <CardHint>Where each one stood at the end of every month.</CardHint>
              <div className="pt-3">
                <MonthlyTrend points={data.monthlyTrend} />
              </div>
            </Card>
          )}

          {/* Khối 6 — một hàng mỗi nhãn, một cột mỗi TUẦN ([SỬA — 2026-09-06]), xem
              LabelHoursByWeek.tsx. */}
          <Card>
            <CardTitle>Where your hours went</CardTitle>
            <CardHint>One row per label, one bar per week — a flat row is a label you have been starving.</CardHint>
            <div className="pt-3">
              <LabelHoursByWeek weeks={data.labelHoursByWeek} />
            </div>
          </Card>

          {/* Khối 5 — toàn thời gian (§5.8). */}
          <Card>
            <CardTitle>Records</CardTitle>
            <div className="flex flex-col gap-2 pt-3">
              {data.records.mostSessionsInADay && (
                <RecordRow
                  label="Most sessions in a day"
                  value={`${data.records.mostSessionsInADay.sessions}`}
                  when={longDate(data.records.mostSessionsInADay.dayKey)}
                />
              )}
              {data.records.mostHoursInAWeek && (
                <RecordRow
                  label="Most hours in a week"
                  value={`${round1(data.records.mostHoursInAWeek.hours)}h`}
                  when={`week of ${longDate(data.records.mostHoursInAWeek.weekStart)}`}
                />
              )}
              <RecordRow
                label="Longest streak"
                value={`${data.records.longestDayAchievedStreak} ${plural(data.records.longestDayAchievedStreak, "day")}`}
                when={data.records.longestDayAchievedStreak > 0 ? "days achieved in a row" : "not yet"}
              />
            </div>
          </Card>

        </>
      )}
    </main>
  );
}

// ─── Mảnh giao diện dùng lại trong trang ─────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[var(--radius-lg)] bg-surface p-5 shadow-sm">{children}</section>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-foreground/70">{children}</h2>;
}

function CardHint({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-xs leading-relaxed text-foreground/45">{children}</p>;
}

function Figure({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-[11px] font-medium text-foreground/45">{unit}</span>
    </div>
  );
}

function RecordRow({ label, value, when }: { label: string; value: string; when: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-foreground/60">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
        <span className="text-[11px] text-foreground/35">{when}</span>
      </span>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** "1 session" chứ không phải "1 sessions" — bắt gặp lúc soi trang bằng mắt. */
function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

function longDate(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
