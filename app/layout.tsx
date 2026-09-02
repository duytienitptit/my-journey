import type { Metadata } from "next";
import { Nunito } from "next/font/google";
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
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
