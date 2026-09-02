import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js tự nạp .env.local; drizzle-kit chạy ngoài Next.js nên phải nạp tay ở đây.
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL chưa đặt — xem .env.local");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
