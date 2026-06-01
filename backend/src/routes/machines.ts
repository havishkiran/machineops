import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

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
      parts: true,
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
  const { name, code, unitId, section, status, manufacturer, model, year, lastPM, nextPM, uptime } = req.body;
  const machine = await prisma.machine.create({
    data: {
      name, code, unitId, section,
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
  const { name, code, unitId, section, status, manufacturer, model, year, lastPM, nextPM, uptime } = req.body;
  const machine = await prisma.machine.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
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

export default router;
