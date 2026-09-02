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

const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
