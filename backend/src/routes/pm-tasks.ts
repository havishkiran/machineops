import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const PM_LIST_INCLUDE = {
  machine: { include: { unit: true, photos: { where: { isPrimary: true }, take: 1 } } },
  part: true,
  assignee: true,
  checklistItems: { orderBy: { sortOrder: 'asc' as const } },
};

const PM_DETAIL_INCLUDE = {
  machine: { include: { unit: true, photos: { where: { isPrimary: true }, take: 1 } } },
  part: true,
  assignee: true,
  checklistItems: { orderBy: { sortOrder: 'asc' as const } },
  completions: {
    include: { completedBy: true },
    orderBy: { completedAt: 'desc' as const },
    take: 5,
  },
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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
    include: PM_LIST_INCLUDE,
    orderBy: { nextDueDate: 'asc' },
  });
  res.json(tasks.map(enrichTask));
});

// GET /api/pm-tasks/due-soon
router.get('/due-soon', async (req: Request, res: Response) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tasks = await prisma.pMTask.findMany({
    where: { state: { not: 'COMPLETED' }, nextDueDate: { not: null } },
    include: PM_LIST_INCLUDE,
  });

  const notifyMs = 24 * 60 * 60 * 1000;
  const dueSoon = tasks.filter(t => {
    if (!t.nextDueDate) return false;
    const days = daysUntil(t.nextDueDate);
    if (days === null || days < 0 || days > t.notifyDaysBefore) return false;
    if (t.notifiedAt && (Date.now() - new Date(t.notifiedAt).getTime()) < notifyMs) return false;
    return true;
  });

  if (dueSoon.length > 0) {
    await prisma.pMTask.updateMany({
      where: { id: { in: dueSoon.map(t => t.id) } },
      data: { notifiedAt: new Date() },
    });
  }

  res.json(dueSoon.map(enrichTask));
});

// DELETE /api/pm-tasks/bulk — hard delete
router.delete('/bulk', async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array required' });
  const { count } = await prisma.pMTask.deleteMany({ where: { id: { in: ids } } });
  res.json({ deleted: count });
});

// POST /api/pm-tasks/import — bulk create
router.post('/import', async (req: Request, res: Response) => {
  if ((req as any).user?.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
  const orgId = (req as any).user?.orgId;
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'rows array required' });

  const machines = await prisma.machine.findMany({ where: { orgId } });
  const machineMap = new Map(machines.map(m => [m.code.toUpperCase(), m]));
  const users = await prisma.user.findMany({ where: { orgId } });
  const userMap = new Map(users.map(u => [u.email.toLowerCase(), u]));

  const created: any[] = [];
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const machine = machineMap.get((row.machine_code ?? '').toUpperCase());
    if (!machine) { errors.push(`Row ${rowNum}: unknown machine_code "${row.machine_code}"`); continue; }
    const assignee = userMap.get((row.assignee_email ?? '').toLowerCase());
    if (!assignee) { errors.push(`Row ${rowNum}: unknown assignee_email "${row.assignee_email}"`); continue; }
    if (!row.task?.trim()) { errors.push(`Row ${rowNum}: task is required`); continue; }

    const validFreqs = ['NONE','WEEKLY','FORTNIGHTLY','MONTHLY','QUARTERLY','YEARLY'];
    const frequency = validFreqs.includes((row.frequency ?? '').toUpperCase()) ? row.frequency.toUpperCase() : 'MONTHLY';
    const nextDueDate = row.next_due_date ? new Date(row.next_due_date) : null;
    const state = computeState(nextDueDate);

    try {
      const task = await prisma.pMTask.create({
        data: {
          machineId: machine.id, task: row.task.trim(),
          section: row.section?.trim() || machine.section,
          assigneeId: assignee.id, frequency, nextDueDate,
          dueDate: row.next_due_date || '',
          notifyDaysBefore: row.notify_days_before ? Number(row.notify_days_before) : 3,
          state, overdueBy: overdueStr(nextDueDate),
        },
        include: PM_LIST_INCLUDE,
      });
      created.push(task);
    } catch (e: any) { errors.push(`Row ${rowNum}: ${e.message}`); }
  }
  res.json({ created: created.length, tasks: created, errors });
});

// GET /api/pm-tasks/:id  — full detail with checklist + completions
router.get('/:id', async (req: Request, res: Response) => {
  const task = await prisma.pMTask.findUnique({
    where: { id: req.params.id },
    include: PM_DETAIL_INCLUDE,
  });
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(enrichTask(task));
});

// POST /api/pm-tasks
router.post('/', async (req: Request, res: Response) => {
  const { machineId, partId, task, section, assigneeId, nextDueDate, frequency = 'NONE', notifyDaysBefore = 3 } = req.body;

  const dueDateISO = nextDueDate ? new Date(nextDueDate) : null;
  const dueDate = dueDateISO ? fmtDueDate(dueDateISO) : (req.body.dueDate ?? '');
  const state = dueDateISO ? computeState(dueDateISO) : 'UPCOMING';

  const created = await prisma.pMTask.create({
    data: {
      machineId,
      partId: partId || null,
      task,
      section,
      assigneeId,
      dueDate,
      nextDueDate: dueDateISO,
      frequency,
      notifyDaysBefore,
      state,
    },
    include: PM_LIST_INCLUDE,
  });
  res.status(201).json(enrichTask(created));
});

// PUT /api/pm-tasks/:id  — update task fields
router.put('/:id', async (req: Request, res: Response) => {
  const { task, section, assigneeId, partId, nextDueDate, frequency, notifyDaysBefore } = req.body;
  const data: any = {};
  if (task !== undefined) data.task = task;
  if (section !== undefined) data.section = section;
  if (assigneeId !== undefined) data.assigneeId = assigneeId;
  if (partId !== undefined) data.partId = partId || null;
  if (frequency !== undefined) data.frequency = frequency;
  if (notifyDaysBefore !== undefined) data.notifyDaysBefore = notifyDaysBefore;
  if (nextDueDate !== undefined) {
    const d = new Date(nextDueDate);
    data.nextDueDate = d;
    data.dueDate = fmtDueDate(d);
    data.state = computeState(d);
  }

  const updated = await prisma.pMTask.update({
    where: { id: req.params.id },
    data,
    include: PM_DETAIL_INCLUDE,
  });
  res.json(enrichTask(updated));
});

// POST /api/pm-tasks/:id/complete
router.post('/:id/complete', async (req: Request, res: Response) => {
  const { notes, checkedItems, completedById } = req.body;
  const userId = completedById || (req as any).user?.userId;

  const existing = await prisma.pMTask.findUnique({
    where: { id: req.params.id },
    include: { checklistItems: true },
  });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // Save completion record
  await prisma.pMTaskCompletion.create({
    data: {
      pmTaskId: req.params.id,
      completedById: userId || null,
      notes: notes || null,
      checkedItems: JSON.stringify(checkedItems || []),
    },
  });

  const completed = await prisma.pMTask.update({
    where: { id: req.params.id },
    data: { state: 'COMPLETED', completedAt: new Date() },
    include: PM_DETAIL_INCLUDE,
  });

  // Auto-create next occurrence if recurring — copy checklist items
  if (existing.frequency !== 'NONE' && existing.nextDueDate) {
    const nextDate = nextOccurrence(existing.nextDueDate, existing.frequency);
    const nextState = computeState(nextDate);
    const newTask = await prisma.pMTask.create({
      data: {
        machineId: existing.machineId,
        partId: existing.partId,
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
    // Copy checklist items to new task
    if (existing.checklistItems.length > 0) {
      await prisma.pMChecklistItem.createMany({
        data: existing.checklistItems.map(item => ({
          pmTaskId: newTask.id,
          text: item.text,
          sortOrder: item.sortOrder,
        })),
      });
    }
  }

  res.json(enrichTask(completed));
});

// ── Checklist CRUD ────────────────────────────────────────────────────────────

// POST /api/pm-tasks/:id/checklist
router.post('/:id/checklist', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });

  const count = await prisma.pMChecklistItem.count({ where: { pmTaskId: req.params.id } });
  const item = await prisma.pMChecklistItem.create({
    data: { pmTaskId: req.params.id, text: text.trim(), sortOrder: count },
  });
  res.status(201).json(item);
});

// PUT /api/pm-tasks/:id/checklist/:itemId
router.put('/:id/checklist/:itemId', async (req: Request, res: Response) => {
  const { text, sortOrder } = req.body;
  const data: any = {};
  if (text !== undefined) data.text = text.trim();
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const item = await prisma.pMChecklistItem.update({
    where: { id: req.params.itemId },
    data,
  });
  res.json(item);
});

// DELETE /api/pm-tasks/:id/checklist/:itemId
router.delete('/:id/checklist/:itemId', async (req: Request, res: Response) => {
  await prisma.pMChecklistItem.delete({ where: { id: req.params.itemId } });
  res.json({ ok: true });
});

export default router;
