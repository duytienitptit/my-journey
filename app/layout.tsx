import type { Metadata } from "next";
import localFont from "next/font/local";
import { GrovePreviewProvider } from "@/components/dev/GrovePreviewContext";
import { GrovePreviewWidget } from "@/components/dev/GrovePreviewWidget";
import { TimeTravelWidget } from "@/components/dev/TimeTravelWidget";
import { ForestBackdrop } from "@/components/forest/ForestBackdrop";
import { NightModeSync } from "@/components/theme/NightModeSync";
import "./globals.css";

// Chữ tròn dễ chịu — SPEC.md §5.7. Nunito thay cho font mặc định của create-next-app.
const nunito = localFont({
  src: "../public/fonts/Nunito-Variable.ttf",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Journey",
  description: "A quiet room that grows the way I actually live.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* Khu rừng phía sau MỌI trang (2026-09-17) — mount ở layout để chuyển trang không vẽ lại.
            Xếp lớp KHÔNG dùng z-index âm: khu rừng là `fixed` đứng TRƯỚC trong DOM, nội dung trang
            bọc trong một khối `relative` đứng SAU — hai phần tử định vị cùng z auto thì vẽ theo
            thứ tự DOM, nên nội dung luôn nằm trên. Lớp z âm chỉ lộ ra nhờ nền <body> "chảy" lên
            canvas; mai kia ai thêm màu nền cho <html> là nền <body> vẽ ĐÈ lên khu rừng, mất âm
            thầm — cách xếp theo DOM không phụ thuộc chuyện đó. */}
        <ForestBackdrop />
        {/* Bọc TOÀN BỘ phần còn lại (kể cả hai widget dev bên dưới) trong MỘT Provider — widget
            và DailyScreen (con sâu bên trong `children`) phải cùng nằm trong cây context mới đọc/
            ghi chung một state được. Provider "không làm gì" khi không ai gọi `setOverride`
            (mặc định null, hành vi giống hệt trước khi có file này) nên mount không điều kiện là
            an toàn — chỉ riêng Ô ĐIỀU KHIỂN mới cần gate theo NODE_ENV, xem GrovePreviewContext.tsx. */}
        <GrovePreviewProvider>
          <div className="relative">{children}</div>
          {/* Chế độ tối tự động theo giờ thật + nhắc nghi thức tối (SPEC.md §5.7/§6, mốc 8b) —
              sống ở MỌI trang, không chỉ màn chính, vì cả hai đều phụ thuộc giờ thật chứ không
              phụ thuộc đang xem trang nào. */}
          <NightModeSync />
          {/* Công cụ tua thời gian (§8.3) — chỉ dev, route phía sau cũng tự 404 ở production. */}
          {process.env.NODE_ENV !== "production" && <TimeTravelWidget />}
          {/* Xem trước khu vườn lớn lên (2026-09-17) — chỉ dev, chủ dự án tự hỏi để xem hình dạng
              cây ở nhiều cấp mà không cần chờ dùng thật nhiều tháng. Không seed DB — xem
              GrovePreviewContext.tsx. */}
          {process.env.NODE_ENV !== "production" && <GrovePreviewWidget />}
        </GrovePreviewProvider>
      </body>
    </html>
  );
}
