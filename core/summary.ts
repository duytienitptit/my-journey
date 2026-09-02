/**
 * "Hôm nay tôi đã ở đâu" — câu chữ, không biểu đồ (SPEC.md §5.1). Hàm thuần: nhận danh sách
 * phiên ĐÃ HOÀN THÀNH trong ngày (nhãn nào, tên gì) → một câu mô tả. Chữ tiếng Anh vì đây là
 * chữ hiển thị trong app (CLAUDE.md).
 */

export type CompletedSessionForSummary = { labelName: string };

export function daySummaryLine(sessions: readonly CompletedSessionForSummary[]): string {
  if (sessions.length === 0) return "No sessions yet today.";

  const counts = new Map<string, number>();
  for (const s of sessions) counts.set(s.labelName, (counts.get(s.labelName) ?? 0) + 1);

  let topLabel = sessions[0].labelName;
  let topCount = 0;
  for (const [name, count] of counts) {
    if (count > topCount) {
      topLabel = name;
      topCount = count;
    }
  }

  const total = sessions.length;
  const noun = total === 1 ? "session" : "sessions";
  return `${total} ${noun} · mostly ${topLabel}`;
}
