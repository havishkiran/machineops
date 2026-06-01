import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/units — list org's units (include machine count)
router.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const units = await prisma.unit.findMany({
    where: { orgId: user.orgId },
    include: { _count: { select: { machines: true } } },
    orderBy: { unitNo: 'asc' },
  });
  res.json(units);
});

// POST /api/units — create (Super Admin only)
router.post('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required' });
  const { id, name, code, unitNo } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
  try {
    const unit = await prisma.unit.create({
      data: { id: id || code.toLowerCase(), name, code, unitNo: unitNo || null, orgId: user.orgId },
      include: { _count: { select: { machines: true } } },
    });
    res.json(unit);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to create unit' });
  }
});

// PUT /api/units/:id — update (Super Admin only)
router.put('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required' });
  const { name, code, unitNo } = req.body;
  try {
    const unit = await prisma.unit.update({
      where: { id: req.params.id },
      data: { name, code, unitNo: unitNo || null },
      include: { _count: { select: { machines: true } } },
    });
    res.json(unit);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to update unit' });
  }
});

// DELETE /api/units/:id — delete (Super Admin only, reject if has machines)
router.delete('/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user?.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required' });
  const count = await prisma.machine.count({ where: { unitId: req.params.id } });
  if (count > 0) return res.status(400).json({ error: `Cannot delete unit: it has ${count} machine(s). Reassign or delete them first.` });
  try {
    await prisma.unit.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to delete unit' });
  }
});

export default router;
