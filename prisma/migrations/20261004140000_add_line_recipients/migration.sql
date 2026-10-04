CREATE TABLE "line_recipients" (
    "line_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT '我的 LINE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_recipients_pkey" PRIMARY KEY ("line_user_id")
);
