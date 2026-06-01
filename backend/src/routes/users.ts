import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const router = Router();

const SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  active: true,
  orgId: true,
};

// GET /api/users — list org's users (exclude passwordHash)
router.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const users = await prisma.user.findMany({
    where: { orgId: user.orgId },
    select: SELECT_FIELDS,
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

// POST /api/users — create user (Super Admin only)
router.post('/', async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser?.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required' });
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'Technician', phone: phone || null, active: true, orgId: reqUser.orgId },
      select: SELECT_FIELDS,
    });
    res.json(user);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Email already in use' });
    res.status(400).json({ error: e.message || 'Failed to create user' });
  }
});

// PUT /api/users/:id — update (Super Admin only)
router.put('/:id', async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser?.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required' });
  const { name, email, password, role, phone, active } = req.body;
  const data: Record<string, any> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;
  if (phone !== undefined) data.phone = phone || null;
  if (active !== undefined) data.active = active;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: SELECT_FIELDS,
    });
    res.json(user);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Email already in use' });
    res.status(400).json({ error: e.message || 'Failed to update user' });
  }
});

// DELETE /api/users/:id — delete (Super Admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  if (reqUser?.role !== 'Super Admin') return res.status(403).json({ error: 'Super Admin access required' });
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to delete user' });
  }
});

export default router;
