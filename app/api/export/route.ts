import { NextResponse } from "next/server";
import { dayKeyOf } from "@/core/day";
import { now } from "@/core/clock";
import { exportAllData } from "@/db/queries";

/** Xuất toàn bộ dữ liệu — thủ công, SPEC.md §5.5. Không tự động, không nhắc, chỉ chạy khi bấm. */
export async function GET() {
  const data = await exportAllData();
  const filename = `my-journey-export-${dayKeyOf(now())}.json`;
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
