import cron from 'node-cron';
import { prisma } from './prisma';

// Roles that can be auto-assigned PM work orders (pick first available supervisor)
const SUPERVISOR_ROLES = ['Floor Supervisor', 'Shift Supervisor', 'Super Admin'];

function fmtDueDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

async function createPMWorkOrders() {
  console.log('[cron] Checking PM tasks due within 2 days...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in2Days = new Date(today);
  in2Days.setDate(in2Days.getDate() + 2);
  in2Days.setHours(23, 59, 59, 999);

  // Find PM tasks due in the next 2 days that are not completed
  const dueSoon = await prisma.pMTask.findMany({
    where: {
      state: { not: 'COMPLETED' },
      nextDueDate: { gte: today, lte: in2Days },
    },
    include: { machine: true, assignee: true },
  });

  if (dueSoon.length === 0) {
    console.log('[cron] No PM tasks due soon.');
    return;
  }

  for (const task of dueSoon) {
    // Check if a WO already exists for this PM task
    const existing = await prisma.workOrder.findFirst({
      where: { pmTaskId: task.id, status: { not: 'CANCELLED' } },
    });
    if (existing) continue;

    // Find a supervisor to assign to (fallback to PM task assignee)
    const supervisor = await prisma.user.findFirst({
      where: { role: { in: SUPERVISOR_ROLES }, active: true, orgId: task.machine.orgId },
    });
    const assigneeId = supervisor?.id ?? task.assigneeId;

    // Count existing WOs to generate number
    const count = await prisma.workOrder.count();
    const woNum = `WO-${new Date().getFullYear()}-${String(count + 114).padStart(4, '0')}`;

    const dueStr = task.nextDueDate ? fmtDueDate(task.nextDueDate) : '';

    await prisma.workOrder.create({
      data: {
        woNum,
        pmTaskId: task.id,
        machineId: task.machineId,
        title: `PM — ${task.task} (${task.machine.name})`,
        priority: 'MEDIUM',
        status: 'OPEN',
        assigneeId,
        dueDate: dueStr,
        estimatedHrs: '1',
        isPM: true,
        steps: {
          create: [
            { title: task.task, done: false, sortOrder: 0 },
            { title: 'Sign off & update PM log', done: false, sortOrder: 1 },
          ],
        },
      },
    });

    console.log(`[cron] Created WO ${woNum} for PM task: ${task.task} (${task.machine.name})`);
  }
}

export function startCronJobs() {
  // Run daily at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    try {
      await createPMWorkOrders();
    } catch (err) {
      console.error('[cron] Error in PM work order job:', err);
    }
  });

  // Also run once on startup after a short delay (for dev convenience)
  setTimeout(async () => {
    try {
      await createPMWorkOrders();
    } catch (err) {
      console.error('[cron] Startup PM check error:', err);
    }
  }, 5000);

  console.log('[cron] PM work order scheduler started.');
}
