import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Generate abbreviation: first letter of each word (multi-word), or first N chars (single word)
function abbrev(str: string, maxLen: number): string {
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, maxLen).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, maxLen).toUpperCase();
}

// GET /api/machines/next-code?unitCode=TVPM&section=Dipping&machineType=Circular+Saw
router.get('/next-code', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const { unitCode, section, machineType } = req.query as Record<string, string>;
  if (!unitCode || !section || !machineType) {
    return res.status(400).json({ error: 'unitCode, section and machineType are required' });
  }
  const sectionAbbr = abbrev(section, 3);
  const typeAbbr = abbrev(machineType, 4);
  const prefix = `${unitCode.toUpperCase()}-${sectionAbbr}-${typeAbbr}-`;

  const existing = await prisma.machine.findMany({
    where: { orgId, code: { startsWith: prefix } },
    select: { code: true },
  });

  let maxSeq = 0;
  for (const m of existing) {
    const seq = parseInt(m.code.slice(prefix.length), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  res.json({ code: `${prefix}${String(maxSeq + 1).padStart(3, '0')}` });
});

// GET /api/machines
router.get('/', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const machines = await prisma.machine.findMany({
    where: { orgId },
    include: {
      photos: { orderBy: { isPrimary: 'desc' } },
      _count: { select: { tickets: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(machines);
});

// DELETE /api/machines/bulk — hard delete with cascade handling
router.delete('/bulk', async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
  const orgId = (req as any).user?.orgId;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  await prisma.$transaction(async (tx) => {
    // Null out ticket machineIds (tickets are kept, just unlinked)
    await tx.ticket.updateMany({ where: { machineId: { in: ids } }, data: { machineId: null } });
    // Delete PM tasks (checklistItems and completions cascade)
    await tx.pMTask.deleteMany({ where: { machineId: { in: ids } } });
    // Delete work orders (steps, parts, labor cascade)
    await tx.workOrder.deleteMany({ where: { machineId: { in: ids } } });
    // Delete machines (photos and partMachines cascade)
    await tx.machine.deleteMany({ where: { id: { in: ids }, orgId } });
  });
  res.json({ deleted: ids.length });
});

// POST /api/machines/import — bulk create, auto-generate machine codes
router.post('/import', async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
  const orgId = (req as any).user?.orgId;
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'rows array required' });

  const units = await prisma.unit.findMany({ where: { orgId } });
  const unitMap = new Map(units.map(u => [u.code.toUpperCase(), u]));

  const created: any[] = [];
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const unit = unitMap.get((row.unit_code ?? '').toUpperCase());
    if (!unit) { errors.push(`Row ${rowNum}: unknown unit_code "${row.unit_code}"`); continue; }
    if (!row.name?.trim() || !row.section?.trim()) { errors.push(`Row ${rowNum}: name and section are required`); continue; }

    // Auto-generate code
    const sectionAbbr = abbrev(row.section, 3);
    const typeAbbr = row.machine_type?.trim() ? abbrev(row.machine_type, 4) : 'GEN';
    const prefix = `${unit.code.toUpperCase()}-${sectionAbbr}-${typeAbbr}-`;
    const existing = await prisma.machine.findMany({ where: { orgId, code: { startsWith: prefix } }, select: { code: true } });
    let maxSeq = 0;
    for (const m of [...existing, ...created.filter(m => m.code.startsWith(prefix))]) {
      const seq = parseInt(m.code.slice(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
    const code = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;

    try {
      const machine = await prisma.machine.create({
        data: {
          name: row.name.trim(), code, unitId: unit.id, section: row.section.trim(),
          machineType: row.machine_type?.trim() || null,
          status: ['WORKING','WARNING','CRITICAL','IDLE','INACTIVE'].includes((row.status ?? '').toUpperCase()) ? row.status.toUpperCase() : 'WORKING',
          manufacturer: row.manufacturer?.trim() || null, model: row.model?.trim() || null,
          year: row.year?.trim() || null, lastPM: row.last_pm?.trim() || null, nextPM: row.next_pm?.trim() || null,
          uptime: row.uptime ? Math.min(100, Math.max(0, Number(row.uptime))) : 100, orgId,
        },
        include: { photos: true, _count: { select: { tickets: true } } },
      });
      created.push(machine);
    } catch (e: any) { errors.push(`Row ${rowNum}: ${e.message}`); }
  }
  res.json({ created: created.length, machines: created, errors });
});

// GET /api/machines/:id
router.get('/:id', async (req: Request, res: Response) => {
  const machine = await prisma.machine.findUnique({
    where: { id: req.params.id },
    include: {
      photos: { orderBy: { isPrimary: 'desc' } },
      tickets: {
        include: { raisedBy: true, assignedTo: true },
        orderBy: { raisedAt: 'desc' },
      },
      partMachines: { include: { part: true } },
      pmTasks: { include: { assignee: true } },
      workOrders: { include: { assignee: true, steps: { orderBy: { sortOrder: 'asc' } } } },
    },
  });
  if (!machine) return res.status(404).json({ error: 'Not found' });
  res.json(machine);
});

// POST /api/machines
router.post('/', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const { name, code, machineType, unitId, section, status, manufacturer, model, year, lastPM, nextPM, uptime } = req.body;
  const machine = await prisma.machine.create({
    data: {
      name, code, unitId, section,
      machineType: machineType || null,
      status: status || 'WORKING',
      manufacturer: manufacturer || null,
      model: model || null,
      year: year || null,
      lastPM: lastPM || null,
      nextPM: nextPM || null,
      uptime: uptime ?? 100,
      orgId,
    },
    include: { photos: true, _count: { select: { tickets: true } } },
  });
  res.status(201).json(machine);
});

// PUT /api/machines/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { name, code, machineType, unitId, section, status, manufacturer, model, year, lastPM, nextPM, uptime } = req.body;
  const machine = await prisma.machine.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(machineType !== undefined && { machineType }),
      ...(unitId !== undefined && { unitId }),
      ...(section !== undefined && { section }),
      ...(status !== undefined && { status }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(model !== undefined && { model }),
      ...(year !== undefined && { year }),
      ...(lastPM !== undefined && { lastPM }),
      ...(nextPM !== undefined && { nextPM }),
      ...(uptime !== undefined && { uptime }),
    },
    include: { photos: true, _count: { select: { tickets: true } } },
  });
  res.json(machine);
});

// DELETE /api/machines/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.machine.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// POST /api/machines/:id/photos  — add a photo by URL
router.post('/:id/photos', async (req: Request, res: Response) => {
  const { url, isPrimary } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  // If setting as primary, unset existing primary
  if (isPrimary) {
    await prisma.machinePhoto.updateMany({ where: { machineId: req.params.id, isPrimary: true }, data: { isPrimary: false } });
  }
  const photo = await prisma.machinePhoto.create({
    data: { machineId: req.params.id, url, isPrimary: !!isPrimary },
  });
  const machine = await prisma.machine.findUnique({
    where: { id: req.params.id },
    include: { photos: { orderBy: { isPrimary: 'desc' } }, _count: { select: { tickets: true } } },
  });
  res.status(201).json(machine);
});

// DELETE /api/machines/:id/photos/:photoId
router.delete('/:id/photos/:photoId', async (req: Request, res: Response) => {
  await prisma.machinePhoto.delete({ where: { id: req.params.photoId } });
  const machine = await prisma.machine.findUnique({
    where: { id: req.params.id },
    include: { photos: { orderBy: { isPrimary: 'desc' } }, _count: { select: { tickets: true } } },
  });
  res.json(machine);
});

export default router;
