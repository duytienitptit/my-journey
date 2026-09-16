import type { NextConfig } from "next";

// Âm thanh trong `public/` — mặc định Next.js gửi `max-age=0` cho mọi file ở đây, nên mỗi lần mở
// app trình duyệt lại hỏi server từng file một. Cho giữ một ngày, quá hạn thì dùng bản cũ ngay rồi
// lặng lẽ hỏi lại phía sau. HỆ QUẢ: đổi NỘI DUNG một file mà giữ nguyên TÊN thì trình duyệt có thể
// còn thấy bản cũ tới một ngày — muốn thay thì đặt tên mới, đừng ghi đè.
// [GỠ 3D — 2026-09-16] Trước đây rule này còn phủ `/models/*` (12 file .glb của phòng 3D, lý do
// gốc khiến nó ra đời — xem git history nếu cần dựng lại). Chỉ bật ở production.
const PUBLIC_ASSET_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return ["/sounds/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: PUBLIC_ASSET_CACHE }],
    }));
  },
};

export default nextConfig;
