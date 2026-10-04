# My Journey

Ứng dụng quản lý bản thân cho một người dùng. Luật sản phẩm: [SPEC.md](SPEC.md).
Review và tình trạng sửa lỗi: [REVIEW-2026-09-30.md](REVIEW-2026-09-30.md).
Thiết kế và ảnh giao diện: [docs/design/README.md](docs/design/README.md).
Nguồn hình ảnh, âm thanh và font: [public/CREDITS.md](public/CREDITS.md).

## Chạy local

Cài Node.js và PostgreSQL, tạo database riêng, đặt `DATABASE_URL` trong `.env.local`.
Không dùng URL production để chạy thử hoặc seed.

```bash
npm install
npm run db:migrate
npm run db:seed   # chỉ cho database mới, chưa có dữ liệu sử dụng
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

```bash
npm run build    # webpack; font được đóng gói local, không tải Google Fonts lúc build
npm start
```

## Kiểm thử

```bash
npm test         # logic và component; bỏ qua test DB nếu không có TEST_DATABASE_URL
npm run lint
npx tsc --noEmit
```

Kiểm thử tích hợp có ghi/xóa dữ liệu: chỉ dùng database local riêng tên
`myjourney_review_<date>`. Suite từ chối các hostname và tên DB khác, lưu/khôi phục
snapshot baseline sau khi chạy. Đừng đặt dữ liệu cá nhân trong database này.

```bash
createdb myjourney_review_20260930
DATABASE_URL=postgresql://localhost/myjourney_review_20260930 npm run db:migrate
DATABASE_URL=postgresql://localhost/myjourney_review_20260930 npm run db:seed
TEST_DATABASE_URL=postgresql://localhost/myjourney_review_20260930 npx vitest run test/integration/database.test.ts
```

## Stack và cấu trúc

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS v4 · Three.js forest (SVG fallback) ·
Postgres + Drizzle · Vitest + Testing Library. Dev dùng Turbopack; build dùng webpack.

- `core/`: logic thuần, không phụ thuộc React/DB.
- `components/`: dashboard, forest, timer, evening và các màn phụ.
- `app/`: routes, Server Actions và API.
- `db/`: schema, migrations và queries.
- `lib/`: kiểm tra backup.
- `test/`: logic, component và tích hợp Postgres.
- `public/`: âm thanh, font và giấy phép.
