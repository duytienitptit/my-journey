"use client";
import type { CheckInItem } from "@/app/actions/evening";
import { Icon } from "@/components/ui/Icon";

type Props = { item: Extract<CheckInItem, { kind: "label" }>; showButtons: boolean; onAdd: () => void; onRemove: () => void };
export function LabelProgressRow({ item, showButtons, onAdd, onRemove }: Props) {
  return <div className="checkin-row label-progress-row" style={{ "--task-color": `var(--stat-${item.stat})` } as React.CSSProperties}>
    <span className="checkin-name"><Icon name={item.stat}/><span>{item.name}</span></span>
    <div className="label-progress-value"><span>{item.count} / {item.threshold} sessions{item.done && " ✓"}</span>
      <div className="label-progress-bar" role="progressbar" aria-label={`${item.name} daily progress`} aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={Math.max(item.count, item.threshold)}><span style={{ width: `${Math.min(100, item.count / Math.max(1, item.threshold) * 100)}%` }}/></div>
    </div>
    {showButtons && <div className="session-stepper">
      <button onClick={onRemove} disabled={item.manualCount === 0} aria-label={`Remove one backfilled ${item.name} session`}>−</button>
      <button onClick={onAdd} aria-label={`Add one ${item.name} session`}>+</button>
    </div>}
  </div>;
}
