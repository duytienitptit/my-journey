/** Chạy migration — dev: `npm run db:migrate`. Production: gọi trong bước build/deploy. */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL chưa đặt — xem .env.local");
  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
  await client.end();
  console.log("Migrate xong.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
