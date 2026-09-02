"use client";

import { useEffect, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Group } from "three";
import type { StatKey } from "@/core/types";

/** "idle" = không phiên nào đang chạy. Ba giá trị còn lại = chỉ số của nhãn đang chạy (§5.1). */
export type CharacterPose = StatKey | "idle";

/**
 * Tên animation clip trong rig dùng chung của pack Mini Characters (Kenney, CC0 — xem
 * public/models/CREDITS.md). Pack không có clip "nâng tạ" hay "thiền" đúng nghĩa — `crouch` và
 * `static` là lựa chọn GẦN ĐÚNG nhất hiện có cho Health/Spirit, chờ rig tốt hơn. Đổi ở đây khi
 * cần — không chỗ nào khác trong app biết tên clip thật.
 */
const CLIP_BY_POSE: Readonly<Record<CharacterPose, string>> = {
  idle: "idle",
  mind: "sit", // "ngồi vào bàn" — khớp gần như nguyên văn SPEC.md §5.1
  health: "crouch", // gần đúng cho "cầm tạ"
  spirit: "static", // gần đúng cho "ngồi thiền"
};

const FADE_SECONDS = 0.4;

type Props = { url: string; pose: CharacterPose } & Omit<ThreeElements["group"], "children">;

export function Character({ url, pose, ...groupProps }: Props) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const clipName = CLIP_BY_POSE[pose];
    const action = actions[clipName];
    if (!action) return;
    action.reset().fadeIn(FADE_SECONDS).play();
    return () => {
      action.fadeOut(FADE_SECONDS);
    };
  }, [pose, actions]);

  return (
    <group ref={group} {...groupProps}>
      <primitive object={scene} />
    </group>
  );
}
