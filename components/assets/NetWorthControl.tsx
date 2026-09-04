"use client";

import { useState } from "react";
import { setHideMoneyAction, submitNetWorthAction } from "@/app/actions/assets";

type Props = {
  netWorth: { stocksVnd: number; goldVnd: number; totalVnd: number } | null;
  hideMoney: boolean;
  /** Gọi sau khi nhập/ẩn-hiện xong — DailyScreen truyền refreshStats() xuống, để chương/nhà đổi ngay. */
  onChanged: () => void;
};

function formatVnd(n: number): string {
  return `${n.toLocaleString("en-US")} ₫`;
}

/**
 * Nhập tài sản + ẩn/hiện số — SPEC.md §4.9, mốc 5. "Đừng bao giờ nhắc, đừng bao giờ ép tôi
 * nhập" → một nút nhỏ kín đáo ở góc, không phải biểu mẫu chắn giữa màn hình. Chưa có màn "Nhìn
 * lại tuần" (§5.2, mốc 6) hay Cài đặt (§5.6, mốc 8) để đặt ô nhập chính thức, nên sống tạm ở
 * đây — góc màn chính, cùng cụm với chuỗi/ghi bù (SPEC.md §5.1).
 */
export function NetWorthControl({ netWorth, hideMoney, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [stocks, setStocks] = useState("");
  const [gold, setGold] = useState("");
  const [pending, setPending] = useState(false);

  async function toggleHide() {
    await setHideMoneyAction(!hideMoney);
    onChanged();
  }

  async function submit() {
    const stocksVnd = Math.max(0, Number(stocks) || 0);
    const goldVnd = Math.max(0, Number(gold) || 0);
    if (stocksVnd === 0 && goldVnd === 0) return;
    setPending(true);
    try {
      await submitNetWorthAction(stocksVnd, goldVnd);
      setStocks("");
      setGold("");
      setEditing(false);
      onChanged();
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-2 shadow-md backdrop-blur">
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-foreground/70 hover:text-foreground"
          title="Update net worth"
        >
          {netWorth === null ? "Add net worth" : hideMoney ? "•••••• ₫" : formatVnd(netWorth.totalVnd)}
        </button>
        {netWorth !== null && (
          <button
            onClick={toggleHide}
            className="px-1 text-foreground/40 hover:text-foreground/70"
            title={hideMoney ? "Show" : "Hide"}
          >
            {hideMoney ? "👁" : "🙈"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-56 flex-col gap-2 rounded-2xl bg-surface/95 p-3 shadow-lg backdrop-blur">
      <label className="flex items-center justify-between gap-2 text-xs text-foreground/60">
        Stocks (₫)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={stocks}
          onChange={(e) => setStocks(e.target.value)}
          className="w-28 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-right text-sm"
          placeholder="0"
          autoFocus
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-xs text-foreground/60">
        Gold (₫)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={gold}
          onChange={(e) => setGold(e.target.value)}
          className="w-28 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-right text-sm"
          placeholder="0"
        />
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-foreground/50 hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background transition-transform active:scale-95 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
