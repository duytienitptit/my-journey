"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RoomShell } from "./RoomShell";
import { Character, type CharacterPose } from "./Character";
import { characterModelForStage } from "./models";
import { ROOM_LIGHT_COLOR } from "./lighting";
import type { StatKey } from "@/core/types";

type Props = {
  /** Tư thế hiện tại — "idle" khi không có phiên nào chạy, ba giá trị còn lại theo SPEC.md §5.1. */
  pose: CharacterPose;
  /** Giai đoạn nhân vật (SPEC.md §4.8) — mặc định 1, mốc 1 chưa có hệ thống cấp nên luôn là 1. */
  characterStage?: number;
};

const ROOM_CENTER: [number, number, number] = [1.5, 0.55, -1.5];
const CHARACTER_SPOT: [number, number, number] = [2.3, 0.05, -2.3];

export function RoomScene({ pose, characterStage = 1 }: Props) {
  const lightColor = pose === "idle" ? ROOM_LIGHT_COLOR.neutral : ROOM_LIGHT_COLOR[pose as StatKey];

  return (
    <Canvas camera={{ position: [5.4, 3.7, 5.4], fov: 40 }}>
      <color attach="background" args={["#f7f1e3"]} />
      <fog attach="fog" args={["#f7f1e3", 9, 19]} />

      {/* Ánh sáng ấm, đổi nhẹ theo nhãn đang chạy — SPEC.md §5.1. */}
      <ambientLight color={lightColor} intensity={0.8} />
      <directionalLight color="#fff4de" intensity={1.15} position={[4, 6, 3]} />
      <hemisphereLight color="#fff6e6" groundColor="#d8c9a3" intensity={0.35} />

      <Suspense fallback={null}>
        <RoomShell />
        <Character
          url={characterModelForStage(characterStage)}
          pose={pose}
          position={CHARACTER_SPOT}
          rotation={[0, Math.PI, 0]}
        />
      </Suspense>

      {/* Xoay và zoom được (SPEC.md §5.3), nhưng giới hạn góc để không lật ra ngoài phòng —
          phòng chỉ có 2 tường (sau + trái), khoảng xoay hẹp quanh góc nhìn mặc định tránh camera
          lọt ra phía không có tường hoặc hạ xuống ngang/dưới sàn. */}
      <OrbitControls
        target={ROOM_CENTER}
        enablePan={false}
        minDistance={4}
        maxDistance={9}
        minPolarAngle={Math.PI / 4.5}
        maxPolarAngle={Math.PI / 2.3}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
      />
    </Canvas>
  );
}
