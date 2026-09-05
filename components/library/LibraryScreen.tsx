import Link from "next/link";
import type { ChapterCardView } from "@/app/actions/library";
import { ChapterCard } from "./ChapterCard";

/**
 * Thư viện hành trình — SPEC.md §5.4, mốc 7. "Đi qua hành lang đó là tôi thấy mình của những
 * năm trước" — chương mới nhất trên đầu, cuộn xuống là lùi dần về quá khứ.
 */
export function LibraryScreen({ cards }: { cards: readonly ChapterCardView[] }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-6 bg-background px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-foreground/50 hover:text-foreground/80">
          ← Today
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Journey</h1>
        <p className="text-sm text-foreground/50">
          {cards.length} chapter{cards.length === 1 ? "" : "s"} so far
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <ChapterCard key={card.chapter} card={card} />
        ))}
      </div>
    </main>
  );
}
