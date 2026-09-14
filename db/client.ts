import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL chưa đặt — xem .env.local (dev) hoặc biến môi trường Vercel (prod).");
}

// Một kết nối dùng chung cho cả tiến trình Next.js — tránh mở connection pool mới mỗi request
// trong dev (Next.js hot-reload có thể tạo lại module nhiều lần; globalThis giữ nó sống sót
// qua các lần reload, mẫu hình chuẩn của Drizzle + Next.js).
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL, {
    // DATABASE_URL production trỏ qua PgBouncer của Neon (hostname "-pooler", transaction mode —
    // xem SPEC.md §8.5). PREPARE cấp SQL không sống sót qua transaction pooling (mỗi transaction
    // có thể được giao cho một kết nối backend khác nhau) — không tắt cái này thì MỖI câu lệnh
    // postgres.js gửi đều thử PREPARE trước, PgBouncer transaction-mode xử lý kém việc đó, cộng
    // dồn thành cảm giác "chậm mỗi lần bấm" cho toàn bộ Server Action nào cũng chạm DB. An toàn
    // với Postgres local (dev) — chỉ là không dùng prepared statement, không có gì hỏng.
    prepare: false,
    // Serverless: mỗi tiến trình "nguội" là một instance MỚI, có thể chạy song song nhiều cái —
    // pool lớn ở đây nhân lên thành quá tải kết nối thật phía sau PgBouncer (vốn đã gộp lại rồi).
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
