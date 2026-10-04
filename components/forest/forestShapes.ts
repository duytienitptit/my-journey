/**
 * Hình học của khu rừng phía sau mọi trang (2026-09-17) — tạo MỘT LẦN lúc nạp module, không phụ
 * thuộc dữ liệu nào. Tách khỏi component để ForestBackdrop chỉ còn việc tô màu.
 *
 * Không dùng `Math.random()`: cảnh phải giống hệt nhau giữa server và client (lệch là lỗi hydrate)
 * và giữa mọi lần mở app — dùng PRNG có hạt giống cố định thay thế.
 */

export const BACKDROP_W = 1600;
export const BACKDROP_H = 1000;

/** mulberry32 — PRNG nhỏ, đủ đều cho việc rải cây; cùng hạt giống → cùng một khu rừng. */
export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/*
 * Mọi hình con trong MỘT path phải cùng chiều kim đồng hồ (trên màn hình) — path tô theo luật
 * `nonzero`, hai hình chồng nhau mà ngược chiều sẽ triệt tiêu thành LỖ thủng giữa tán cây.
 */

/** Hình tròn dưới dạng path, chiều kim đồng hồ (sweep-flag = 1). */
export function circlePath(cx: number, cy: number, r: number): string {
  return `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 1 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 1 ${r1(-2 * r)} 0Z`;
}

/** Bóng cây lá kim ba tầng răng cưa: trái-dưới → đỉnh → phải-dưới (chiều kim đồng hồ). */
function coniferPath(x: number, y: number, h: number, w: number): string {
  const pts: [number, number][] = [
    [-0.5, 0], [-0.2, -0.3], [-0.4, -0.3], [-0.14, -0.58], [-0.3, -0.58], [0, -1],
    [0.3, -0.58], [0.14, -0.58], [0.4, -0.3], [0.2, -0.3], [0.5, 0],
  ];
  return pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${r1(x + px * w)} ${r1(y + py * h)}`).join("") + "Z";
}

/** Bóng cây tán tròn: thân + ba vòng tròn chồng. */
function roundTreePath(x: number, y: number, h: number, w: number): string {
  const R = w * 0.5;
  const trunkW = w * 0.1;
  const trunkH = h * 0.45;
  return (
    `M${r1(x - trunkW / 2)} ${r1(y - trunkH)}h${r1(trunkW)}v${r1(trunkH)}h${r1(-trunkW)}Z` +
    circlePath(x, y - h + R, R) +
    circlePath(x - R * 0.6, y - h + R * 1.5, R * 0.72) +
    circlePath(x + R * 0.62, y - h + R * 1.45, R * 0.76)
  );
}

type TreeLineSpec = {
  seed: number;
  /** Chân rặng cây (toạ độ y trong khung 1600×1000). */
  baseY: number;
  hMin: number;
  hMax: number;
  gapMin: number;
  gapMax: number;
  /** Tỉ lệ cây lá kim (phần còn lại là cây tán tròn). */
  coniferRatio: number;
  /** Chừa khoảng trống — không mọc cây ở đoạn x này. */
  clearing?: readonly [number, number];
};

/** Một rặng cây = MỘT path duy nhất (các thân cây + dải đất lượn sóng dưới chân). */
function treeLinePath(spec: TreeLineSpec): string {
  const rand = seededRandom(spec.seed);
  let ground = `M-40 ${BACKDROP_H + 40}L-40 ${spec.baseY}`;
  for (let gx = -40; gx < BACKDROP_W + 40; gx += 200) {
    ground += `Q${r1(gx + 100)} ${r1(spec.baseY - 11 + rand() * 22)} ${gx + 200} ${r1(spec.baseY + (rand() - 0.5) * 10)}`;
  }
  ground += `L${BACKDROP_W + 40} ${BACKDROP_H + 40}Z`;

  let trees = "";
  let x = -48 + rand() * 32;
  while (x < BACKDROP_W + 64) {
    const h = spec.hMin + rand() * (spec.hMax - spec.hMin);
    const conifer = rand() < spec.coniferRatio;
    const inClearing = spec.clearing && x > spec.clearing[0] && x < spec.clearing[1];
    if (!inClearing) {
      trees += conifer ? coniferPath(x, spec.baseY + 10, h, h * 0.44) : roundTreePath(x, spec.baseY + 10, h * 0.82, h * 0.62);
    }
    x += spec.gapMin + rand() * (spec.gapMax - spec.gapMin);
  }
  return trees + ground;
}

/** Ba rặng rừng từ xa tới gần. Rặng gần nhất chừa khoảng trống bên phải — chỗ khu vườn ba cây
 *  ở màn chính đứng, để cây của mình không lẫn vào bóng rừng phía sau. */
export const FOREST_LAYERS: readonly string[] = [
  treeLinePath({ seed: 11, baseY: 515, hMin: 76, hMax: 154, gapMin: 32, gapMax: 60, coniferRatio: 0.6 }),
  treeLinePath({ seed: 23, baseY: 615, hMin: 112, hMax: 205, gapMin: 45, gapMax: 83, coniferRatio: 0.5 }),
  // Khoảng trống đo theo vị trí THẬT của khu vườn ở 1280×800 → 1920×1080: tâm vườn rơi vào
  // x ≈ 990–1080, cây hai bên ≈ 860–1260 trong khung 1600×1000.
  treeLinePath({ seed: 37, baseY: 723, hMin: 152, hMax: 280, gapMin: 61, gapMax: 122, coniferRatio: 0.45, clearing: [820, 1360] }),
];

/** Dải sương giữa các rặng — y bắt đầu của mỗi dải, cao 145. */
export const MIST_BANDS: readonly { y: number; opacity: number }[] = [
  { y: 400, opacity: 1 },
  { y: 506, opacity: 1 },
  { y: 628, opacity: 0.6 },
];

/** Đồng cỏ phía trước, thấp dần về bên trái. */
export const MEADOW_PATH = "M-40 1040L-40 845C288 812 752 819 1024 778C1264 740 1440 758 1640 787L1640 1040Z";

/** Tia nắng xiên từ góc trên-phải (chỉ ban ngày). */
export const SUN_RAYS: readonly string[] = [
  [976, 64, 0],
  [1152, 88, 1],
  [1344, 67, 2],
].map(([x0, w, i]) => `M${x0} -16L${x0 + w} -16L${x0 - 528 + i * 48} ${BACKDROP_H}L${x0 - 672 + i * 48} ${BACKDROP_H}Z`);

/** Bụi dương xỉ khung hai góc dưới. */
function fernPath(x: number, y: number, s: number, flip: 1 | -1): string {
  return [[-40, 58], [-18, 70], [6, 74], [28, 64], [48, 50]]
    .map(([dx, len]) => `M${r1(x)} ${r1(y)}Q${r1(x + dx * s * 0.4 * flip)} ${r1(y - len * s * 0.7)} ${r1(x + dx * s * flip)} ${r1(y - len * s * 0.62)}`)
    .join("");
}
export const FERNS_BACK = fernPath(110, 1018, 1.9, 1) + fernPath(1488, 1020, 1.8, -1);
export const FERNS_FRONT = fernPath(32, 1012, 2.4, 1) + fernPath(1566, 1012, 2.4, -1);

/** Sao đêm, chia ba nhóm độ sáng (mỗi nhóm một path) thay vì 70 phần tử riêng. */
export const STARS_BY_BRIGHTNESS: readonly { d: string; opacity: number }[] = (() => {
  const rand = seededRandom(99);
  const buckets = ["", "", ""];
  for (let i = 0; i < 90; i++) {
    const x = rand() * BACKDROP_W;
    const y = rand() * 470;
    const r = 1 + rand() * 1.7;
    buckets[Math.floor(rand() * 3)] += circlePath(x, y, r);
  }
  return buckets.map((d, i) => ({ d, opacity: [0.35, 0.6, 0.9][i] }));
})();
