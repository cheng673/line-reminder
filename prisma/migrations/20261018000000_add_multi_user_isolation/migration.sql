-- Move the original single-owner installation to a proper multi-account model.
-- Existing data remains owned by the legacy `owner` account.
ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "username" TEXT;
UPDATE "app_users" SET "username" = "id" WHERE "username" IS NULL;
ALTER TABLE "app_users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "app_users_username_key" ON "app_users"("username");

ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
UPDATE "reminders" SET "user_id" = 'owner' WHERE "user_id" IS NULL;
ALTER TABLE "reminders" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "reminders_user_id_fkey";
ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "reminders_user_id_scheduled_at_idx" ON "reminders"("user_id", "scheduled_at");

ALTER TABLE "line_recipients" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
UPDATE "line_recipients" SET "user_id" = 'owner' WHERE "user_id" IS NULL;
ALTER TABLE "line_recipients" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "line_recipients" DROP CONSTRAINT IF EXISTS "line_recipients_pkey";
ALTER TABLE "line_recipients"
  ADD CONSTRAINT "line_recipients_pkey" PRIMARY KEY ("user_id", "line_user_id");
ALTER TABLE "line_recipients" DROP CONSTRAINT IF EXISTS "line_recipients_user_id_fkey";
ALTER TABLE "line_recipients"
  ADD CONSTRAINT "line_recipients_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "line_link_tokens" (
  "token_hash" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "line_link_tokens_pkey" PRIMARY KEY ("token_hash"),
  CONSTRAINT "line_link_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "line_link_tokens_user_id_idx" ON "line_link_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "line_link_tokens_expires_at_idx" ON "line_link_tokens"("expires_at");
