-- Add qty to PartMachine: how many of this part are installed on this machine
ALTER TABLE "PartMachine" ADD COLUMN "qty" INTEGER NOT NULL DEFAULT 1;
