"use client";

import { useState } from "react";
import { updateSessionSettingsAction } from "@/app/actions/settings";
import { Card, CardHint, CardTitle } from "./Card";

type Props = {
  sessionMinutes: number;
  dailySessionGoal: number;
  reminderHour: number | null;
  onChanged: () => void;
};

/**
 * Độ dài phiên, mục tiêu phiên/ngày, giờ nhắc nghi thức tối — SPEC.md §4.3/§5.6/§6. Ba giá trị
 * này chỉ đổi qua đúng nút Save bên dưới (không có khối nào khác trong Cài đặt ghi vào chúng),
 * nên không cần đồng bộ lại state cục bộ khi props đổi — props đổi CHÍNH LÀ do lần save gần nhất.
 */
export function SessionSection({ sessionMinutes, dailySessionGoal, reminderHour, onChanged }: Props) {
  const [minutes, setMinutes] = useState(String(sessionMinutes));
  const [goal, setGoal] = useState(String(dailySessionGoal));
  const [reminderOn, setReminderOn] = useState(reminderHour !== null);
  const [hour, setHour] = useState(String(reminderHour ?? 22));
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const m = Number(minutes);
  const g = Number(goal);
  const h = Number(hour);
  const valid = Number.isFinite(m) && m > 0 && Number.isFinite(g) && g > 0 && (!reminderOn || (h >= 0 && h <= 23));

  async function save() {
    if (!valid) return;
    setPending(true);
    try {
      await updateSessionSettingsAction(Math.round(m), Math.round(g), reminderOn ? Math.round(h) : null);
      onChanged();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardTitle>Session</CardTitle>
      <label className="flex items-center justify-between gap-2 text-sm text-foreground/70">
        Session length (minutes)
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-20 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-right text-sm"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm text-foreground/70">
        Daily session goal
        <input
          type="number"
          min={1}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="w-20 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-right text-sm"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm text-foreground/70">
        Evening reminder
        <input
          type="checkbox"
          checked={reminderOn}
          onChange={(e) => setReminderOn(e.target.checked)}
          className="h-4 w-4 accent-foreground"
        />
      </label>
      {reminderOn && (
        <label className="flex items-center justify-between gap-2 text-sm text-foreground/70">
          Reminder hour (0–23, Vietnam time)
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-20 rounded-lg border border-foreground/10 bg-background px-2 py-1.5 text-right text-sm"
          />
        </label>
      )}
      <div className="flex items-center justify-between pt-1">
        <CardHint>Break is fixed at 5 minutes — SPEC.md §4.3.</CardHint>
        <button
          onClick={save}
          disabled={pending || !valid}
          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition-transform active:scale-95 disabled:opacity-50"
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </Card>
  );
}
