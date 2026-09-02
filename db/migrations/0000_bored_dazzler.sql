CREATE TYPE "public"."daily_task_ref_type" AS ENUM('label', 'habit');--> statement-breakpoint
CREATE TYPE "public"."habit_kind" AS ENUM('score_1_5', 'boolean', 'journal');--> statement-breakpoint
CREATE TYPE "public"."session_source" AS ENUM('timer', 'manual');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('running', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."stat" AS ENUM('mind', 'health', 'spirit');--> statement-breakpoint
CREATE TABLE "chapter_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"chapter_index" integer NOT NULL,
	"reached_at" timestamp with time zone NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "chapter_events_chapter_index_unique" UNIQUE("chapter_index")
);
--> statement-breakpoint
CREATE TABLE "daily_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_type" "daily_task_ref_type" NOT NULL,
	"ref_id" integer NOT NULL,
	"threshold" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "day_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_key" text NOT NULL,
	"mood" integer,
	"journal_text" text,
	"journal_prompt_id" integer,
	"closed_at" timestamp with time zone,
	CONSTRAINT "day_logs_day_key_unique" UNIQUE("day_key")
);
--> statement-breakpoint
CREATE TABLE "habit_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"habit_id" integer NOT NULL,
	"day_key" text NOT NULL,
	"score" integer,
	"done" boolean,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "habit_entries_habit_id_day_key_unique" UNIQUE("habit_id","day_key")
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"stat" "stat" NOT NULL,
	"kind" "habit_kind" NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "habits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"color" text NOT NULL,
	"stat" "stat" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "labels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "net_worth_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"stocks_vnd" integer NOT NULL,
	"gold_vnd" integer NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"hide_money" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"category" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rare_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_key" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"trigger" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"stat" "stat" NOT NULL,
	"name" text NOT NULL,
	"model_key" text NOT NULL,
	"unlock_level" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"label_id" integer NOT NULL,
	"day_key" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"planned_minutes" integer NOT NULL,
	"source" "session_source" NOT NULL,
	"status" "session_status" DEFAULT 'running' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"daily_session_goal" integer NOT NULL,
	"session_minutes" integer NOT NULL,
	"break_minutes" integer NOT NULL,
	"reminder_hour" integer,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "week_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_start" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "week_reviews_week_start_unique" UNIQUE("week_start")
);
--> statement-breakpoint
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_journal_prompt_id_prompts_id_fk" FOREIGN KEY ("journal_prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE no action ON UPDATE no action;