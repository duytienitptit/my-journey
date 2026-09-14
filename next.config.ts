import type { NextConfig } from "next";

// Model 3D + âm thanh trong `public/` — mặc định Next.js gửi `max-age=0` cho mọi file ở đây, nên
// MỖI lần mở app trình duyệt lại hỏi server từng file .glb một (đo trên production 2026-09-14:
// ~12 lượt, mỗi lượt ~140ms mạng, vài lượt nối đuôi nhau vì model tải theo kiểu thác nước) trước
// khi phòng hiện ra. Cho giữ một ngày, quá hạn thì dùng bản cũ ngay rồi lặng lẽ hỏi lại phía sau.
// HỆ QUẢ: đổi NỘI DUNG một model mà giữ nguyên TÊN file thì trình duyệt có thể còn thấy bản cũ tới
// một ngày — muốn thay model thì đặt tên file mới (như `room-v2/` đã làm), đừng ghi đè file cũ.
// Chỉ bật ở production: lúc dev hay thay model và soi lại ngay, không muốn dính bản cũ.
const PUBLIC_ASSET_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return ["/models/:path*", "/sounds/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: PUBLIC_ASSET_CACHE }],
    }));
  },
};

export default nextConfig;
