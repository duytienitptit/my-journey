import { NextResponse } from "next/server";
import { now, setClockOverride } from "@/core/clock";

/**
 * Công cụ tua thời gian — SPEC.md §8.3: "Tôi cần công cụ tua thời gian để test — mốc ngày 4h
 * sáng, chuỗi 7 ngày, phiên bỏ quên đều không thể test thủ công nếu phải đợi thật."
 *
 * CHỈ chạy khi dev — route này đổi đồng hồ CHO CẢ TIẾN TRÌNH SERVER (module-level ở
 * core/clock.ts), và app công khai không đăng nhập (§8.5: "ai có link cũng sửa được"). Bật ở
 * production nghĩa là bất kỳ ai cũng chỉnh được giờ hệ thống của mọi người — 404 chặn hẳn,
 * không phải ẩn UI rồi hy vọng không ai gọi thẳng API.
 */
function guardDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export async function GET() {
  const blocked = guardDevOnly();
  if (blocked) return blocked;
  return NextResponse.json({ nowMs: now(), nowIso: new Date(now()).toISOString() });
}

export async function POST(request: Request) {
  const blocked = guardDevOnly();
  if (blocked) return blocked;
  const body = (await request.json()) as { ms?: number };
  if (typeof body.ms !== "number" || !Number.isFinite(body.ms)) {
    return NextResponse.json({ error: "Thiếu 'ms' (số) trong body." }, { status: 400 });
  }
  setClockOverride(body.ms);
  return NextResponse.json({ nowMs: now(), nowIso: new Date(now()).toISOString() });
}

export async function DELETE() {
  const blocked = guardDevOnly();
  if (blocked) return blocked;
  setClockOverride(null);
  return NextResponse.json({ nowMs: now(), nowIso: new Date(now()).toISOString() });
}
