-- Tenant administrators are intentionally retired. Existing accounts are kept
-- for audit history, but disabled before receiving the least-privileged
-- remaining role so they cannot sign in after this migration.
UPDATE "User"
SET "active" = false,
    "role" = 'AIRPORT_ADMIN'
WHERE "role" = 'TENANT_ADMIN';

DROP TABLE "TenantOwnership";

ALTER TYPE "AdminRole" RENAME TO "AdminRole_old";
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'AIRPORT_ADMIN');
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "AdminRole"
  USING ("role"::text::"AdminRole");
DROP TYPE "AdminRole_old";
