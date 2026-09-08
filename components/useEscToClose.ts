"use client";

import { useEffect } from "react";

/**
 * Phím Esc đóng một popup/form đang mở — phím tắt chung, mốc 8b (đánh bóng). Dùng ở
 * `BackfillButton.tsx` và `NetWorthControl.tsx`; chỉ thật sự gắn listener khi `isOpen`, không
 * có gì lắng nghe toàn cục lúc không cần.
 */
export function useEscToClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);
}
