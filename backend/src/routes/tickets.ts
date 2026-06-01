import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
const TicketStatus = { OPEN: 'OPEN', ACKNOWLEDGED: 'ACKNOWLEDGED', IN_PROGRESS: 'IN_PROGRESS', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' } as const;

const router = Router();

const TICKET_INCLUDE = {
  machine: { include: { photos: { where: { isPrimary: true }, take: 1 } } },
  raisedBy: true,
  assignedTo: true,
  timeline: { orderBy: { createdAt: 'asc' as const } },
  comments: { include: { user: true }, orderBy: { createdAt: 'asc' as const } },
  workOrders: {
    select: { id: true, woNum: true, title: true, status: true, priority: true, assigneeId: true, assignee: true, steps: true },
    orderBy: { createdAt: 'desc' as const },
  },
};

// GET /api/tickets
router.get('/', async (req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    include: TICKET_INCLUDE,
    orderBy: { raisedAt: 'desc' },
  });
  res.json(tickets);
});

// GET /api/tickets/:id
router.get('/:id', async (req: Request, res: Response) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: TICKET_INCLUDE,
  });
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  res.json(ticket);
});

// ── Notification routing ─────────────────────────────────────────────────
// Super Admin always receives all alerts regardless of severity.
// CRITICAL  → Super Admin + all Supervisors + all Technicians
// HIGH      → Super Admin + all Supervisors
// MEDIUM/LOW → Super Admin + all Supervisors
async function buildNotifyList(severity: string): Promise<{ text: string; recipients: string[] }> {
  const users = await prisma.user.findMany({ where: { active: true }, select: { name: true, role: true, phone: true } });

  const superAdmins = users.filter(u => u.role === 'Super Admin');
  const supervisors = users.filter(u => u.role === 'Floor Supervisor' || u.role === 'Shift Supervisor');
  const technicians = users.filter(u => u.role === 'Senior Technician' || u.role === 'Technician');

  let recipients: typeof users = [...superAdmins, ...supervisors];

  if (severity === 'CRITICAL') {
    recipients = [...superAdmins, ...supervisors, ...technicians];
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = recipients.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });

  const names = unique.map(r => r.name).join(', ');
  return { text: `WhatsApp sent → ${names || 'Super Admin'}`, recipients: unique.map(r => r.name) };
}

// POST /api/tickets
router.post('/', async (req: Request, res: Response) => {
  const { machineId, severity, type, title, description, raisedById, orgId } = req.body;

  // Generate ticket number
  const count = await prisma.ticket.count();
  const ticketNum = `TKT-2025-${String(count + 43).padStart(4, '0')}`;
  const hhmm = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const ticket = await prisma.ticket.create({
    data: {
      ticketNum,
      machineId,
      severity,
      type,
      title,
      description,
      raisedById,
      status: TicketStatus.OPEN,
    },
    include: TICKET_INCLUDE,
  });

  // Build notification recipient list based on severity routing rules
  const { text: notifyText } = await buildNotifyList(severity);

  // Add initial timeline entries
  await prisma.ticketTimeline.createMany({
    data: [
      { ticketId: ticket.id, time: hhmm, kind: severity === 'CRITICAL' ? 'crit' : severity === 'HIGH' ? 'high' : 'warn', icon: 'alert', text: `Ticket raised` },
      { ticketId: ticket.id, time: hhmm, kind: 'info', icon: 'whatsapp', text: notifyText },
    ],
  });

  const full = await prisma.ticket.findUnique({ where: { id: ticket.id }, include: TICKET_INCLUDE });
  res.status(201).json(full);
});

// POST /api/tickets/:id/acknowledge
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
  const { userId, userName } = req.body;
  const hhmm = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  await prisma.ticket.update({
    where: { id: req.params.id },
    data: { status: TicketStatus.ACKNOWLEDGED, assignedToId: userId },
  });
  await prisma.ticketTimeline.create({
    data: { ticketId: req.params.id, time: hhmm, kind: 'info', icon: 'check', text: `Acknowledged by ${userName || 'User'}` },
  });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: TICKET_INCLUDE });
  res.json(ticket);
});

// POST /api/tickets/:id/startwork
router.post('/:id/startwork', async (req: Request, res: Response) => {
  const hhmm = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  await prisma.ticket.update({ where: { id: req.params.id }, data: { status: TicketStatus.IN_PROGRESS } });
  await prisma.ticketTimeline.create({
    data: { ticketId: req.params.id, time: hhmm, kind: 'warn', icon: 'wrench', text: 'Work started' },
  });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: TICKET_INCLUDE });
  res.json(ticket);
});

// POST /api/tickets/:id/resolve
router.post('/:id/resolve', async (req: Request, res: Response) => {
  const { note, partName, partQty } = req.body;
  const hhmm = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const downtime = '1h 48m';

  await prisma.ticket.update({ where: { id: req.params.id }, data: { status: TicketStatus.RESOLVED, downtime } });
  await prisma.ticketTimeline.create({
    data: {
      ticketId: req.params.id, time: hhmm, kind: 'ok', icon: 'checkcircle',
      text: `Resolved — \u201c${note || 'Issue fixed.'}\u201d`,
      partName: partName || null, partQty: partQty || null, downtime,
    },
  });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: TICKET_INCLUDE });
  res.json(ticket);
});

// POST /api/tickets/:id/assign
router.post('/:id/assign', async (req: Request, res: Response) => {
  const { userId, userName } = req.body;
  const hhmm = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  await prisma.ticket.update({ where: { id: req.params.id }, data: { assignedToId: userId } });
  await prisma.ticketTimeline.create({
    data: { ticketId: req.params.id, time: hhmm, kind: 'info', icon: 'user', text: `Assigned to ${userName}` },
  });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: TICKET_INCLUDE });
  res.json(ticket);
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', async (req: Request, res: Response) => {
  const { userId, text } = req.body;
  const comment = await prisma.ticketComment.create({
    data: { ticketId: req.params.id, userId, text },
    include: { user: true },
  });
  res.status(201).json(comment);
});

export default router;
