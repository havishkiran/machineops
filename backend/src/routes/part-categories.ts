import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/part-categories
router.get('/', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const cats = await prisma.partCategory.findMany({
    where: { orgId },
    orderBy: { name: 'asc' },
  });
  res.json(cats);
});

// POST /api/part-categories
router.post('/', async (req: Request, res: Response) => {
  const orgId = (req as any).user?.orgId;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  try {
    const cat = await prisma.partCategory.create({ data: { name: name.trim(), orgId } });
    res.status(201).json(cat);
  } catch {
    res.status(409).json({ error: 'Category already exists.' });
  }
});

// DELETE /api/part-categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.partCategory.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
