import type { CSSProperties } from "react";
import { seededRandom } from "./forestShapes";

/**
 * Đom đóm lúc tập trung — SPEC.md §5.1 [THÊM — 2026-09-05]: "hạt sáng đom đóm khắp màn hình" chủ
 * dự án tự yêu cầu để mở full màn hình lúc làm việc; mất theo phòng 3D (16/09), sống lại cùng khu
 * rừng (17/09, chủ dự án chọn lại qua bản phác). Chỉ CSS (transform + opacity, xem
 * `.animate-firefly` ở globals.css) — không canvas, không JS mỗi khung hình.
 *
 * Luôn mount, chỉ đổi độ mờ — để lúc bắt đầu/kết thúc phiên chúng tan vào/tan ra thay vì bật tắt
 * đột ngột (§5.1). Lúc ẩn thì dừng hẳn hoạt ảnh, không tốn gì.
 */

const FIREFLY_COUNT = 46;

// Vị trí/nhịp cố định theo hạt giống — không `Math.random()` lúc render (react-hooks/purity, lệch hydrate).
const FIREFLIES = (() => {
  const rand = seededRandom(17);
  return Array.from({ length: FIREFLY_COUNT }, (_, id) => ({
    id,
    left: 2 + rand() * 96,
    top: 3 + rand() * 94,
    dx: (rand() - 0.5) * 90,
    dy: (rand() - 0.5) * 70,
    duration: 3.5 + rand() * 4.5,
    // Trễ ÂM: con nào cũng đang giữa nhịp ngay khi hiện ra, không đồng loạt bắt đầu từ một chỗ.
    delay: -rand() * 8,
    size: 3 + rand() * 2.5,
  }));
})();

export function Fireflies({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {FIREFLIES.map((f) => (
        <span
          key={f.id}
          className="animate-firefly absolute rounded-full"
          style={
            {
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: f.size,
              height: f.size,
              background: "var(--firefly-core)",
              boxShadow: "0 0 10px 4px var(--firefly-glow)",
              animationPlayState: visible ? "running" : "paused",
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              "--t": `${f.duration}s`,
              "--delay": `${f.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
