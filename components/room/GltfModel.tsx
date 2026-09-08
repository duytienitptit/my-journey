"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Mesh } from "three";

type Props = { url: string } & Omit<ThreeElements["group"], "children">;

/**
 * Đồ vật tĩnh trong phòng — tải một model CC0 (public/models/, xem CREDITS.md) và đặt vào cảnh.
 * `.clone()` chia sẻ geometry/material gốc (không tốn thêm bộ nhớ GPU), chỉ nhân bản Object3D —
 * dùng đúng cho đồ TĨNH không xương (không phải nhân vật, xem components/room/Character.tsx).
 *
 * Đổ bóng (mốc "nâng cấp phong cách 3D", 2026-09-08) — mọi mesh vừa TỰ đổ bóng vừa NHẬN bóng từ
 * đồ khác. Bật ở ĐÚNG MỘT chỗ này vì mọi món đồ tĩnh trong phòng đều đi qua component này —
 * không phải tự bật rải rác từng chỗ gọi.
 */
export function GltfModel({ url, ...groupProps }: Props) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);
  return <primitive object={cloned} {...groupProps} />;
}
