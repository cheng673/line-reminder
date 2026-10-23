-- A browser session represents the LINE recipient chosen on the start screen.
ALTER TABLE "user_sessions"
  ADD COLUMN IF NOT EXISTS "selected_line_user_id" TEXT;
