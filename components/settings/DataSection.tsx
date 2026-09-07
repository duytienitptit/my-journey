"use client";

import { useRef, useState } from "react";
import { setHideMoneyAction } from "@/app/actions/assets";
import { importDataAction } from "@/app/actions/settings";
import { Card, CardHint, CardTitle } from "./Card";

type Props = {
  hideMoney: boolean;
  onChanged: () => void;
};

/**
 * Ẩn/hiện tài sản + xuất/nhập dữ liệu — SPEC.md §5.5/§5.6. Xuất dùng lại route `/api/export`
 * (mốc 2) thay vì định nghĩa lại (xem app/actions/settings.ts). Nhập THAY THẾ TOÀN BỘ dữ liệu
 * (importAllData — restore từ bản sao lưu, không gộp), nên chặn bằng một bước xác nhận rõ ràng
 * trước khi chạm DB — đây là hành động phá huỷ nặng nhất trong toàn app.
 */
export function DataSection({ hideMoney, onChanged }: Props) {
  const [hide, setHide] = useState(hideMoney);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedOk, setImportedOk] = useState(false);

  async function toggleHide() {
    const next = !hide;
    setHide(next);
    await setHideMoneyAction(next);
    onChanged();
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImportError(null);
    setImportedOk(false);
    setPendingFile(file);
  }

  async function confirmImport() {
    if (!pendingFile) return;
    setImporting(true);
    setImportError(null);
    try {
      const text = await pendingFile.text();
      const result = await importDataAction(text);
      if (result.ok) {
        setImportedOk(true);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Nhập thay đổi MỌI bảng — tải lại trang là cách chắc chắn nhất để mọi màn khác (đồng
        // hồ, phòng, thống kê) đọc lại đúng dữ liệu mới thay vì tự đồng bộ từng mảnh state.
        window.setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportError(result.error);
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardTitle>Data</CardTitle>

      <label className="flex items-center justify-between gap-2 text-sm text-foreground/70">
        Hide net worth by default
        <input type="checkbox" checked={hide} onChange={toggleHide} className="h-4 w-4 accent-foreground" />
      </label>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-sm text-foreground/70">Export everything as JSON</span>
        <a
          href="/api/export"
          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition-transform active:scale-95"
        >
          Export
        </a>
      </div>

      <div className="flex flex-col gap-2 border-t border-foreground/10 pt-3">
        <span className="text-sm text-foreground/70">Import from a backup file</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handlePickFile}
          className="text-xs text-foreground/60 file:mr-2 file:rounded-full file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
        />
        {pendingFile && !importedOk && (
          <div className="flex flex-col gap-2 rounded-2xl bg-red-500/10 p-3">
            <p className="text-xs font-medium text-red-600">
              This replaces EVERYTHING currently in the app with &quot;{pendingFile.name}&quot;. Every session,
              journal entry, and setting you have now will be gone. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-foreground/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                {importing ? "Replacing…" : "Yes, replace everything"}
              </button>
            </div>
          </div>
        )}
        {importError && <p className="text-xs font-medium text-red-600">{importError}</p>}
        {importedOk && <p className="text-xs font-medium text-foreground/60">Imported ✓ — reloading…</p>}
      </div>

      <CardHint>
        Export doesn&apos;t just back up — it&apos;s also the only escape hatch if something needs fixing by hand.
      </CardHint>
    </Card>
  );
}
