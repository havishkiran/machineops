import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const PM_INCLUDE = {
  machine: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
  assignee: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeState(nextDueDate: Date | null): string {
  if (!nextDueDate) return 'UPCOMING';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate); due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'OVERDUE';
  if (diff === 0) return 'DUE';
  return 'UPCOMING';
}

function overdueStr(nextDueDate: Date | null): string | null {
  if (!nextDueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate); due.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
  if (days <= 0) return null;
  return days === 1 ? '1 day' : `${days} days`;
}

function daysUntil(nextDueDate: Date | null): number | null {
  if (!nextDueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate); due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - today.getTime()) / 86400000);
}

function fmtDueDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); // "16 Jun"
}

function nextOccurrence(from: Date, frequency: string): Date {
  const d = new Date(from);
  switch (frequency) {
    case 'WEEKLY':      d.setDate(d.getDate() + 7); break;
    case 'FORTNIGHTLY': d.setDate(d.getDate() + 14); break;
    case 'MONTHLY':     d.setMonth(d.getMonth() + 1); break;
    case 'QUARTERLY':   d.setMonth(d.getMonth() + 3); break;
    case 'YEARLY':      d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

function enrichTask(task: any) {
  if (task.state === 'COMPLETED') return { ...task, daysUntilDue: null };
  if (task.nextDueDate) {
    const state = computeState(task.nextDueDate);
    const overdueBy = state === 'OVERDUE' ? overdueStr(task.nextDueDate) : null;
    const daysUntilDue = daysUntil(task.nextDueDate);
    return { ...task, state, overdueBy, daysUntilDue };
  }
  return { ...task, daysUntilDue: null };
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/pm-tasks
router.get('/', async (req: Request, res: Response) => {
  const tasks = await prisma.pMTask.findMany({
    include: PM_INCLUDE,
    orderBy: { nextDueDate: 'asc' },
  });
  res.json(tasks.map(enrichTask));
});

// GET /api/pm-tasks/due-soon  — tasks due within notifyDaysBefore days (not yet notified today)
router.get('/due-soon', async (req: Request, res: Response) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tasks = await prisma.pMTask.findMany({
    where: { state: { not: 'COMPLETED' }, nextDueDate: { not: null } },
    include: PM_INCLUDE,
  });

  const todayMs = today.getTime();
  const notifyMs = 24 * 60 * 60 * 1000;

  const dueSoon = tasks.filter(t => {
    if (!t.nextDueDate) return false;
    const days = daysUntil(t.nextDueDate);
    if (days === null || days < 0 || days > t.notifyDaysBefore) return false;
    // Skip if already notified within last 24h
    if (t.notifiedAt && (Date.now() - new Date(t.notifiedAt).getTime()) < notifyMs) return false;
    return true;
  });

  // Mark as notified
  if (dueSoon.length > 0) {
    await prisma.pMTask.updateMany({
      where: { id: { in: dueSoon.map(t => t.id) } },
      data: { notifiedAt: new Date() },
    });
  }

  res.json(dueSoon.map(enrichTask));
});

// GET /api/pm-tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  const task = await prisma.pMTask.findUnique({ where: { id: req.params.id }, include: PM_INCLUDE });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(enrichTask(task));
});

// POST /api/pm-tasks
router.post('/', async (req: Request, res: Response) => {
  const { machineId, task, section, assigneeId, nextDueDate, frequency = 'NONE', notifyDaysBefore = 3 } = req.body;

  const dueDateISO = nextDueDate ? new Date(nextDueDate) : null;
  const dueDate = dueDateISO ? fmtDueDate(dueDateISO) : (req.body.dueDate ?? '');
  const state = dueDateISO ? computeState(dueDateISO) : 'UPCOMING';

  const created = await prisma.pMTask.create({
    data: { machineId, task, section, assigneeId, dueDate, nextDueDate: dueDateISO, frequency, notifyDaysBefore, state },
    include: PM_INCLUDE,
  });
  res.status(201).json(enrichTask(created));
});

// POST /api/pm-tasks/:id/complete
router.post('/:id/complete', async (req: Request, res: Response) => {
  const existing = await prisma.pMTask.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const completed = await prisma.pMTask.update({
    where: { id: req.params.id },
    data: { state: 'COMPLETED', completedAt: new Date() },
    include: PM_INCLUDE,
  });

  // Auto-create next occurrence if recurring
  if (existing.frequency !== 'NONE' && existing.nextDueDate) {
    const nextDate = nextOccurrence(existing.nextDueDate, existing.frequency);
    const nextState = computeState(nextDate);
    await prisma.pMTask.create({
      data: {
        machineId: existing.machineId,
        task: existing.task,
        section: existing.section,
        assigneeId: existing.assigneeId,
        dueDate: fmtDueDate(nextDate),
        nextDueDate: nextDate,
        frequency: existing.frequency,
        notifyDaysBefore: existing.notifyDaysBefore,
        state: nextState,
      },
    });
  }

  res.json(enrichTask(completed));
});

export default router;
