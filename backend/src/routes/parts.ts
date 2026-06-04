import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
const StockStatus     = { OK: 'OK', LOW_STOCK: 'LOW_STOCK', OUT: 'OUT' } as const;
const TransactionType = { ADD: 'ADD', CONSUME: 'CONSUME', ADJUST: 'ADJUST' } as const;

const router = Router();

function calcStatus(qty: number, minQty: number): string {
  if (qty === 0) return StockStatus.OUT;
  if (qty < minQty) return StockStatus.LOW_STOCK;
  return StockStatus.OK;
}

const PART_INCLUDE = {
  machines: { include: { machine: { include: { unit: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
  transactions: { include: { user: true }, orderBy: { createdAt: 'desc' as const }, take: 20 },
};

async function generatePartNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.part.count({ where: { orgId } });
  return `PRT-${year}-${String(count + 1).padStart(4, '0')}`;
}

// GET /api/parts
router.get('/', async (req: Request, res: Response) => {
  const parts = await prisma.part.findMany({
    include: { machines: { include: { machine: { include: { unit: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
    orderBy: { name: 'asc' },
  });
  res.json(parts);
});

// GET /api/parts/:id
router.get('/:id', async (req: Request, res: Response) => {
  const part = await prisma.part.findUnique({
    where: { id: req.params.id },
    include: PART_INCLUDE,
  });
  if (!part) return res.status(404).json({ error: 'Not found' });
  res.json(part);
});

// POST /api/parts
router.post('/', async (req: Request, res: Response) => {
  const {
    name, machineIds = [], spec, qty = 0, minQty = 1,
    supplier, vendorName, vendorPhone, location, category,
    cost = 0, criticality = 'Medium', photoUrl,
  } = req.body;
  const orgId = (req as any).user?.orgId;
  const numQty = Number(qty) || 0;
  const numMinQty = Number(minQty) || 1;
  const partNumber = await generatePartNumber(orgId);

  const part = await prisma.part.create({
    data: {
      partNumber,
      name,
      spec,
      qty: numQty,
      minQty: numMinQty,
      supplier,
      vendorName: vendorName || null,
      vendorPhone: vendorPhone || null,
      location: location || null,
      category: category || null,
      cost: Number(cost) || 0,
      criticality,
      photoUrl,
      orgId,
      status: calcStatus(numQty, numMinQty),
      machines: machineIds.length > 0
        ? { create: (machineIds as string[]).map((machineId: string) => ({ machineId })) }
        : undefined,
    },
    include: { machines: { include: { machine: { include: { unit: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
  });
  res.status(201).json(part);
});

// PUT /api/parts/:id
router.put('/:id', async (req: Request, res: Response) => {
  const {
    name, machineIds, spec, qty, minQty,
    supplier, vendorName, vendorPhone, location, category,
    cost, criticality, photoUrl,
  } = req.body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (spec !== undefined) data.spec = spec;
  if (qty !== undefined) data.qty = Number(qty);
  if (minQty !== undefined) data.minQty = Number(minQty);
  if (supplier !== undefined) data.supplier = supplier;
  if (vendorName !== undefined) data.vendorName = vendorName || null;
  if (vendorPhone !== undefined) data.vendorPhone = vendorPhone || null;
  if (location !== undefined) data.location = location || null;
  if (category !== undefined) data.category = category || null;
  if (cost !== undefined) data.cost = Number(cost);
  if (criticality !== undefined) data.criticality = criticality;
  if (photoUrl !== undefined) data.photoUrl = photoUrl;

  // Recalc status if stock levels changed
  if (data.qty !== undefined || data.minQty !== undefined) {
    const existing = await prisma.part.findUnique({ where: { id: req.params.id } });
    if (existing) {
      const newQty = data.qty ?? existing.qty;
      const newMin = data.minQty ?? existing.minQty;
      data.status = calcStatus(newQty, newMin);
    }
  }

  // Update machine associations if provided
  if (machineIds !== undefined) {
    // Delete old associations and re-create
    await prisma.partMachine.deleteMany({ where: { partId: req.params.id } });
    if ((machineIds as string[]).length > 0) {
      await prisma.partMachine.createMany({
        data: (machineIds as string[]).map((machineId: string) => ({ partId: req.params.id, machineId })),
      });
    }
  }

  const part = await prisma.part.update({
    where: { id: req.params.id },
    data,
    include: { machines: { include: { machine: { include: { unit: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
  });
  res.json(part);
});

// DELETE /api/parts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.part.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// POST /api/parts/:id/addstock
router.post('/:id/addstock', async (req: Request, res: Response) => {
  const { qty, notes, userId } = req.body;
  const part = await prisma.part.findUnique({ where: { id: req.params.id } });
  if (!part) return res.status(404).json({ error: 'Not found' });

  const newQty = part.qty + qty;
  const updated = await prisma.part.update({
    where: { id: req.params.id },
    data: { qty: newQty, status: calcStatus(newQty, part.minQty) },
  });
  await prisma.partTransaction.create({
    data: { partId: req.params.id, type: TransactionType.ADD, qty, notes, userId },
  });
  res.json(updated);
});

// POST /api/parts/:id/consume
router.post('/:id/consume', async (req: Request, res: Response) => {
  const { qty, notes, userId } = req.body;
  const part = await prisma.part.findUnique({ where: { id: req.params.id } });
  if (!part) return res.status(404).json({ error: 'Not found' });

  const newQty = Math.max(0, part.qty - qty);
  const updated = await prisma.part.update({
    where: { id: req.params.id },
    data: { qty: newQty, status: calcStatus(newQty, part.minQty) },
  });
  await prisma.partTransaction.create({
    data: { partId: req.params.id, type: TransactionType.CONSUME, qty, notes, userId },
  });
  res.json(updated);
});

export default router;
