"use client";

import { useState } from "react";
import Link from "next/link";
import { getSettingsDataAction, type SettingsData } from "@/app/actions/settings";
import { CharacterSection } from "./CharacterSection";
import { DailyTasksSection } from "./DailyTasksSection";
import { DataSection } from "./DataSection";
import { HabitsSection } from "./HabitsSection";
import { LabelsSection } from "./LabelsSection";
import { PromptsSection } from "./PromptsSection";
import { SessionSection } from "./SessionSection";

/**
 * Cài đặt — SPEC.md §5.6, mốc 8a (chỉ phần chức năng — đánh bóng để sau, xem CLAUDE.md).
 * Mỗi khối tự ghi/đọc riêng qua app/actions/settings.ts rồi gọi `refresh()` để tải lại TOÀN BỘ
 * dữ liệu trang — đơn giản hơn tự đồng bộ state cục bộ của từng khối, và trang này không cần
 * mượt như đồng hồ pomodoro (không có gì đang chạy real-time ở đây).
 */
export function SettingsScreen({ initialData }: { initialData: SettingsData }) {
  const [data, setData] = useState(initialData);

  async function refresh() {
    setData(await getSettingsDataAction());
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-6 bg-background px-6 py-12">
      <Link href="/" className="text-sm font-medium text-foreground/50 hover:text-foreground/80">
        ← Today
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <CharacterSection characterLook={data.characterLook} characterLooks={data.characterLooks} onChanged={refresh} />
      <LabelsSection labels={data.labels} onChanged={refresh} />
      <HabitsSection habits={data.habits} onChanged={refresh} />
      <DailyTasksSection dailyTasks={data.dailyTasks} labels={data.labels} habits={data.habits} onChanged={refresh} />
      <SessionSection
        sessionMinutes={data.sessionMinutes}
        dailySessionGoal={data.dailySessionGoal}
        reminderHour={data.reminderHour}
        onChanged={refresh}
      />
      <PromptsSection prompts={data.prompts} onChanged={refresh} />
      <DataSection hideMoney={data.hideMoney} onChanged={refresh} />
    </main>
  );
}
