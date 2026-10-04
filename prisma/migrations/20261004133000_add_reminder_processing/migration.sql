-- A reminder is claimed before it is sent, preventing concurrent scheduler
-- runs from sending the same message twice.
ALTER TYPE "ReminderStatus" ADD VALUE 'PROCESSING';

ALTER TABLE "reminders" ADD COLUMN "processing_at" TIMESTAMP(3);
