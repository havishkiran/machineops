import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/settings  (returns org for the first org — demo)
router.get('/', async (req: Request, res: Response) => {
  const org = await prisma.organization.findFirst();
  res.json({ org });
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  const { name, unitCode, whatsapp } = req.body;
  const org = await prisma.organization.findFirst();
  if (!org) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { name, unitCode, whatsapp },
  });
  res.json({ org: updated });
});

export default router;
