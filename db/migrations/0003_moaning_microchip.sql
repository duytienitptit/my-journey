CREATE UNIQUE INDEX "sessions_one_running" ON "sessions" USING btree ((true)) WHERE "sessions"."status" = 'running';
--> statement-breakpoint
UPDATE "habits" SET "name" = 'Bed before 22:30' WHERE "slug" = 'sleep-enough' AND "name" = 'Sleep enough';
