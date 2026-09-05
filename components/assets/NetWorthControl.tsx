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
 * Tài sản — SPEC.md §4.9, [SỬA — 2026-09-05]: LUÔN HIỆN, đặt nổi bật giữa màn hình chính, không
 * còn mặc định làm mờ như bản đầu mốc 5. Ngoại lệ CÓ CHỦ Ý với nguyên tắc 4 (§2, "thống kê không
 * đập vào mặt") — chỉ một con số này, vì nó là trục quyết định kích thước nhà (§1), chủ dự án
 * muốn thấy ngay mình nghèo hay giàu mỗi lần mở app. Vẫn giữ nút ẩn cho khoảnh khắc không muốn
 * nhìn, chỉ đổi MẶC ĐỊNH. "Đừng bao giờ nhắc, đừng bao giờ ép tôi nhập" (§4.9) vẫn giữ nguyên —
 * chưa nhập gì thì chỉ là một lời mời nhẹ nhàng, không phải cảnh báo.
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

  if (editing) {
    return (
      <div className="flex w-64 flex-col gap-2.5 rounded-3xl bg-surface/95 p-4 shadow-lg backdrop-blur">
        <label className="flex items-center justify-between gap-2 text-xs text-foreground/60">
          Stocks (₫)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={stocks}
            onChange={(e) => setStocks(e.target.value)}
            className="w-32 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-right text-sm"
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
            className="w-32 rounded-lg border border-foreground/10 bg-background px-2 py-1 text-right text-sm"
            placeholder="0"
          />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setEditing(false)} className="text-xs text-foreground/50 hover:text-foreground">
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

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => setEditing(true)}
        title="Update net worth"
        className="rounded-full bg-surface/80 px-4 py-2 shadow-md backdrop-blur transition-transform hover:scale-[1.02] active:scale-95"
      >
        {netWorth === null ? (
          <span className="text-base font-medium text-foreground/50">Add net worth</span>
        ) : hideMoney ? (
          <span className="text-xl font-bold tracking-tight text-foreground/80 sm:text-2xl">•••••• ₫</span>
        ) : (
          <span className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {formatVnd(netWorth.totalVnd)}
          </span>
        )}
      </button>
      {netWorth !== null && (
        <button
          onClick={toggleHide}
          className="text-xs text-foreground/40 hover:text-foreground/70"
          title={hideMoney ? "Show" : "Hide"}
        >
          {hideMoney ? "👁 show" : "🙈 hide"}
        </button>
      )}
    </div>
  );
}
