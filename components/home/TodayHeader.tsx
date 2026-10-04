import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function TodayHeader() {
  return <header className="today-header">
    <Link href="/" className="journey-brand"><Icon name="leaf" size={31}/><span>My Journey</span></Link>
    <nav aria-label="Main navigation">
      <Link href="/" aria-current="page">Today</Link>
      <Link href="/week">This week</Link>
      <Link href="/stats">Stats</Link>
      <Link href="/library">Journey</Link>
      <Link href="/archive">Archive</Link>
    </nav>
    <Link href="/settings" className="settings-link" aria-label="Settings"><Icon name="settings"/></Link>
  </header>;
}
