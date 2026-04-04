-- Remove extra CRM columns. Soft-delete remains `deleted_at` only; API adds computed `isDeleted`.

DROP INDEX IF EXISTS "customers_organization_id_status_idx";

ALTER TABLE "customers" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "CustomerStatus";

ALTER TABLE "customers" DROP COLUMN IF EXISTS "company_name";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "source";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "address";

ALTER TABLE "notes" DROP COLUMN IF EXISTS "title";

ALTER TABLE "organizations" DROP COLUMN IF EXISTS "description";
