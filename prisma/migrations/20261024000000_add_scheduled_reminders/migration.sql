CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY');

CREATE TABLE "scheduled_reminders" (
  "id" TEXT NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "frequency" "ScheduleFrequency" NOT NULL,
  "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "time_of_day" VARCHAR(5) NOT NULL,
  "next_run_at" TIMESTAMP(3) NOT NULL,
  "last_sent_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "user_id" TEXT NOT NULL,
  "line_user_id" TEXT NOT NULL,
  "recipient_name" TEXT NOT NULL,
  CONSTRAINT "scheduled_reminders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "scheduled_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "scheduled_reminders_is_active_next_run_at_idx" ON "scheduled_reminders"("is_active", "next_run_at");
CREATE INDEX "scheduled_reminders_user_id_line_user_id_idx" ON "scheduled_reminders"("user_id", "line_user_id");
