-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('lead', 'qualified', 'active', 'inactive', 'churned');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "address" VARCHAR(512),
ADD COLUMN     "company_name" VARCHAR(255),
ADD COLUMN     "source" VARCHAR(128),
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'lead';

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "title" VARCHAR(255);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "customers_organization_id_status_idx" ON "customers"("organization_id", "status");
