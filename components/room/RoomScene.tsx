"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomShell } from "./RoomShell";
import { RoomItems, type UnlockedRoomItem } from "./RoomItems";
import { Character, type CharacterPose } from "./Character";
import { characterModelForStage } from "./models";
import { ROOM_LIGHT_COLOR } from "./lighting";
import type { StatKey } from "@/core/types";

export type TimeOfDay = "day" | "evening";

type Props = {
  /** Tư thế hiện tại — "idle" khi không có phiên nào chạy, ba giá trị còn lại theo SPEC.md §5.1. */
  pose: CharacterPose;
  /** Giai đoạn nhân vật (SPEC.md §4.8) — mặc định 1, chưa có model cho giai đoạn khác. */
  characterStage?: number;
  /** Cuộn tới phần buổi tối → phòng dịu xuống (SPEC.md §5.1: "ánh sáng phòng chuyển tối"). */
  timeOfDay?: TimeOfDay;
  /** Đồ đạc đã mở khoá theo cấp (SPEC.md §4.8) — mốc 3. */
  unlockedItems?: readonly UnlockedRoomItem[];
};

const ROOM_CENTER: [number, number, number] = [1.5, 0.55, -1.5];
const CHARACTER_SPOT: [number, number, number] = [2.3, 0.05, -2.3];

const SCENE_TONE: Record<TimeOfDay, { background: string; ambient: number; directional: number; hemi: number }> = {
  day: { background: "#f7f1e3", ambient: 0.8, directional: 1.15, hemi: 0.35 },
  evening: { background: "#2c2440", ambient: 0.32, directional: 0.35, hemi: 0.1 },
};

const LERP_SPEED = 1.4; // đơn vị/giây — đủ mềm để thấy chuyển động, không ì

/**
 * Ánh sáng + màu nền — sống BÊN TRONG <Canvas> vì cần useFrame để chuyển mượt giữa ban ngày/
 * buổi tối (§5.7: "hoạt ảnh chỉ ở khoảnh khắc chuyển tiếp"). Intensity của ba đèn KHÔNG nhận
 * qua prop React mỗi khung hình — chỉ đặt giá trị ban đầu, sau đó useFrame tự lerp dần, để
 * không co giật giữa "React set" và "useFrame set" trên cùng một thuộc tính.
 */
function SceneAtmosphere({ lightColor, timeOfDay }: { lightColor: string; timeOfDay: TimeOfDay }) {
  const bgRef = useRef<THREE.Color>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const tone = SCENE_TONE[timeOfDay];
  const targetBg = useMemo(() => new THREE.Color(tone.background), [tone.background]);

  useFrame((_state, delta) => {
    const t = Math.min(1, delta * LERP_SPEED);
    bgRef.current?.lerp(targetBg, t);
    if (fogRef.current) fogRef.current.color.lerp(targetBg, t);
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, tone.ambient, t);
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(dirRef.current.intensity, tone.directional, t);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(hemiRef.current.intensity, tone.hemi, t);
    }
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={[SCENE_TONE.day.background]} />
      <fog ref={fogRef} attach="fog" args={[SCENE_TONE.day.background, 9, 19]} />
      {/* Màu đèn nền theo nhãn (§5.1) — đổi qua prop React bình thường, không cần lerp riêng:
          đây vốn đã là "nhẹ", không cần thêm hoạt ảnh cho chính màu sắc. */}
      <ambientLight ref={ambientRef} color={lightColor} intensity={SCENE_TONE.day.ambient} />
      <directionalLight ref={dirRef} color="#fff4de" intensity={SCENE_TONE.day.directional} position={[4, 6, 3]} />
      <hemisphereLight ref={hemiRef} color="#fff6e6" groundColor="#d8c9a3" intensity={SCENE_TONE.day.hemi} />
    </>
  );
}

export function RoomScene({ pose, characterStage = 1, timeOfDay = "day", unlockedItems = [] }: Props) {
  const lightColor = pose === "idle" ? ROOM_LIGHT_COLOR.neutral : ROOM_LIGHT_COLOR[pose as StatKey];

  return (
    <Canvas camera={{ position: [5.4, 3.7, 5.4], fov: 40 }}>
      <SceneAtmosphere lightColor={lightColor} timeOfDay={timeOfDay} />

      <Suspense fallback={null}>
        <RoomShell />
        <RoomItems items={unlockedItems} />
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
