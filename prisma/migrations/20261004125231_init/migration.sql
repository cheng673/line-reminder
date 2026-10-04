-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "recipient_name" TEXT NOT NULL DEFAULT '我的 LINE',
    "line_user_id" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_status_scheduled_at_idx" ON "reminders"("status", "scheduled_at");
