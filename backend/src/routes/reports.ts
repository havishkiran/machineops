import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/reports/summary
router.get('/summary', async (req: Request, res: Response) => {
  const [tickets, parts, pmTasks, workOrders] = await Promise.all([
    prisma.ticket.findMany(),
    prisma.part.findMany(),
    prisma.pMTask.findMany(),
    prisma.workOrder.findMany({ include: { parts: true, labor: true } }),
  ]);

  const openTickets = tickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status));
  const resolvedTickets = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status));
  const critOpen = openTickets.filter(t => t.severity === 'CRITICAL').length;
  const pmDue = pmTasks.filter(p => p.state === 'OVERDUE' || p.state === 'DUE').length;
  const pmOverdue = pmTasks.filter(p => p.state === 'OVERDUE').length;
  const lowParts = parts.filter(p => p.status === 'LOW_STOCK' || p.status === 'OUT').length;
  const pmCompliance = Math.round(((pmTasks.length - pmOverdue) / (pmTasks.length || 1)) * 100);
  const partsCost = workOrders.reduce((s, wo) => s + wo.parts.reduce((a, p) => a + p.cost * p.qty, 0), 0);

  res.json({
    tickets: {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      acknowledged: tickets.filter(t => t.status === 'ACKNOWLEDGED').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
      closed: tickets.filter(t => t.status === 'CLOSED').length,
      critOpen,
    },
    parts: {
      total: parts.length,
      ok: parts.filter(p => p.status === 'OK').length,
      lowStock: parts.filter(p => p.status === 'LOW_STOCK').length,
      out: parts.filter(p => p.status === 'OUT').length,
      lowParts,
    },
    pm: {
      total: pmTasks.length,
      overdue: pmOverdue,
      due: pmTasks.filter(p => p.state === 'DUE').length,
      upcoming: pmTasks.filter(p => p.state === 'UPCOMING').length,
      completed: pmTasks.filter(p => p.state === 'COMPLETED').length,
      pmDue,
      pmCompliance,
    },
    workOrders: {
      total: workOrders.length,
      open: workOrders.filter(w => w.status === 'OPEN').length,
      inProgress: workOrders.filter(w => w.status === 'IN_PROGRESS').length,
      completed: workOrders.filter(w => w.status === 'COMPLETED').length,
      partsCost,
    },
  });
});

export default router;
