"use client";

import { useState } from "react";
import { setCharacterLookAction } from "@/app/actions/settings";
import { Card, CardTitle } from "./Card";

function formatLookLabel(key: string): string {
  return key
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

type Props = {
  characterLook: string;
  characterLooks: readonly string[];
  onChanged: () => void;
};

/**
 * Nhân vật — SPEC.md §5.6, mốc 8. 12 hình dáng có sẵn (pack không hỗ trợ trộn tóc/da/trang
 * phục riêng — xem public/CREDITS.md). Dùng CHỮ thay cho hình xem trước, cùng lý do đã áp dụng
 * ở thư viện hành trình (mốc 7): dựng 12 cảnh 3D thu nhỏ chỉ tốn công mà không thêm thông tin
 * gì — mọi giai đoạn hiện tại dùng chung một model đặt sẵn cho từng hình dáng.
 */
export function CharacterSection({ characterLook, characterLooks, onChanged }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  async function pick(key: string) {
    if (key === characterLook || pending) return;
    setPending(key);
    try {
      await setCharacterLookAction(key);
      onChanged();
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardTitle>Character</CardTitle>
      <div className="grid grid-cols-3 gap-2">
        {characterLooks.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => pick(key)}
            disabled={pending !== null}
            className={`rounded-2xl px-2 py-3 text-xs font-medium transition-colors disabled:opacity-60 ${
              key === characterLook
                ? "bg-foreground text-background"
                : "bg-surface-muted text-foreground/60 hover:text-foreground"
            }`}
          >
            {pending === key ? "…" : formatLookLabel(key)}
          </button>
        ))}
      </div>
    </Card>
  );
}
