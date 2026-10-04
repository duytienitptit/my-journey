"use client";

import { useId } from "react";
import { TREE_STAGE_NAMES } from "@/core/balance";
import type { StatKey } from "@/core/types";
import { treeStageIndexForLevel, treeStageNameForLevel } from "./growth";
import { circlePath, seededRandom } from "./forestShapes";

/**
 * Khu vườn ba cây — hình DUY NHẤT của màn chính (2026-09-17), thay "cây tiến độ" một thân ba
 * nhánh. Chủ dự án chọn qua bản phác: MỖI CHỈ SỐ MỘT CÂY KHÁC LOÀI, đọc được bằng HÌNH DÁNG chứ
 * không chỉ bằng màu —
 *   Mind   = cây thông lam (tầng lá xếp chồng, nhọn dần),
 *   Health = cây phong cam (tán tròn nhiều chùm),
 *   Spirit = cây liễu xanh (vòm tròn, rèm lá rủ).
 * Mỗi cây tự lớn theo cấp của CHÍNH chỉ số đó, qua đúng các mốc tên ở `core/balance.ts`
 * (`TREE_STAGE_NAMES`): Seed = hạt nảy mầm trên ụ đất, Sprout = mầm hai lá, từ Sapling trở đi là
 * cây thật cao dần, Ancient thêm rễ nổi. Tên mốc giờ khớp với một cái cây thật — bản một thân ba
 * nhánh cũ thì "nhánh mind đang là Seed" không có nghĩa gì.
 *
 * Ba trạng thái khác, đều kể bằng hình chứ không bằng chữ:
 *   - chuỗi ngày-đạt = hoa nở dưới gốc (tối đa 7) — thay cho quả;
 *   - chuỗi ở ngày ân hạn (§4.6) = cả vườn ngả vàng, hoa rũ;
 *   - một chỉ số sắp bị trừ điểm (§4.1) = riêng cây đó héo nâu, lá rụng quanh gốc — thay cho vòng
 *     tròn đứt nét cũ.
 *
 * Màu là biến CSS (`--tree-*`, `app/globals.css`) nên tự đúng cả ngày lẫn đêm. Toạ độ tính trong
 * khung 640×440, chân cây đặt lên đúng mặt ụ cỏ (`knollSurfaceY`) chứ không đoán số.
 */

export type GroveLevels = Record<StatKey, number>;

type Tone = StatKey | "danger" | "wilt";
type Shade = "dark" | "base" | "light";
type Shape = { d: string; fill?: string; stroke?: string; width?: number; opacity?: number };

const VIEW_W = 640;
const VIEW_H = 440;
const CENTER_X = 320;
/** Khoảng cách từ cây giữa (health) sang hai cây hai bên. */
const TREE_SPACING = 138;

/** Từ cấp này trở lên cây thôi cao thêm — khung hình có hạn. Tên mốc vẫn đọc theo cấp thật. */
const GROWTH_CAP_LEVEL = 30;
const ANCIENT_STAGE = TREE_STAGE_NAMES.length - 1;

const r1 = (n: number) => Math.round(n * 10) / 10;
const leaf = (tone: Tone, shade: Shade) => `var(--tree-${tone}${shade === "base" ? "" : `-${shade}`})`;
const TRUNK = "var(--tree-trunk)";
const TRUNK_DARK = "var(--tree-trunk-dark)";
const SHADOW = "var(--tree-shadow)";

export { treeStageIndexForLevel, treeStageNameForLevel } from "./growth";

/** 0 → 1, tăng nhanh lúc đầu rồi chậm dần — mỗi lần lên cấp đầu đều THẤY cây khác đi. */
function growthOf(level: number): number {
  return Math.pow(Math.min(Math.max(level, 0), GROWTH_CAP_LEVEL) / GROWTH_CAP_LEVEL, 0.75);
}
function heightOf(level: number): number {
  return 45 + 215 * growthOf(level);
}

// ─── Ụ cỏ dưới khu vườn ───────────────────────────────────────────────────

type Cubic = readonly [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]];
const KNOLL: readonly Cubic[] = [
  [[8, 440], [90, 392], [210, 350], [320, 348]],
  [[320, 348], [430, 346], [550, 390], [632, 440]],
];
const KNOLL_PATH = `M8 440C90 392 210 350 320 348C430 346 550 390 632 440Z`;

function cubicAt(c: Cubic, t: number, axis: 0 | 1): number {
  const u = 1 - t;
  return u * u * u * c[0][axis] + 3 * u * u * t * c[1][axis] + 3 * u * t * t * c[2][axis] + t * t * t * c[3][axis];
}

/** Độ cao mặt ụ cỏ tại x — để chân cây, cỏ, hoa đứng ĐÚNG trên mặt đất thay vì lơ lửng. */
function knollSurfaceY(x: number): number {
  const seg = x <= KNOLL[0][3][0] ? KNOLL[0] : KNOLL[1];
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (cubicAt(seg, mid, 0) < x) lo = mid;
    else hi = mid;
  }
  return cubicAt(seg, (lo + hi) / 2, 1);
}

// ─── Hình cơ bản ──────────────────────────────────────────────────────────

/** Elip xoay được, dạng path (thuộc tính xoay của cung SVG, không cần transform). */
function ellipsePath(cx: number, cy: number, rx: number, ry: number, angleDeg = 0): string {
  const a = (angleDeg * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  return (
    `M${r1(cx - dx)} ${r1(cy - dy)}` +
    `a${r1(rx)} ${r1(ry)} ${r1(angleDeg)} 1 1 ${r1(2 * dx)} ${r1(2 * dy)}` +
    `a${r1(rx)} ${r1(ry)} ${r1(angleDeg)} 1 1 ${r1(-2 * dx)} ${r1(-2 * dy)}Z`
  );
}

function groundShadow(x: number, y: number, rx: number): Shape {
  return { d: ellipsePath(x + rx * 0.08, y + 2, rx, rx * 0.14), fill: SHADOW, opacity: 0.13 };
}

function mound(x: number, y: number, w: number): Shape[] {
  return [
    { d: ellipsePath(x, y + 1, w * 0.75, w * 0.16), fill: SHADOW, opacity: 0.08 },
    { d: `M${r1(x - w * 0.62)} ${r1(y)}Q${r1(x)} ${r1(y - w * 0.5)} ${r1(x + w * 0.62)} ${r1(y)}Z`, fill: "var(--tree-soil)" },
    {
      d: `M${r1(x - w * 0.5)} ${r1(y - 1)}Q${r1(x - w * 0.12)} ${r1(y - w * 0.42)} ${r1(x + w * 0.1)} ${r1(y - w * 0.3)}Q${r1(x - w * 0.2)} ${r1(y - w * 0.18)} ${r1(x - w * 0.5)} ${r1(y - 1)}Z`,
      fill: "var(--tree-soil-light)",
      opacity: 0.7,
    },
  ];
}

/** Rễ nổi — chỉ mốc cuối (Ancient). */
function roots(x: number, y: number, tw: number): Shape[] {
  return [
    { d: `M${r1(x - tw * 0.3)} ${r1(y - 3)}Q${r1(x - tw * 0.9)} ${r1(y - 1)} ${r1(x - tw * 1.45)} ${r1(y + 3)}`, stroke: TRUNK, width: r1(tw * 0.32) },
    { d: `M${r1(x + tw * 0.3)} ${r1(y - 3)}Q${r1(x + tw * 0.85)} ${r1(y - 1)} ${r1(x + tw * 1.35)} ${r1(y + 4)}`, stroke: TRUNK, width: r1(tw * 0.28) },
  ];
}

/**
 * [THÊM — 2026-09-17, "giao diện cây chưa chân thực"] Gờ loe ở gốc — MỌI cây thật (Sapling trở
 * lên, không riêng Ancient) đều hơi phình ra ngay chỗ chạm đất; thân thẳng tắp cắm xuống đất như
 * que cắm là điều làm cây trông "vẽ" chứ không "mọc". Vẽ một vệt tối rộng thấp NGAY DƯỚI thân
 * (đứng trước thân trong mảng `shapes` để thân che phần giữa, chỉ lộ hai bên) — không cần hình
 * dạng phức tạp, chỉ cần phá vỡ đường viền thẳng đứng của thân lúc chạm đất.
 */
function rootFlare(x: number, y: number, tw: number): Shape {
  const w = tw * 2.1;
  return {
    d: `M${r1(x - w / 2)} ${r1(y)}Q${r1(x)} ${r1(y - tw * 0.6)} ${r1(x + w / 2)} ${r1(y)}Q${r1(x)} ${r1(y + tw * 0.22)} ${r1(x - w / 2)} ${r1(y)}Z`,
    fill: TRUNK_DARK,
    opacity: 0.4,
  };
}

/**
 * [THÊM — 2026-09-17] Hai vệt vân gỗ dọc thân — spruce đã có riêng (tiết diện chữ nhật đơn
 * giản), tách ra dùng chung cho maple/willow (thân cong, chỉ cần áp gần đúng vị trí là đủ, đây
 * là chi tiết trang trí không cần khớp pixel). Vân KHÔNG chạy hết tới đỉnh — dừng ở khoảng thân
 * còn LỘ RA trước khi chìm vào tán, vân xuyên qua tán sẽ vẽ đè lên lá.
 */
function barkGrain(x: number, yTop: number, yBottom: number, tw: number): Shape[] {
  const h = yBottom - yTop;
  return [
    {
      d: `M${r1(x - tw * 0.1)} ${r1(yBottom)}C${r1(x - tw * 0.13)} ${r1(yBottom - h * 0.4)} ${r1(x - tw * 0.05)} ${r1(yTop + h * 0.3)} ${r1(x - tw * 0.02)} ${r1(yTop)}`,
      stroke: TRUNK_DARK,
      width: Math.max(1, tw * 0.1),
      opacity: 0.3,
    },
    {
      d: `M${r1(x + tw * 0.14)} ${r1(yBottom)}C${r1(x + tw * 0.17)} ${r1(yBottom - h * 0.45)} ${r1(x + tw * 0.1)} ${r1(yTop + h * 0.35)} ${r1(x + tw * 0.06)} ${r1(yTop)}`,
      stroke: TRUNK_DARK,
      width: Math.max(1, tw * 0.08),
      opacity: 0.24,
    },
  ];
}

/**
 * [THÊM — 2026-09-17] Vài chấm lá đậm/nhạt rải trong một cụm tán — phá độ MỊN PHẲNG của gradient
 * tròn đơn (thứ khiến tán trông như "quả bóng bàn" thay vì lá thật). Hạt giống theo toạ độ tâm
 * cụm (làm tròn) nên ổn định qua mọi lần render ở CÙNG một cấp — không nhấp nháy khi component
 * re-render vì lý do khác (đổi checkbox héo, đổi streak...).
 */
function leafFlecks(cx: number, cy: number, r: number, tone: Tone): Shape[] {
  const rand = seededRandom(Math.round(cx * 13 + cy * 7 + r));
  return Array.from({ length: 3 }, () => {
    const a = rand() * Math.PI * 2;
    const d = rand() * r * 0.55;
    const px = cx + Math.cos(a) * d;
    const py = cy + Math.sin(a) * d * 0.75;
    const dabR = r * (0.13 + rand() * 0.09);
    return {
      d: ellipsePath(px, py, dabR, dabR * 0.7, rand() * 180),
      fill: leaf(tone, rand() > 0.5 ? "dark" : "light"),
      opacity: 0.3,
    };
  });
}

// ─── Hai mốc đầu: hạt và mầm (chung cho cả ba loài, chỉ khác màu lá) ─────

function seedShapes(x: number, y: number, tone: Tone): Shape[] {
  return [
    ...mound(x, y, 44),
    { d: ellipsePath(x - 3, y - 15, 7, 5, -24), fill: "var(--tree-soil-dark)" },
    { d: `M${x} ${y - 18}C${x + 1} ${y - 26} ${x + 3} ${y - 30} ${x + 2} ${y - 34}`, stroke: leaf(tone, "dark"), width: 2.6 },
    {
      d: `M${x + 2} ${y - 34}C${x - 3} ${y - 37} ${x - 11} ${y - 42} ${x - 14} ${y - 36}C${x - 10} ${y - 32} ${x - 4} ${y - 32} ${x + 2} ${y - 34}Z`,
      fill: leaf(tone, "base"),
    },
    {
      d: `M${x + 2} ${y - 34}C${x + 7} ${y - 39} ${x + 16} ${y - 45} ${x + 19} ${y - 38}C${x + 14} ${y - 33} ${x + 7} ${y - 33} ${x + 2} ${y - 34}Z`,
      fill: leaf(tone, "light"),
    },
  ];
}

function sproutShapes(x: number, y: number, level: number, tone: Tone): Shape[] {
  const h = 34 + 8 * Math.min(Math.max(level, 1), 3);
  return [
    ...mound(x, y, 38),
    { d: `M${x} ${y - 8}C${x - 3} ${r1(y - h * 0.45)} ${x + 4} ${r1(y - h * 0.75)} ${x} ${y - h}`, stroke: leaf(tone, "dark"), width: 3 },
    {
      d: `M${x} ${y - h}C${x - 6} ${y - h - 4} ${x - 18} ${y - h - 14} ${x - 22} ${y - h - 3}C${x - 16} ${y - h + 4} ${x - 6} ${y - h + 3} ${x} ${y - h}Z`,
      fill: leaf(tone, "base"),
    },
    {
      d: `M${x} ${y - h}C${x + 7} ${y - h - 6} ${x + 22} ${y - h - 18} ${x + 27} ${y - h - 6}C${x + 20} ${y - h + 3} ${x + 8} ${y - h + 3} ${x} ${y - h}Z`,
      fill: leaf(tone, "light"),
    },
  ];
}

// ─── Ba loài cây ──────────────────────────────────────────────────────────

/** Mind — thông lam: các tầng lá có mép dưới lượn "váy", hai cạnh cong lõm, mặt trái đón nắng. */
function spruceShapes(x: number, y: number, level: number, tone: Tone, stage: number): Shape[] {
  const g = growthOf(level);
  const Ht = heightOf(level);
  const trunkH = Ht * 0.12;
  const tw = 5 + 9 * g;
  const Wd = Ht * 0.62;
  const tiers = 3 + Math.round(2 * g);
  const fh = Ht - trunkH;

  const tierPath = (by: number, wb: number, wt: number, th: number, dx = 0, dy = 0) => {
    const k = wb > 90 ? 4 : 3;
    const sag = wb * 0.085;
    let d = `M${r1(x - wb / 2 + dx)} ${r1(by + dy)}`;
    for (let j = 0; j < k; j++) {
      const x0 = x - wb / 2 + (wb * j) / k;
      const x1 = x - wb / 2 + (wb * (j + 1)) / k;
      const edge = j === 0 || j === k - 1 ? 1.1 : 1.6;
      d += `Q${r1((x0 + x1) / 2 + dx)} ${r1(by + sag * edge + dy)} ${r1(x1 + dx)} ${r1(by + dy)}`;
    }
    d += `Q${r1(x + wb * 0.2 + dx)} ${r1(by - th * 0.42 + dy)} ${r1(x + wt / 2 + dx)} ${r1(by - th + dy)}`;
    d += `L${r1(x - wt / 2 + dx)} ${r1(by - th + dy)}Q${r1(x - wb * 0.2 + dx)} ${r1(by - th * 0.42 + dy)} ${r1(x - wb / 2 + dx)} ${r1(by + dy)}Z`;
    return d;
  };

  const trunkTop = y - trunkH - 10;
  const shapes: Shape[] = [
    groundShadow(x, y, Wd * 0.46),
    rootFlare(x, y, tw),
    { d: `M${r1(x - tw / 2)} ${r1(trunkTop)}h${r1(tw)}v${r1(trunkH + 10)}h${r1(-tw)}Z`, fill: TRUNK },
    { d: `M${r1(x + tw * 0.05)} ${r1(trunkTop)}h${r1(tw * 0.45)}v${r1(trunkH + 10)}h${r1(-tw * 0.45)}Z`, fill: TRUNK_DARK, opacity: 0.35 },
  ];
  if (stage === ANCIENT_STAGE) shapes.push(...roots(x, y, tw * 1.6));

  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const by = y - trunkH - fh * t * 0.79;
    const th = fh * (0.45 - 0.035 * i);
    const wb = Wd * (1 - t * 0.76);
    const wt = i === tiers - 1 ? 0 : wb * 0.16;
    const x1 = x - wb / 2 + wb / (wb > 90 ? 4 : 3);
    shapes.push(
      { d: tierPath(by, wb, wt, th, wb * 0.03, 5), fill: leaf(tone, "dark"), opacity: 0.9 },
      { d: tierPath(by, wb, wt, th), fill: leaf(tone, "base") },
      {
        // Nửa trái của CHÍNH tầng đó — không lệch đỉnh ra ngoài bóng cây (lỗi của bản phác đầu).
        d:
          `M${r1(x - wt / 2)} ${r1(by - th)}Q${r1(x - wb * 0.2)} ${r1(by - th * 0.42)} ${r1(x - wb / 2)} ${r1(by)}` +
          `Q${r1((x - wb / 2 + x1) / 2)} ${r1(by + wb * 0.094)} ${r1(x1)} ${r1(by)}` +
          `L${r1(x - wb * 0.1)} ${r1(by - th * 0.3)}L${r1(x - wt * 0.05)} ${r1(by - th)}Z`,
        fill: leaf(tone, "light"),
        opacity: 0.45,
      },
    );
  }
  return shapes;
}

/** Vị trí các chùm lá của cây phong, theo bán kính tán R: [dx, dy, bán kính, góc xoay°, tỉ lệ
 *  dẹt]. [SỬA — 2026-09-17, "chưa chân thực"] Bốn số đầu giữ NGUYÊN từ bản trước (vị trí đã
 *  đúng) — chỉ THÊM góc xoay + độ dẹt để mỗi chùm là một elip lệch thay vì vòng tròn hoàn hảo:
 *  tán cây thật không phải các quả cầu chồng lên nhau, đây là thứ làm nó trông như "vẽ bằng
 *  compa" nhiều nhất trong cả ba loài. */
const MAPLE_CLUMPS: readonly (readonly [number, number, number, number, number])[] = [
  [-0.62, 0.16, 0.5, -18, 0.82],
  [0.64, 0.1, 0.52, 14, 0.86],
  [0, 0.3, 0.56, 4, 0.78],
  [-0.3, -0.28, 0.64, -10, 0.9],
  [0.34, -0.3, 0.6, 12, 0.88],
  [0.02, -0.74, 0.5, -6, 0.84],
  [-0.68, -0.34, 0.38, -22, 0.9],
  [0.7, -0.38, 0.36, 20, 0.92],
];

/** Health — phong cam: thân thon + hai cành, tán nhiều chùm có bóng dưới-phải và viền sáng trên-trái. */
function mapleShapes(x: number, y: number, level: number, tone: Tone, stage: number): Shape[] {
  const g = growthOf(level);
  const Ht = heightOf(level) * 0.96;
  const R = Ht * 0.33;
  const cy = y - Ht + R * 1.05;
  const tw = 7 + 12 * g;
  const limb = r1(Math.max(2.5, tw * 0.32));
  const trunkTopY = cy + R * 0.35; // chỗ thân còn LỘ RA trước khi chìm vào tán — vân gỗ dừng ở đây.

  const shapes: Shape[] = [
    groundShadow(x, y, R * 1.05),
    rootFlare(x, y, tw),
    {
      d:
        `M${r1(x - tw / 2)} ${r1(y)}C${r1(x - tw * 0.3)} ${r1(y - Ht * 0.22)} ${r1(x - tw * 0.2)} ${r1(cy + R * 0.6)} ${r1(x - tw * 0.14)} ${r1(cy)}` +
        `L${r1(x + tw * 0.14)} ${r1(cy)}C${r1(x + tw * 0.2)} ${r1(cy + R * 0.6)} ${r1(x + tw * 0.3)} ${r1(y - Ht * 0.22)} ${r1(x + tw / 2)} ${r1(y)}Z`,
      fill: TRUNK,
    },
    ...barkGrain(x, trunkTopY, y, tw),
    { d: `M${r1(x)} ${r1(cy + R * 0.62)}Q${r1(x - R * 0.28)} ${r1(cy + R * 0.4)} ${r1(x - R * 0.56)} ${r1(cy + R * 0.1)}`, stroke: TRUNK, width: limb },
    { d: `M${r1(x)} ${r1(cy + R * 0.5)}Q${r1(x + R * 0.3)} ${r1(cy + R * 0.3)} ${r1(x + R * 0.58)} ${r1(cy + R * 0.02)}`, stroke: TRUNK, width: limb },
    // Một nhánh con lú ra ngoài mép tán — vẽ TRƯỚC các chùm lá bên dưới nên phần trong tán bị lá
    // che mất, chỉ đúng phần LÚ RA khỏi silhouette còn lộ. Cây thật không bao giờ có viền lá kín
    // tuyệt đối; đây là chi tiết rẻ nhưng ăn tiền nhất cho cảm giác "cây thật" (không phải hình
    // học đóng gói gọn gàng).
    {
      d: `M${r1(x + R * 0.1)} ${r1(cy - R * 0.1)}Q${r1(x + R * 0.5)} ${r1(cy - R * 0.55)} ${r1(x + R * 0.78)} ${r1(cy - R * 0.86)}`,
      stroke: TRUNK,
      width: Math.max(1.4, tw * 0.14),
    },
  ];
  if (stage === ANCIENT_STAGE) shapes.push(...roots(x, y, tw));

  shapes.push(
    {
      d: MAPLE_CLUMPS.map(([dx, dy, r, rot, ry]) => ellipsePath(x + dx * R + R * 0.07, cy + dy * R + R * 0.12, r * R, r * R * ry, rot)).join(""),
      fill: leaf(tone, "dark"),
    },
    {
      d: MAPLE_CLUMPS.map(([dx, dy, r, rot, ry]) => ellipsePath(x + dx * R, cy + dy * R, r * R * 0.95, r * R * 0.95 * ry, rot)).join(""),
      fill: leaf(tone, "base"),
    },
  );
  // Viền sáng hình lưỡi liềm ở mép trên-trái từng chùm: vòng sáng rồi phủ lại vòng màu gốc lệch
  // xuống-phải. Xếp từ chùm cao xuống chùm thấp để chùm phía trước che đúng chùm phía sau.
  [...MAPLE_CLUMPS]
    .filter(([, dy]) => dy < 0.25)
    .sort((a, b) => a[1] - b[1])
    .forEach(([dx, dy, r]) => {
      const px = x + dx * R;
      const py = cy + dy * R;
      const rr = r * R * 0.95;
      shapes.push(
        { d: circlePath(px - rr * 0.1, py - rr * 0.12, rr * 0.92), fill: leaf(tone, "light") },
        { d: circlePath(px + rr * 0.05, py + rr * 0.06, rr * 0.9), fill: leaf(tone, "base") },
      );
    });
  // Chấm lá rải trong TỪNG chùm — phá độ mịn phẳng của gradient tròn (xem leafFlecks).
  MAPLE_CLUMPS.forEach(([dx, dy, r]) => shapes.push(...leafFlecks(x + dx * R, cy + dy * R, r * R, tone)));
  return shapes;
}

/** Spirit — liễu xanh: vòm tròn trên đầu, rèm lá buông hai bên, mép dưới so le như từng dải lá rủ. */
function willowShapes(x: number, y: number, level: number, tone: Tone, stage: number): Shape[] {
  const g = growthOf(level);
  const Ht = heightOf(level) * 0.9;
  const R = Ht * 0.35;
  const tw = 7 + 11 * g;
  const topY = y - Ht;
  const hemY = y - Ht * 0.2;
  const left = x - R;
  const right = x + R * 1.04;

  const curtain = (dx: number, dy: number) => {
    // Hạt giống cố định: lên cấp thì rèm chỉ to ra, không đổi kiểu mép dưới mỗi lần.
    const rand = seededRandom(13);
    const L = left + dx;
    const Rr = right + dx;
    let d = `M${r1(L)} ${r1(hemY - Ht * 0.08 + dy)}`;
    d += `C${r1(L - R * 0.06)} ${r1(hemY - Ht * 0.4 + dy)} ${r1(L + R * 0.02)} ${r1(topY + R * 0.25 + dy)} ${r1(x - R * 0.12 + dx)} ${r1(topY + dy)}`;
    d += `C${r1(x + R * 0.55 + dx)} ${r1(topY - R * 0.02 + dy)} ${r1(Rr + R * 0.06)} ${r1(topY + R * 0.4 + dy)} ${r1(Rr)} ${r1(hemY - Ht * 0.1 + dy)}`;
    const fingers = 8 + Math.round(3 * g);
    for (let j = 0; j < fingers; j++) {
      const xa = Rr - ((Rr - L) * j) / fingers;
      const xb = Rr - ((Rr - L) * (j + 1)) / fingers;
      const edge = j === 0 || j === fingers - 1 ? 0.45 : 1;
      const depth = Ht * (0.05 + 0.13 * rand()) * edge;
      d += `Q${r1((xa + xb) / 2)} ${r1(hemY + depth + dy)} ${r1(xb)} ${r1(hemY - Ht * 0.035 + dy)}`;
    }
    return d + "Z";
  };

  const shapes: Shape[] = [
    groundShadow(x, y, R * 1.05),
    rootFlare(x, y, tw),
    {
      d:
        `M${r1(x - tw / 2)} ${r1(y)}C${r1(x - tw * 0.6)} ${r1(y - Ht * 0.25)} ${r1(x + tw * 0.4)} ${r1(y - Ht * 0.45)} ${r1(x - tw * 0.05)} ${r1(y - Ht * 0.7)}` +
        `L${r1(x + tw * 0.3)} ${r1(y - Ht * 0.7)}C${r1(x + tw * 0.8)} ${r1(y - Ht * 0.45)} ${r1(x)} ${r1(y - Ht * 0.25)} ${r1(x + tw / 2)} ${r1(y)}Z`,
      fill: TRUNK,
    },
    ...barkGrain(x, y - Ht * 0.68, y, tw),
  ];
  if (stage === ANCIENT_STAGE) shapes.push(...roots(x, y, tw));
  shapes.push({ d: curtain(R * 0.05, 6), fill: leaf(tone, "dark") }, { d: curtain(0, 0), fill: leaf(tone, "base") });
  // Chấm lá trên vòm — chỉ phần MŨ tròn phía trên (dưới vòm đã có sợi lá rủ làm texture riêng).
  [-0.42, -0.14, 0.16, 0.44].forEach((t) =>
    shapes.push(...leafFlecks(x + t * R, topY + R * (0.32 - 0.18 * Math.abs(t)), R * 0.3, tone)),
  );

  // Sợi lá rủ: nét mảnh sáng/tối xen kẽ, dài ngắn khác nhau.
  const rand = seededRandom(29);
  const strands = 12 + Math.round(6 * g);
  const strokeW = r1(Math.max(1.4, R * 0.045));
  for (let i = 0; i < strands; i++) {
    const t = (i + 0.5) / strands;
    const sx = left + R * 0.16 + t * (right - left - R * 0.32);
    const sy = topY + R * (0.3 + 0.25 * Math.abs(t - 0.45)) + rand() * R * 0.15;
    const ey = hemY - Ht * 0.02 + rand() * Ht * 0.06;
    const bow = (t - 0.5) * R * 0.18;
    const light = i % 2 === 0;
    shapes.push({
      d: `M${r1(sx)} ${r1(sy)}Q${r1(sx + bow)} ${r1((sy + ey) / 2)} ${r1(sx + bow * 0.4)} ${r1(ey)}`,
      stroke: leaf(tone, light ? "light" : "dark"),
      width: strokeW,
      opacity: light ? 0.75 : 0.45,
    });
  }
  shapes.push({
    d:
      `M${r1(x - R * 0.72)} ${r1(topY + R * 0.42)}C${r1(x - R * 0.6)} ${r1(topY + R * 0.08)} ${r1(x - R * 0.1)} ${r1(topY - R * 0.02)} ${r1(x + R * 0.28)} ${r1(topY + R * 0.1)}` +
      `C${r1(x - R * 0.05)} ${r1(topY + R * 0.2)} ${r1(x - R * 0.45)} ${r1(topY + R * 0.3)} ${r1(x - R * 0.72)} ${r1(topY + R * 0.42)}Z`,
    fill: leaf(tone, "light"),
    opacity: 0.8,
  });
  return shapes;
}

const SPECIES: Record<StatKey, (x: number, y: number, level: number, tone: Tone, stage: number) => Shape[]> = {
  mind: spruceShapes,
  health: mapleShapes,
  spirit: willowShapes,
};

function treeShapes(stat: StatKey, x: number, y: number, level: number, tone: Tone): Shape[] {
  const stage = treeStageIndexForLevel(level);
  if (stage === 0) return seedShapes(x, y, tone);
  if (stage === 1) return sproutShapes(x, y, level, tone);
  return SPECIES[stat](x, y, level, tone, stage);
}

// ─── Chi tiết dưới gốc ────────────────────────────────────────────────────

function fallenLeaves(x: number, y: number, spread: number): Shape[] {
  const rand = seededRandom(Math.round(x * 7 + y));
  return Array.from({ length: 10 }, () => {
    const lx = x + (rand() - 0.5) * spread * 2;
    const ly = y + 2 + rand() * 12;
    return { d: ellipsePath(lx, ly, 5.6, 2.9, rand() * 180), fill: "var(--tree-fallen-leaf)" };
  });
}

/** Chỗ nở hoa theo chuỗi ngày-đạt, lần lượt từ giữa ra — [lệch x so với tâm vườn, độ lún vào đất]. */
const FLOWER_SPOTS: readonly (readonly [number, number])[] = [
  [-60, 16],
  [58, 18],
  [-176, 12],
  [184, 12],
  [-8, 24],
  [-104, 22],
  [104, 24],
];

function flower(x: number, y: number, wilted: boolean): Shape[] {
  const hx = wilted ? x + 4 : x;
  const hy = wilted ? y - 11 : y - 14;
  const petals = [0, 72, 144, 216, 288]
    .map((a) => {
      const rad = ((a + (wilted ? 35 : 0)) * Math.PI) / 180;
      return circlePath(hx + Math.cos(rad) * 3.6, hy + Math.sin(rad) * 3.6, 3);
    })
    .join("");
  return [
    { d: `M${x} ${r1(y)}Q${x + (wilted ? 5 : 1)} ${r1(y - 8)} ${hx} ${r1(hy)}`, stroke: "var(--flower-stem)", width: 1.8 },
    { d: petals, fill: wilted ? "var(--flower-petal-wilted)" : "var(--flower-petal)" },
    { d: circlePath(hx, hy, 2.4), fill: "var(--flower-center)" },
  ];
}

const GRASS_TUFTS: readonly number[] = [-222, -160, -32, 36, 160, 224];

function grass(): Shape {
  const d = GRASS_TUFTS.map((dx, i) => {
    const s = 0.9 + (i % 3) * 0.15;
    const bx = CENTER_X + dx;
    const by = r1(knollSurfaceY(bx) + 7);
    return (
      `M${bx} ${by}C${r1(bx - 2 * s)} ${r1(by - 9 * s)} ${r1(bx - s)} ${r1(by - 14 * s)} ${r1(bx + s)} ${r1(by - 19 * s)}` +
      `M${bx} ${by}C${r1(bx + s)} ${r1(by - 10 * s)} ${r1(bx + 4 * s)} ${r1(by - 14 * s)} ${r1(bx + 8 * s)} ${r1(by - 17 * s)}` +
      `M${bx} ${by}C${r1(bx - s)} ${r1(by - 8 * s)} ${r1(bx - 4 * s)} ${r1(by - 12 * s)} ${r1(bx - 8 * s)} ${r1(by - 15 * s)}`
    );
  }).join("");
  return { d, stroke: "var(--forest-grass)", width: 2.2 };
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  levels: GroveLevels;
  /** Chuỗi ngày-đạt hiện tại — mỗi bông hoa là một ngày, tối đa 7 (con số chính xác đã có ở góc màn hình). */
  streak: number;
  /** Chuỗi đang ở ngày ân hạn (§4.6) — cả vườn ngả vàng, hoa rũ. */
  danger?: boolean;
  /** Chỉ số nào sắp bị trừ điểm hôm nay (§4.1, ngày ân hạn CUỐI của decay.ts) — riêng cây đó héo. */
  neglectDanger?: Partial<Record<StatKey, boolean>>;
};

export function ForestGrove({ levels, streak, danger = false, neglectDanger = {} }: Props) {
  // Id riêng mỗi lần mount — gradient SVG chỉ tham chiếu được qua id thật trong tài liệu.
  const uid = useId();

  // Ân hạn chuỗi (cả vườn) lấn át cảnh báo riêng từng cây — hai lớp màu chồng nhau sẽ không đọc
  // ra được cái nào.
  const toneOf = (stat: StatKey): Tone => (danger ? "danger" : neglectDanger[stat] ? "wilt" : stat);
  const wilting = (stat: StatKey) => !danger && Boolean(neglectDanger[stat]);

  const place = (stat: StatKey, dx: number, sink: number) => {
    const x = CENTER_X + dx;
    const y = r1(knollSurfaceY(x) + sink);
    return [...treeShapes(stat, x, y, levels[stat], toneOf(stat)), ...(wilting(stat) ? fallenLeaves(x, y, 50) : [])];
  };

  const shapes: Shape[] = [
    // Cây giữa đứng lùi phía sau một chút, vẽ trước để hai cây hai bên che lên nó.
    ...place("health", 0, 10),
    ...place("mind", -TREE_SPACING, 5),
    ...place("spirit", TREE_SPACING, 6),
    grass(),
    ...FLOWER_SPOTS.slice(0, Math.max(0, Math.min(FLOWER_SPOTS.length, streak))).flatMap(([dx, sink]) =>
      flower(CENTER_X + dx, r1(knollSurfaceY(CENTER_X + dx) + sink), danger),
    ),
  ];

  const ariaLabel = (["mind", "health", "spirit"] as const)
    .map((stat) => `${stat}: ${treeStageNameForLevel(levels[stat])} (level ${levels[stat]})${wilting(stat) ? ", wilting" : ""}`)
    .join("; ");

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMax meet"
      className="h-full w-full"
      role="img"
      aria-label={`Your grove — ${ariaLabel}`}
    >
      <defs>
        {/* Ụ cỏ mờ dần xuống đáy — khung chứa khu vườn không bao giờ trùng khít mép đồng cỏ của
            khu rừng phía sau (mỗi khổ màn hình một khác), nên đáy ụ tan vào cảnh thay vì bị cắt
            ngang thành một đường thẳng. */}
        <linearGradient id={`${uid}-knoll`} gradientUnits="userSpaceOnUse" x1="0" y1="346" x2="0" y2={VIEW_H}>
          <stop offset="0" style={{ stopColor: "var(--forest-meadow-top)" }} />
          <stop offset="0.5" style={{ stopColor: "var(--forest-meadow-top)", stopOpacity: 0.85 }} />
          <stop offset="1" style={{ stopColor: "var(--forest-meadow-bottom)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={KNOLL_PATH} fill={`url(#${uid}-knoll)`} />
      {shapes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          style={{ fill: s.fill ?? "none", stroke: s.stroke }}
          strokeWidth={s.width}
          strokeLinecap={s.stroke ? "round" : undefined}
          opacity={s.opacity}
        />
      ))}
    </svg>
  );
}
