-- PM checklist: add partId to PMTask, PMChecklistItem, PMTaskCompletion

-- ── 1. PMTask: add optional partId ───────────────────────────────────────────
ALTER TABLE "PMTask" ADD COLUMN "partId" TEXT;
ALTER TABLE "PMTask" ADD CONSTRAINT "PMTask_partId_fkey"
  FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 2. PMChecklistItem ────────────────────────────────────────────────────────
CREATE TABLE "PMChecklistItem" (
    "id"        TEXT NOT NULL,
    "pmTaskId"  TEXT NOT NULL,
    "text"      TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PMChecklistItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PMChecklistItem" ADD CONSTRAINT "PMChecklistItem_pmTaskId_fkey"
  FOREIGN KEY ("pmTaskId") REFERENCES "PMTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 3. PMTaskCompletion ───────────────────────────────────────────────────────
CREATE TABLE "PMTaskCompletion" (
    "id"            TEXT NOT NULL,
    "pmTaskId"      TEXT NOT NULL,
    "completedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedById" TEXT,
    "notes"         TEXT,
    "checkedItems"  TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "PMTaskCompletion_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PMTaskCompletion" ADD CONSTRAINT "PMTaskCompletion_pmTaskId_fkey"
  FOREIGN KEY ("pmTaskId") REFERENCES "PMTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PMTaskCompletion" ADD CONSTRAINT "PMTaskCompletion_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
