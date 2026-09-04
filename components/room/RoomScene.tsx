"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomShell } from "./RoomShell";
import { RoomItems, type UnlockedRoomItem } from "./RoomItems";
import { Character, type CharacterPose } from "./Character";
import { characterModelForStage } from "./models";
import { ROOM_LIGHT_COLOR } from "./lighting";
import { cameraFramingForFootprint, footprintForChapter } from "./shells/footprint";
import type { StatKey } from "@/core/types";

export type TimeOfDay = "day" | "evening";

type Props = {
  /** Tư thế hiện tại — "idle" khi không có phiên nào chạy, ba giá trị còn lại theo SPEC.md §5.1. */
  pose: CharacterPose;
  /** Giai đoạn nhân vật (SPEC.md §4.8) — mặc định 1, chưa có model cho giai đoạn khác. */
  characterStage?: number;
  /** Chương hiện tại (SPEC.md §4.9) — mặc định 1, quyết định vỏ nhà + khung camera (mốc 5). */
  chapter?: number;
  /** Cuộn tới phần buổi tối → phòng dịu xuống (SPEC.md §5.1: "ánh sáng phòng chuyển tối"). */
  timeOfDay?: TimeOfDay;
  /** Đồ đạc đã mở khoá theo cấp (SPEC.md §4.8) — mốc 3. */
  unlockedItems?: readonly UnlockedRoomItem[];
  /** Đồng hồ đang chạy → tối gần như đen, đè lên cả timeOfDay (SPEC.md §5.1, "chế độ tập trung"). */
  focusMode?: boolean;
};

const SCENE_TONE: Record<TimeOfDay, { background: string; ambient: number; directional: number; hemi: number }> = {
  day: { background: "#f7f1e3", ambient: 0.8, directional: 1.15, hemi: 0.35 },
  evening: { background: "#2c2440", ambient: 0.32, directional: 0.35, hemi: 0.1 },
};

// Tối hơn hẳn "evening" — nhân vật vẫn lờ mờ thấy được (không phải 0 tuyệt đối), chỉ đủ tối để
// đồng hồ đếm ngược phóng to đứng giữa là thứ duy nhất thật sự nổi bật (SPEC.md §5.1, nguyên
// tắc 1 ở §2: "tĩnh ở chỗ tập trung"). Đè lên timeOfDay bất kể đang ngày hay tối.
const FOCUS_TONE = { background: "#0a0910", ambient: 0.09, directional: 0.06, hemi: 0.03 };

const LERP_SPEED = 1.4; // đơn vị/giây — đủ mềm để thấy chuyển động, không ì

/**
 * Ánh sáng + màu nền — sống BÊN TRONG <Canvas> vì cần useFrame để chuyển mượt giữa ban ngày/
 * buổi tối/chế độ tập trung (§5.7: "hoạt ảnh chỉ ở khoảnh khắc chuyển tiếp"). Intensity của ba
 * đèn KHÔNG nhận qua prop React mỗi khung hình — chỉ đặt giá trị ban đầu, sau đó useFrame tự
 * lerp dần, để không co giật giữa "React set" và "useFrame set" trên cùng một thuộc tính.
 */
function SceneAtmosphere({
  lightColor,
  timeOfDay,
  focusMode,
  fogNear,
  fogFar,
}: {
  lightColor: string;
  timeOfDay: TimeOfDay;
  focusMode: boolean;
  fogNear: number;
  fogFar: number;
}) {
  const bgRef = useRef<THREE.Color>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const tone = focusMode ? FOCUS_TONE : SCENE_TONE[timeOfDay];
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
      <fog ref={fogRef} attach="fog" args={[SCENE_TONE.day.background, fogNear, fogFar]} />
      {/* Màu đèn nền theo nhãn (§5.1) — đổi qua prop React bình thường, không cần lerp riêng:
          đây vốn đã là "nhẹ", không cần thêm hoạt ảnh cho chính màu sắc. */}
      <ambientLight ref={ambientRef} color={lightColor} intensity={SCENE_TONE.day.ambient} />
      <directionalLight ref={dirRef} color="#fff4de" intensity={SCENE_TONE.day.directional} position={[4, 6, 3]} />
      <hemisphereLight ref={hemiRef} color="#fff6e6" groundColor="#d8c9a3" intensity={SCENE_TONE.day.hemi} />
    </>
  );
}

/**
 * OrbitControls tự đặt CSS `touch-action: none` lên canvas mỗi lần gắn, và trả về "auto" mỗi
 * lần gỡ (three-stdlib, không có prop nào đổi việc này) — vì canvas phủ toàn màn hình
 * (RoomScene phía trên), "none" chặn luôn vuốt-cuộn-trang bằng ngón tay ở BẤT KỲ khoảng trống
 * nào, kể cả ngoài phòng — bắt gặp lúc chủ dự án thử trên điện thoại thật: vuốt xuống nghi
 * thức tối không ăn, vì vuốt dọc bị OrbitControls nuốt mất thành xoay camera.
 *
 * Cưỡng chế lại "pan-y": trình duyệt tự nhận diện vuốt NGANG/CHÉO thì mới đưa cho OrbitControls
 * (xoay ngang vẫn được), còn vuốt DỌC thì luôn cuộn trang bình thường, không cần chạm đúng nút
 * nào. Chụm hai ngón (pinch-zoom) không đụng luật này, vẫn zoom được như cũ.
 *
 * Cố tình lấy canvas qua `document.querySelector` (chỉ một canvas trong app) thay vì qua ref
 * của OrbitControls, vì hai lý do: (1) `<Canvas>` mount cây con qua reconciler RIÊNG của
 * react-three-fiber, không đồng bộ tick với cây DOM ngoài — effect ở RoomScene từng đọc ref
 * lúc `undefined` vì chạy trước khi OrbitControls kịp gắn; (2) ESLint `react-hooks/immutability`
 * (React Compiler) chặn gán `style.touchAction` trên bất kỳ giá trị lần ra được tới ref/hook nào,
 * kể cả hợp lệ về mặt runtime — DOM node lấy thẳng qua querySelector không dính quy tắc này vì
 * không có "nguồn gốc React" để dò. MutationObserver bù lại việc phải chạy lại effect mỗi khi
 * OrbitControls tự connect/disconnect (StrictMode dev gắn/gỡ/gắn lại) — cưỡng chế lại bất cứ
 * lúc nào giá trị bị đổi, không phụ thuộc đúng một lần chạy effect.
 */
function useTouchScrollFix() {
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const enforce = () => {
      if (canvas.style.touchAction !== "pan-y") canvas.style.touchAction = "pan-y";
    };
    enforce();
    const observer = new MutationObserver(enforce);
    observer.observe(canvas, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);
}

export function RoomScene({
  pose,
  characterStage = 1,
  chapter = 1,
  timeOfDay = "day",
  unlockedItems = [],
  focusMode = false,
}: Props) {
  useTouchScrollFix();
  const lightColor = pose === "idle" ? ROOM_LIGHT_COLOR.neutral : ROOM_LIGHT_COLOR[pose as StatKey];

  // Khung camera co giãn theo cỡ phòng (mốc 5, §4.9) — phòng Chương 12 rộng hơn hẳn Chương 1,
  // camera phải lùi xa hơn tương ứng để không tràn khung hình. Xem shells/footprint.ts.
  const footprint = footprintForChapter(chapter);
  const framing = cameraFramingForFootprint(footprint);
  // Đứng gần góc sau-phải khu vực chính (bàn học) — công thức suy từ đúng vị trí Chương 1 gốc
  // (2.3, 0.05, -2.3) = góc (3,-3) lùi vào (-0.7,+0.7); giữ nguyên tỉ lệ đó cho mọi cỡ phòng.
  const characterSpot: [number, number, number] = [
    footprint.interiorWidth - 0.7,
    0.05,
    -footprint.interiorDepth + 0.7,
  ];

  return (
    <Canvas camera={{ position: framing.position, fov: 40 }}>
      <SceneAtmosphere
        lightColor={lightColor}
        timeOfDay={timeOfDay}
        focusMode={focusMode}
        fogNear={framing.fogNear}
        fogFar={framing.fogFar}
      />

      <Suspense fallback={null}>
        <RoomShell chapter={chapter} />
        <RoomItems items={unlockedItems} />
        <Character
          url={characterModelForStage(characterStage)}
          pose={pose}
          position={characterSpot}
          rotation={[0, Math.PI, 0]}
        />
      </Suspense>

      {/* Xoay và zoom được (SPEC.md §5.3), nhưng giới hạn góc để không lật ra ngoài phòng —
          phòng chỉ có 2 tường (sau + trái), khoảng xoay hẹp quanh góc nhìn mặc định tránh camera
          lọt ra phía không có tường hoặc hạ xuống ngang/dưới sàn. */}
      <OrbitControls
        target={framing.target}
        enablePan={false}
        minDistance={framing.minDistance}
        maxDistance={framing.maxDistance}
        minPolarAngle={Math.PI / 4.5}
        maxPolarAngle={Math.PI / 2.3}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={Math.PI / 5}
      />
    </Canvas>
  );
}
