"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { StatKey } from "@/core/types";

/**
 * Xem trước khu vườn lớn lên — CHỈ DEV, dựng theo yêu cầu "cho fake data để xem cây lúc lớn lên".
 *
 * Cố Ý KHÔNG bơm dữ liệu giả vào DB dev (kể cả DB tạm riêng) — chủ dự án chỉ cần XEM hình dạng
 * cây ở nhiều cấp độ, không cần các con số đó thật sự "xảy ra" trong lịch sử dùng app. Việc này
 * thuần là ghi đè PROP phía client, y hệt tinh thần các lần QA ép `levelByStat` tạm thời trong
 * `DailyScreen.tsx` trước đây — chỉ khác là làm thành công cụ bấm được thay vì sửa code mỗi lần.
 * Xem [[feedback-shared-dev-db-caution]].
 *
 * Provider mount KHÔNG điều kiện ở `app/layout.tsx` (state mặc định `null` = dùng dữ liệu thật,
 * hành vi giống hệt trước khi có file này) — chỉ riêng Ô ĐIỀU KHIỂN (`GrovePreviewWidget.tsx`)
 * mới cần gate theo `NODE_ENV`, đúng cách `TimeTravelWidget` đã làm.
 */

export type GrovePreviewOverride = {
  levelByStat: Record<StatKey, number>;
  streak: number;
  danger: boolean;
  neglectByStat: Record<StatKey, boolean>;
  theme?: "light" | "dark";
};

type ContextValue = {
  override: GrovePreviewOverride | null;
  setOverride: (next: GrovePreviewOverride | null) => void;
};

const GrovePreviewContext = createContext<ContextValue | null>(null);

export function GrovePreviewProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<GrovePreviewOverride | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);
  return <GrovePreviewContext.Provider value={value}>{children}</GrovePreviewContext.Provider>;
}

/** An toàn cả khi thiếu Provider (không nên xảy ra vì layout luôn mount) — trả về "không ghi đè"
 *  thay vì throw, để một lần lỡ quên bọc Provider không sập cả trang. */
export function useGrovePreview(): ContextValue {
  return useContext(GrovePreviewContext) ?? { override: null, setOverride: () => {} };
}
