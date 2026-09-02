import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { TimeTravelWidget } from "@/components/dev/TimeTravelWidget";
import "./globals.css";

// Chữ tròn dễ chịu — SPEC.md §5.7. Nunito thay cho font mặc định của create-next-app.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "My Journey",
  description: "A quiet room that grows the way I actually live.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        {/* Công cụ tua thời gian (§8.3) — chỉ dev, route phía sau cũng tự 404 ở production. */}
        {process.env.NODE_ENV !== "production" && <TimeTravelWidget />}
      </body>
    </html>
  );
}
