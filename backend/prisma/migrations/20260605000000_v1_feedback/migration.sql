-- v1 feedback: global parts (PartMachine junction), PartCategory, optional Ticket.machineId,
-- Ticket.category, Part new vendor/location/partNumber fields, WorkOrder.pmTaskId

-- ── 1. Ticket: make machineId nullable, add category ─────────────────────────
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_machineId_fkey";
ALTER TABLE "Ticket" ALTER COLUMN "machineId" DROP NOT NULL;
ALTER TABLE "Ticket" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Machine';
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_machineId_fkey"
  FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 2. Part: drop machineId FK + column, add new fields ──────────────────────
ALTER TABLE "Part" DROP CONSTRAINT "Part_machineId_fkey";
ALTER TABLE "Part" DROP COLUMN "machineId";
ALTER TABLE "Part" ADD COLUMN "partNumber" TEXT;
ALTER TABLE "Part" ADD COLUMN "vendorName" TEXT;
ALTER TABLE "Part" ADD COLUMN "vendorPhone" TEXT;
ALTER TABLE "Part" ADD COLUMN "location" TEXT;
ALTER TABLE "Part" ADD COLUMN "category" TEXT;

-- ── 3. New table: PartMachine (junction) ─────────────────────────────────────
CREATE TABLE "PartMachine" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    CONSTRAINT "PartMachine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PartMachine_partId_machineId_key" ON "PartMachine"("partId", "machineId");
ALTER TABLE "PartMachine" ADD CONSTRAINT "PartMachine_partId_fkey"
  FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartMachine" ADD CONSTRAINT "PartMachine_machineId_fkey"
  FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 4. New table: PartCategory ────────────────────────────────────────────────
CREATE TABLE "PartCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    CONSTRAINT "PartCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PartCategory_name_orgId_key" ON "PartCategory"("name", "orgId");
ALTER TABLE "PartCategory" ADD CONSTRAINT "PartCategory_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 5. WorkOrder: add pmTaskId ────────────────────────────────────────────────
ALTER TABLE "WorkOrder" ADD COLUMN "pmTaskId" TEXT;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_pmTaskId_fkey"
  FOREIGN KEY ("pmTaskId") REFERENCES "PMTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
