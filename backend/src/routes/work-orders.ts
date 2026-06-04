import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const SUPERVISOR_ROLES = ['Super Admin', 'Floor Supervisor', 'Shift Supervisor'];

const WO_INCLUDE = {
  machine: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
  assignee: true,
  ticket: true,
  pmTask: true,
  steps: { orderBy: { sortOrder: 'asc' as const } },
  parts: { include: { part: { select: { id: true, name: true, qty: true, status: true, photoUrl: true } } } },
  labor: { include: { user: true } },
};

function calcStatus(qty: number, minQty: number): string {
  if (qty <= 0) return 'OUT';
  if (qty <= minQty) return 'LOW_STOCK';
  return 'OK';
}

// GET /api/work-orders
router.get('/', async (req: Request, res: Response) => {
  const orders = await prisma.workOrder.findMany({ include: WO_INCLUDE, orderBy: { createdAt: 'desc' } });
  res.json(orders);
});

// GET /api/work-orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  const order = await prisma.workOrder.findUnique({ where: { id: req.params.id }, include: WO_INCLUDE });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

// POST /api/work-orders
router.post('/', async (req: Request, res: Response) => {
  const { steps, parts, labor, ...data } = req.body;
  const count = await prisma.workOrder.count();
  const woNum = `WO-2025-${String(count + 114).padStart(4, '0')}`;

  const order = await prisma.workOrder.create({
    data: {
      ...data,
      woNum,
      steps: steps ? { create: steps } : undefined,
      parts: parts ? { create: parts.map((p: any) => ({ partId: p.partId ?? null, partName: p.partName, qty: p.qty, cost: p.cost })) } : undefined,
      labor: labor ? { create: labor } : undefined,
    },
    include: WO_INCLUDE,
  });
  res.status(201).json(order);
});

// POST /api/work-orders/:id/assign  — supervisor only
router.post('/:id/assign', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user || !SUPERVISOR_ROLES.includes(user.role)) {
    return res.status(403).json({ error: 'Only supervisors and admins can assign work orders.' });
  }
  const { assigneeId } = req.body;
  const order = await prisma.workOrder.update({
    where: { id: req.params.id },
    data: { assigneeId },
    include: WO_INCLUDE,
  });
  res.json(order);
});

// PUT /api/work-orders/:id  — also handles completion with auto-deduction
router.put('/:id', async (req: Request, res: Response) => {
  const { steps, parts: _parts, labor, ...data } = req.body;

  // If completing, auto-deduct linked parts from inventory
  if (data.status === 'COMPLETED') {
    const existing = await prisma.workOrder.findUnique({
      where: { id: req.params.id },
      include: { parts: true },
    });
    if (existing) {
      const linkedParts = existing.parts.filter(p => p.partId);
      for (const wp of linkedParts) {
        const part = await prisma.part.findUnique({ where: { id: wp.partId! } });
        if (part) {
          const newQty = Math.max(0, part.qty - wp.qty);
          await prisma.part.update({
            where: { id: part.id },
            data: { qty: newQty, status: calcStatus(newQty, part.minQty) },
          });
        }
      }
    }
  }

  const order = await prisma.workOrder.update({ where: { id: req.params.id }, data, include: WO_INCLUDE });
  res.json(order);
});

// POST /api/work-orders/:id/parts  — add a part to the WO
router.post('/:id/parts', async (req: Request, res: Response) => {
  const { partId, partName, qty, cost } = req.body;
  await prisma.workOrderPart.create({
    data: { workOrderId: req.params.id, partId: partId ?? null, partName, qty, cost },
  });
  const order = await prisma.workOrder.findUnique({ where: { id: req.params.id }, include: WO_INCLUDE });
  res.json(order);
});

// DELETE /api/work-orders/:id/parts/:partItemId  — remove a part from the WO
router.delete('/:id/parts/:partItemId', async (req: Request, res: Response) => {
  await prisma.workOrderPart.delete({ where: { id: req.params.partItemId } });
  const order = await prisma.workOrder.findUnique({ where: { id: req.params.id }, include: WO_INCLUDE });
  res.json(order);
});

// POST /api/work-orders/:id/steps/:stepId/toggle
router.post('/:id/steps/:stepId/toggle', async (req: Request, res: Response) => {
  const step = await prisma.workOrderStep.findUnique({ where: { id: req.params.stepId } });
  if (!step) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.workOrderStep.update({ where: { id: req.params.stepId }, data: { done: !step.done } });
  res.json(updated);
});

export default router;
