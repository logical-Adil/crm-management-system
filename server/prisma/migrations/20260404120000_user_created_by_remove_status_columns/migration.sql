-- Align users table with schema.prisma: remove status columns, add created_by self-relation.

ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_email_verified";
ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_at";

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;

CREATE INDEX IF NOT EXISTS "users_created_by_id_idx" ON "users"("created_by_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_id_fkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
