"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type Props = { url: string } & Omit<ThreeElements["group"], "children">;

/**
 * Đồ vật tĩnh trong phòng — tải một model CC0 (public/models/, xem CREDITS.md) và đặt vào cảnh.
 * `.clone()` chia sẻ geometry/material gốc (không tốn thêm bộ nhớ GPU), chỉ nhân bản Object3D —
 * dùng đúng cho đồ TĨNH không xương (không phải nhân vật, xem components/room/Character.tsx).
 */
export function GltfModel({ url, ...groupProps }: Props) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} {...groupProps} />;
}
