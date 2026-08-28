-- Remove the MAKAM category. PostgreSQL cannot drop enum values directly,
-- so the enum type is recreated and existing MAKAM rows are mapped to SITUS.
ALTER TYPE "Category" RENAME TO "Category_old";

CREATE TYPE "Category" AS ENUM ('BANGUNAN', 'SITUS', 'STRUKTUR', 'KAWASAN', 'BENDA');

ALTER TABLE "CagarBudaya"
  ALTER COLUMN "kategori" TYPE "Category"
  USING (
    CASE "kategori"::text
      WHEN 'MAKAM' THEN 'SITUS'::"Category"
      ELSE "kategori"::text::"Category"
    END
  );

DROP TYPE "Category_old";
