-- Each selected LINE recipient has an independent password.
ALTER TABLE "line_recipients"
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
