"use client";

import type { StatKey } from "@/core/types";

/**
 * Cây tiến độ — hình DUY NHẤT của màn chính mới (2026-09-16, thay căn phòng 3D). Ba nhánh = ba
 * chỉ số, nhánh nào cấp cao thì tán to ra; quả = chuỗi ngày-đạt gần đây. Vẽ bằng SVG thuần:
 * không asset, không WebGL, không camera/ánh sáng — tức là không còn chỗ nào để hỏng thẩm mỹ
 * như căn phòng 3D (xem CLAUDE.md, ba lần bị chê trong 8 ngày).
 *
 * Toàn bộ hình học suy ra từ `levelByStat` nên cây LỚN LÊN THẬT theo dữ liệu, không phải ảnh
 * minh hoạ. Cấp có thể lên tới 30+ (§4.8) nên bán kính tán dùng căn bậc hai để bão hoà dần —
 * tuyến tính thì tới cấp 20 tán sẽ tràn ra ngoài khung hình.
 */

export type TreeLevels = Record<StatKey, number>;

/** Màu ba chỉ số cho CÂY — một chỗ duy nhất. Đậm hơn `ROOM_LIGHT_COLOR` (màu đèn phòng 3D, vốn
 *  là sắc rất nhạt để pha ánh sáng) vì ở đây chúng là màu vẽ thật trên nền sáng. */
const STAT_COLOR: Record<StatKey, { leaf: string; leafLight: string }> = {
  mind: { leaf: "#5f8fbf", leafLight: "#7fa9d1" },
  health: { leaf: "#d98e5a", leafLight: "#e8a97c" },
  spirit: { leaf: "#5f9e86", leafLight: "#7fb89e" },
};

const TRUNK = "#8a6e4e";

function canopyRadius(level: number): number {
  return 21 + 7 * Math.sqrt(Math.max(0, level));
}

type Props = {
  levels: TreeLevels;
  /** Chuỗi ngày-đạt hiện tại — mỗi quả trên cây là một ngày, tối đa 7 quả rồi thôi (nhiều hơn
   *  thì cây rối, và con số chính xác đã có ở góc màn hình). */
  streak: number;
  /** Chuỗi đang ở ngày ân hạn (§4.6) — lá ngả vàng, cách app "trách" mà không cần một chữ nào. */
  danger?: boolean;
};

export function TreeOfProgress({ levels, streak, danger = false }: Props) {
  const mind = canopyRadius(levels.mind);
  const health = canopyRadius(levels.health);
  const spirit = canopyRadius(levels.spirit);

  const color = (stat: StatKey) => (danger ? { leaf: "#c8a35f", leafLight: "#d9b878" } : STAT_COLOR[stat]);

  // Quả treo ở mép tán — vị trí cố định theo chỉ số i (không ngẫu nhiên) để lần vẽ nào cũng
  // giống nhau, đúng tinh thần §8.1: mọi thứ suy ra được từ dữ liệu, không có trạng thái ẩn.
  const fruits = Array.from({ length: Math.min(7, streak) }, (_, i) => {
    const spots: [number, number][] = [
      [96, 150], [204, 158], [150, 96], [122, 128], [178, 124], [138, 176], [186, 186],
    ];
    return spots[i];
  });

  return (
    <svg viewBox="0 0 300 260" className="h-full w-full" role="img" aria-label={`Cây tiến độ: mind cấp ${levels.mind}, health cấp ${levels.health}, spirit cấp ${levels.spirit}`}>
      <ellipse cx="150" cy="232" rx="92" ry="15" className="fill-foreground/10" />
      <ellipse cx="150" cy="230" rx="66" ry="9" className="fill-foreground/[0.07]" />

      <g className="stroke-foreground/25" strokeWidth="3" strokeLinecap="round">
        <path d="M104 228 C 101 221 100 217 101 212" fill="none" />
        <path d="M118 231 C 116 224 116 220 118 215" fill="none" />
        <path d="M182 231 C 184 224 184 220 182 215" fill="none" />
        <path d="M196 228 C 199 221 200 217 199 212" fill="none" />
      </g>

      <rect x="144" y="150" width="13" height="82" rx="5" fill={TRUNK} />
      <path d="M150 178 C 126 168 112 152 106 138" fill="none" stroke={TRUNK} strokeWidth="8" strokeLinecap="round" />
      <path d="M150 166 C 174 158 190 142 196 128" fill="none" stroke={TRUNK} strokeWidth="8" strokeLinecap="round" />
      <path d="M150 158 C 150 140 150 128 150 118" fill="none" stroke={TRUNK} strokeWidth="9" strokeLinecap="round" />

      <circle cx="106" cy="136" r={mind} fill={color("mind").leaf} />
      <circle cx="98" cy="128" r={mind * 0.62} fill={color("mind").leafLight} />

      <circle cx="196" cy="126" r={spirit} fill={color("spirit").leaf} />
      <circle cx="204" cy="118" r={spirit * 0.62} fill={color("spirit").leafLight} />

      <circle cx="150" cy="106" r={health} fill={color("health").leaf} />
      <circle cx="142" cy="97" r={health * 0.62} fill={color("health").leafLight} />

      {fruits.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.5" fill={danger ? "#b5893f" : "#d9663f"} />
      ))}
    </svg>
  );
}
