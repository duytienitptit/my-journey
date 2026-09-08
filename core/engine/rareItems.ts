/**
 * Vật phẩm hiếm — SPEC.md §5.3. "Ngẫu nhiên, xác suất thấp... tôi không mua được, không cày
 * được, chỉ đến." §7 nói rõ bảng `rare_items` PHẢI LƯU (không tính lại mỗi lần đọc, vì
 * `Math.random()` thật sẽ ra kết quả khác mỗi lần tải trang).
 *
 * File này KHÔNG dùng `Math.random()` — "trúng hay không" và "trúng món gì" đều là hàm THUẦN
 * của (triggerId, salt), qua một hàm băm chuỗi ổn định. Lý do: chỉ cần quyết định ĐÚNG MỘT lần
 * cho mỗi trigger rồi ghi xuống DB (db/queries.ts#rollRareItemsIfEligible) — nhưng bản thân
 * PHÉP TÍNH "có trúng không" vẫn nên là hàm test được, không phải side-effect ẩn trong code ghi
 * DB. Trùng tinh thần §8.1 dù đây không phải chỗ "không lưu XP": lưu KẾT QUẢ trúng, không lưu
 * paths trượt (trượt thì hàm thuần luôn trả lại `false`, không cần nhớ "đã thử rồi").
 */

import { RARE_ITEM_CHANCE, RARE_ITEM_DAY_MILESTONE, RARE_ITEM_KEYS } from "../balance";
import { addDays, enumerateDayKeys, mondayOf } from "../day";
import type { DayKey } from "../types";
import { knownTetYears, tetEveOf } from "./seasons";

/**
 * Băm chuỗi → số nguyên không âm. KHÔNG phải mật mã học — chỉ cần "trông ngẫu nhiên" và luôn ra
 * cùng kết quả cho cùng đầu vào. FNV-1a + khối trộn cuối kiểu Murmur3 (fmix32) — **bắt buộc có
 * khối trộn cuối**: thử djb2 trần trước, phát hiện qua chính unit test bên dưới rằng hai chuỗi
 * chỉ khác ký tự CUỐI (vd "trigger_0" so với "trigger_1", hay thực tế hơn là "tet_eve_2026" so
 * với "tet_eve_2027") ra hash gần như giống hệt nhau (sai khác ở bậc 10^-9) — vì phần đuôi vòng
 * lặp giống nhau tuyệt đối, chỉ cộng thêm đúng 1 đơn vị. fmix32 khuếch tán đều bất kể vị trí
 * ký tự đổi, output không còn tương quan giữa các trigger liền kề.
 */
// Hằng số thuật toán chuẩn (FNV-1a + khối trộn cuối Murmur3 fmix32) — không phải số cân bằng
// game, không thuộc balance.ts. Đặt tên đầy đủ để không phải viết số thô giữa logic (§8.2).
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const FMIX32_MULTIPLIER_1 = 0x85ebca6b;
const FMIX32_MULTIPLIER_2 = 0xc2b2ae35;
const FMIX32_SHIFT_1 = 16;
const FMIX32_SHIFT_2 = 13;
const UINT32_MAX = 0xffffffff;

function stableHash(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  hash ^= hash >>> FMIX32_SHIFT_1;
  hash = Math.imul(hash, FMIX32_MULTIPLIER_1);
  hash ^= hash >>> FMIX32_SHIFT_2;
  hash = Math.imul(hash, FMIX32_MULTIPLIER_2);
  hash ^= hash >>> FMIX32_SHIFT_1;
  return hash >>> 0; // ép về không âm
}

/** Số thực ổn định trong [0, 1) suy ra từ (triggerId, salt) — thay cho `Math.random()`. */
function pseudoRandom(triggerId: string, salt: string): number {
  return stableHash(`${salt}:${triggerId}`) / UINT32_MAX;
}

/** Trigger này có "trúng" vật phẩm hiếm không — thuần, ổn định. `salt` nên là một giá trị đổi
 *  theo từng lần seed lại DB (vd `profileStartedDayKey`) để các lượt cài đặt khác nhau không
 *  luôn trúng/trượt giống hệt nhau ở cùng trigger. */
export function rareItemHits(triggerId: string, salt: string): boolean {
  return pseudoRandom(triggerId, salt) < RARE_ITEM_CHANCE;
}

/** Vật phẩm nào được chọn nếu trigger này trúng — thuần, ổn định, không phụ thuộc DB. */
export function pickRareItemKey(triggerId: string, salt: string): string {
  const idx = stableHash(`pick:${salt}:${triggerId}`) % RARE_ITEM_KEYS.length;
  return RARE_ITEM_KEYS[idx];
}

export type RareItemTrigger = {
  /** Định danh ổn định — dùng làm khoá chống ghi trùng (một trigger chỉ roll đúng một lần). */
  triggerId: string;
};

/**
 * Mọi "khoảnh khắc đáng nhớ" (SPEC.md §5.3) đã XẢY RA tính tới hôm nay — KHÔNG lọc theo đã roll
 * hay chưa (việc đó thuộc tầng gọi, so với các dòng đã có trong `rare_items`). Ba loại, đúng ba
 * ví dụ trong SPEC: ngày thứ 100 · đêm giao thừa (mọi năm đã qua) · mọi tuần trọn vẹn đã hoàn
 * toàn là quá khứ (tái dùng ĐÚNG định nghĩa "tuần trọn vẹn" ở timeline.ts cho thưởng +200 XP —
 * cả 7 ngày đều "đạt", không đòi thêm điều kiện đã viết đúc kết tuần như thưởng XP đó).
 */
export function currentRareItemTriggers(input: {
  profileStartedDayKey: DayKey;
  today: DayKey;
  /** Một điểm mỗi ngày kể từ lúc bắt đầu — lấy thẳng từ `TimelineResult.dailySeries`. */
  dailySeries: readonly { dayKey: DayKey; dayAchieved: boolean }[];
}): RareItemTrigger[] {
  const triggers: RareItemTrigger[] = [];

  // 1) Ngày thứ N (đếm bắt đầu = ngày 1).
  const daysSinceStart = enumerateDayKeys(input.profileStartedDayKey, input.today).length;
  if (daysSinceStart >= RARE_ITEM_DAY_MILESTONE) {
    triggers.push({ triggerId: "day_milestone" });
  }

  // 2) Đêm giao thừa — mọi năm đã có trong bảng Tết VÀ đêm đó đã qua (nằm trong lịch sử app).
  for (const year of knownTetYears()) {
    const eve = tetEveOf(year);
    if (eve && eve >= input.profileStartedDayKey && eve <= input.today) {
      triggers.push({ triggerId: `tet_eve_${year}` });
    }
  }

  // 3) Mọi tuần TRỌN VẸN đã hoàn toàn là quá khứ.
  const dayAchievedByDay = new Map(input.dailySeries.map((p) => [p.dayKey, p.dayAchieved]));
  const weekStarts = new Set(input.dailySeries.map((p) => mondayOf(p.dayKey)));
  for (const weekStart of weekStarts) {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekFullyPast = weekDays.every((d) => d < input.today);
    if (!weekFullyPast) continue;
    const allAchieved = weekDays.every((d) => dayAchievedByDay.get(d) === true);
    if (allAchieved) {
      triggers.push({ triggerId: `perfect_week_${weekStart}` });
    }
  }

  return triggers;
}
