/**
 * Kích thước + khung nhìn camera cho từng chương (mốc 5, SPEC.md §4.9, §5.3). `interiorWidth` /
 * `interiorDepth` = phần có tường (đơn vị = ô sàn 1×1). `outdoorWidth` = dải sân/ban công mở
 * thêm về phía +X (cạnh vốn đã không có tường, §5.1 "kiểu diorama, không phải hộp kín") — 0 nếu
 * chương đó chưa có sân/ban công. Tường sau chỉ trải dài đúng `interiorWidth`, KHÔNG trải hết
 * `totalWidth` — đoạn sân thừa ra không có tường, đọc là "ngoài trời".
 */
export type ChapterFootprint = {
  interiorWidth: number;
  interiorDepth: number;
  outdoorWidth: number;
};

export function footprintForChapter(chapter: number): ChapterFootprint {
  if (chapter <= 2) return { interiorWidth: 3, interiorDepth: 3, outdoorWidth: 0 };
  if (chapter <= 4) return { interiorWidth: 4, interiorDepth: 4, outdoorWidth: 0 };
  if (chapter === 5) return { interiorWidth: 4, interiorDepth: 4, outdoorWidth: 1.5 };
  if (chapter === 6) return { interiorWidth: 5, interiorDepth: 4, outdoorWidth: 0 };
  if (chapter <= 8) return { interiorWidth: 6, interiorDepth: 4, outdoorWidth: 0 };
  if (chapter === 9) return { interiorWidth: 7, interiorDepth: 4, outdoorWidth: 0 };
  // outdoorWidth ĐỦ RỘNG (không phải 2/3/4 như bản đầu) — bắt gặp lúc soi mốc 5: sân hẹp quá
  // khiến cụm cây/bụi trồng gần mép trong lại trông như đè lên nhân vật/góc bàn học kế bên
  // (corner=[interiorWidth,-interiorDepth]) do phối cảnh camera lùi xa dần theo phòng lớn.
  if (chapter === 10) return { interiorWidth: 7, interiorDepth: 4, outdoorWidth: 4 };
  if (chapter === 11) return { interiorWidth: 7, interiorDepth: 4, outdoorWidth: 5 };
  return { interiorWidth: 7, interiorDepth: 4, outdoorWidth: 6 }; // Chương 12
}

export function totalWidthOf(fp: ChapterFootprint): number {
  return fp.interiorWidth + fp.outdoorWidth;
}

const BASE_MAX_DIM = 3; // Chương 1 — kích thước camera hiện tại đã tinh chỉnh cho phòng 3×3.
const BASE_TARGET_OFFSET: [number, number, number] = [3.9, 3.15, 6.9]; // 5.4-1.5, 3.7-0.55, 5.4-(-1.5)
const BASE_MIN_DISTANCE = 4;
const BASE_MAX_DISTANCE = 9;

export type CameraFraming = {
  target: [number, number, number];
  position: [number, number, number];
  minDistance: number;
  maxDistance: number;
  /** Sương mù (SceneAtmosphere) PHẢI co giãn cùng hệ số — bắt gặp lúc soi mốc 5: phòng lớn dần
   *  mà [near,far] đứng yên ở số của phòng 3×3 gốc thì camera lùi ra xa hơn lại rơi đúng vào
   *  dải sương mù cố định đó, cả phòng mờ dần đi trông như lỗi render dù không phải. */
  fogNear: number;
  fogFar: number;
};

const BASE_FOG_NEAR = 9;
const BASE_FOG_FAR = 19;

/**
 * Camera co giãn theo kích thước phòng — giữ đúng góc nhìn/tỉ lệ đã tinh chỉnh ở Chương 1, chỉ
 * nhân thêm hệ số theo cạnh lớn nhất của phòng hiện tại so với phòng 3×3 gốc, để phòng lớn hơn
 * không bị tràn khung hình và phòng nhỏ không bị lọt thỏm.
 */
export function cameraFramingForFootprint(fp: ChapterFootprint): CameraFraming {
  const maxDim = Math.max(totalWidthOf(fp), fp.interiorDepth);
  const scale = maxDim / BASE_MAX_DIM;
  const target: [number, number, number] = [totalWidthOf(fp) / 2, 0.55, -fp.interiorDepth / 2];
  const position: [number, number, number] = [
    target[0] + BASE_TARGET_OFFSET[0] * scale,
    target[1] + BASE_TARGET_OFFSET[1] * scale,
    target[2] + BASE_TARGET_OFFSET[2] * scale,
  ];
  return {
    target,
    position,
    minDistance: BASE_MIN_DISTANCE * scale,
    maxDistance: BASE_MAX_DISTANCE * scale,
    fogNear: BASE_FOG_NEAR * scale,
    fogFar: BASE_FOG_FAR * scale,
  };
}
