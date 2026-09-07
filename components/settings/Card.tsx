/** Khung thẻ dùng chung trong nội bộ màn Cài đặt — cùng kiểu `rounded-3xl bg-surface shadow-sm`
 *  các màn khác đã dùng (week/archive/library/stats), chỉ gom lại vì Cài đặt tách nhiều file con. */
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-sm">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-foreground/60">{children}</h2>;
}

export function CardHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-foreground/40">{children}</p>;
}
