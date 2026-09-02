# My Journey

App cá nhân, một người dùng duy nhất. Mô tả sản phẩm đầy đủ nằm trong [`SPEC.md`](SPEC.md);
luật làm việc của Claude trên dự án này nằm trong [`CLAUDE.md`](CLAUDE.md). Nguồn model 3D/âm
thanh (CC0) liệt kê ở [`public/CREDITS.md`](public/CREDITS.md).

## Chạy thử

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm thử

```bash
npm test        # unit test cho core/ (chạy một lần)
npm run test:watch
npm run lint
npx tsc --noEmit
```

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 · react-three-fiber +
drei (phòng 3D) · Vitest · Postgres + Drizzle (từ mốc 2) · deploy Vercel.

## Cấu trúc

```
core/         Logic game — hàm thuần, không đụng DB/React (SPEC.md §8)
components/   Giao diện: room/ (cảnh 3D), timer/ (đồng hồ pomodoro)
app/          Next.js App Router
test/         Unit test cho core/
public/       Model 3D + âm thanh CC0 (xem CREDITS.md)
```
