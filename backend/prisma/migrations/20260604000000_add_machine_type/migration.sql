-- AlterTable: add machineType to Machine (nullable, for auto code generation)
ALTER TABLE "Machine" ADD COLUMN "machineType" TEXT;
