"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Hạt sáng đom đóm quanh nhân vật lúc "chế độ tập trung" — SPEC.md §5.1, [THÊM — 2026-09-05].
 * Nới nguyên tắc 1 (§2, "gần như trống") một chút CÓ CHỦ Ý — chủ dự án muốn một hiệu ứng chill
 * đẹp mắt để mở full màn hình lúc làm việc, không muốn tối om tuyệt đối. Trôi CHẬM RÃI quanh một
 * điểm neo hẹp (không rải khắp phòng), mờ dần vào/ra theo `active` chứ không bật tắt đột ngột —
 * ranh giới vẫn là "tĩnh và dịu", không phải "vui, nhiều chuyển động" như hoạt ảnh chuyển tiếp.
 *
 * Dùng `InstancedMesh` (một draw call cho cả cụm) + `useFrame` cập nhật ma trận trực tiếp — KHÔNG
 * qua state/props mỗi khung hình, giữ đúng nguyên tắc "chỉ đặt giá trị đầu, còn lại để useFrame
 * tự lo" đã dùng cho ánh sáng ở SceneAtmosphere. Vật liệu `meshBasicMaterial` (không chịu ánh
 * sáng cảnh) để hạt vẫn sáng rõ dù phòng đã tối gần như đen.
 */

// [SỬA — 2026-09-05] Rộng + nhiều hơn hẳn bản đầu (COUNT=36, RADIUS=1.3, quanh nhân vật) — chủ
// dự án xem trực tiếp, muốn hiệu ứng "phủ kín cả màn hình" chứ không chỉ một cụm nhỏ một góc.
// Neo vào `center` = điểm camera đang nhìn vào (framing.target, RoomScene.tsx), không phải vị
// trí nhân vật — bán kính đủ lớn để tràn ra ngoài cả bốn tường (phòng không có trần, xem
// RoomShell.tsx), từ góc camera hạ xuống sẽ trải khắp khung hình chứ không dồn về một góc.
const COUNT = 90;
const RADIUS = 5.5;
const HEIGHT_MIN = 0.2;
const HEIGHT_SPREAD = 5;
const FADE_SPEED = 1.1; // đơn vị/giây

type Particle = {
  angle: number;
  radiusFactor: number;
  heightOffset: number;
  driftSpeed: number;
  twinklePhase: number;
  twinkleSpeed: number;
};

export function Fireflies({
  center,
  color,
  active,
}: {
  center: [number, number, number];
  color: string;
  active: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const opacityRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // `Math.random()` KHÔNG được gọi trong render (ESLint react-hooks/purity, React Compiler đòi
  // render thuần) — kể cả bên trong factory của useMemo. Sinh vị trí ngẫu nhiên trong useEffect
  // (chạy SAU render, một lần lúc mount) thay vì useMemo, giữ trong ref để useFrame đọc mỗi khung
  // hình mà không gây re-render.
  const particlesRef = useRef<Particle[]>([]);
  useEffect(() => {
    particlesRef.current = Array.from({ length: COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radiusFactor: 0.15 + Math.random() * 0.85,
      heightOffset: Math.random() * HEIGHT_SPREAD,
      driftSpeed: 0.06 + Math.random() * 0.1,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.6 + Math.random() * 0.6,
    }));
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const particles = particlesRef.current;
    if (!mesh || particles.length === 0) return;

    opacityRef.current = THREE.MathUtils.damp(opacityRef.current, active ? 1 : 0, FADE_SPEED, delta);
    const material = mesh.material as THREE.MeshBasicMaterial;
    material.opacity = opacityRef.current;
    mesh.visible = opacityRef.current > 0.01;
    if (!mesh.visible) return;

    const t = state.clock.elapsedTime;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const angle = p.angle + t * p.driftSpeed;
      const r = RADIUS * p.radiusFactor;
      const x = center[0] + Math.cos(angle) * r;
      const z = center[2] + Math.sin(angle) * r;
      const y = center[1] + HEIGHT_MIN + p.heightOffset + Math.sin(t * 0.5 + p.twinklePhase) * 0.15;
      const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.02 + twinkle * 0.024);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} visible={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </instancedMesh>
  );
}
