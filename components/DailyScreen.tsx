"use client";

import { RoomScene } from "@/components/room/RoomScene";
import type { CharacterPose } from "@/components/room/Character";
import { TimerOverlay } from "@/components/timer/TimerOverlay";
import { useSessionTimer } from "@/components/timer/useSessionTimer";

/** Màn hình chính — SPEC.md §5.1. Gộp "Làm việc" và "Nghi thức tối" làm một; phần nghi thức
 * tối nằm bên dưới, cuộn xuống là tới, tới ở mốc 2 (cần DB). */
export function DailyScreen() {
  const timer = useSessionTimer();

  const activeLabel = timer.labels.find((l) => l.id === timer.running?.labelId);
  const pose: CharacterPose = timer.running ? (activeLabel?.stat ?? "idle") : "idle";

  return (
    <div className="relative min-h-0 flex-1">
      <RoomScene pose={pose} />
      <TimerOverlay {...timer} />
    </div>
  );
}
