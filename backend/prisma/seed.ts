import { PrismaClient } from '@prisma/client';

// String constants (enums stored as String in SQLite)
const MachineStatus = { WORKING: 'WORKING', CRITICAL: 'CRITICAL', WARNING: 'WARNING', IDLE: 'IDLE', INACTIVE: 'INACTIVE' } as const;
const Severity      = { CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' } as const;
const TicketStatus  = { OPEN: 'OPEN', ACKNOWLEDGED: 'ACKNOWLEDGED', IN_PROGRESS: 'IN_PROGRESS', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' } as const;
const StockStatus   = { OK: 'OK', LOW_STOCK: 'LOW_STOCK', OUT: 'OUT' } as const;
const PMState       = { OVERDUE: 'OVERDUE', DUE: 'DUE', UPCOMING: 'UPCOMING', COMPLETED: 'COMPLETED' } as const;
const Priority      = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' } as const;
const WOStatus      = { OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' } as const;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-rmw' },
    update: {},
    create: {
      id: 'org-rmw',
      name: 'Rajashree Match Works',
      unitCode: 'TVPM',
      whatsapp: '+91 81220 57147',
    },
  });

  // Create units
  const unitTvpm = await prisma.unit.upsert({ where: { id: 'tvpm' }, update: {}, create: { id: 'tvpm', code: 'TVPM', name: 'Tiruppur Works', unitNo: 'U2', orgId: org.id } });
  const unitCtpi = await prisma.unit.upsert({ where: { id: 'ctpi' }, update: {}, create: { id: 'ctpi', code: 'CTPI', name: 'Coimbatore Plant', unitNo: 'U1', orgId: org.id } });
  const unitVypi = await prisma.unit.upsert({ where: { id: 'vypi' }, update: {}, create: { id: 'vypi', code: 'VYPI', name: 'Veerapandi Unit', unitNo: 'U3', orgId: org.id } });

  // suppress unused variable warnings
  void unitTvpm; void unitCtpi; void unitVypi;

  // Create users
  const passwordHash = await bcrypt.hash('demo123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@tvpm.co.in' },
    update: {},
    create: { id: 'user-admin', name: 'Admin', email: 'admin@tvpm.co.in', passwordHash: adminHash, role: 'Super Admin', active: true, orgId: org.id },
  });

  const rajan = await prisma.user.upsert({
    where: { email: 'rajan@tvpm.co.in' },
    update: {},
    create: { id: 'user-rajan', name: 'Rajan Kumar', email: 'rajan@tvpm.co.in', passwordHash, role: 'Technician', active: true, orgId: org.id },
  });
  const murugan = await prisma.user.upsert({
    where: { email: 'murugan@tvpm.co.in' },
    update: {},
    create: { id: 'user-murugan', name: 'Murugan S.', email: 'murugan@tvpm.co.in', passwordHash, role: 'Senior Technician', active: true, orgId: org.id },
  });
  const selvam = await prisma.user.upsert({
    where: { email: 'selvam@tvpm.co.in' },
    update: {},
    create: { id: 'user-selvam', name: 'Selvam R.', email: 'selvam@tvpm.co.in', passwordHash, role: 'Technician', active: true, orgId: org.id },
  });
  const havish = await prisma.user.upsert({
    where: { email: 'havish@tvpm.co.in' },
    update: {},
    create: { id: 'user-havish', name: 'Havish', email: 'havish@tvpm.co.in', passwordHash, role: 'Shift Supervisor', active: true, orgId: org.id },
  });
  const ganesh = await prisma.user.upsert({
    where: { email: 'ganesh@tvpm.co.in' },
    update: {},
    create: { id: 'user-ganesh', name: 'Ganesh M.', email: 'ganesh@tvpm.co.in', passwordHash, role: 'Floor Supervisor', active: true, orgId: org.id },
  });

  // Create machines
  const machines = [
    { id: 'm1', name: 'Dipping Machine 3', code: 'U2-TVPM/DIP-3/3', unitId: 'tvpm', section: 'Dipping', status: MachineStatus.WORKING, manufacturer: 'Sussman', model: 'DX-300', year: '2019', lastPM: '10 Feb', nextPM: '16 Feb', uptime: 96 },
    { id: 'm2', name: 'Inner Machine 3', code: 'U2-TVPM/INR-3/1', unitId: 'tvpm', section: 'Knitting', status: MachineStatus.CRITICAL, manufacturer: 'Mayer & Cie', model: 'Relanit 3.2', year: '2017', lastPM: '02 Feb', nextPM: 'Overdue', uptime: 71 },
    { id: 'm3', name: 'Gross Pack 3', code: 'U2-TVPM/GPK-3/2', unitId: 'tvpm', section: 'Packing', status: MachineStatus.WARNING, manufacturer: 'Bosch', model: 'Pack-201', year: '2020', lastPM: '28 Jan', nextPM: 'Today', uptime: 88 },
    { id: 'm4', name: 'Dozen Machine 2', code: 'U2-TVPM/DZN-2/4', unitId: 'tvpm', section: 'Packing', status: MachineStatus.WORKING, manufacturer: 'Brother', model: 'BAS-360', year: '2018', lastPM: '05 Feb', nextPM: '19 Feb', uptime: 94 },
    { id: 'm5', name: 'Compressor Unit 1', code: 'U1-CTPI/CMP-1/1', unitId: 'ctpi', section: 'Utilities', status: MachineStatus.WORKING, manufacturer: 'Atlas Copco', model: 'GA-22', year: '2021', lastPM: '12 Feb', nextPM: '26 Feb', uptime: 99 },
    { id: 'm6', name: 'Halfline 1', code: 'U1-CTPI/HLF-1/2', unitId: 'ctpi', section: 'Finishing', status: MachineStatus.CRITICAL, manufacturer: '—', model: '—', year: '—', lastPM: '30 Jan', nextPM: 'Overdue', uptime: 64 },
    { id: 'm7', name: 'Boarding Machine 2', code: 'U3-VYPI/BRD-2/1', unitId: 'vypi', section: 'Finishing', status: MachineStatus.WARNING, manufacturer: 'Tecnopea', model: 'Form-2', year: '2016', lastPM: '01 Feb', nextPM: 'Today', uptime: 90 },
    { id: 'm8', name: 'Dipping Machine 2', code: 'U2-TVPM/DIP-2/2', unitId: 'tvpm', section: 'Dipping', status: MachineStatus.WORKING, manufacturer: 'Sussman', model: 'DX-300', year: '2019', lastPM: '08 Feb', nextPM: '22 Feb', uptime: 97 },
    { id: 'm9', name: 'Winding Machine 5', code: 'U3-VYPI/WND-5/3', unitId: 'vypi', section: 'Knitting', status: MachineStatus.IDLE, manufacturer: 'Savio', model: 'Polar-E', year: '2015', lastPM: '06 Feb', nextPM: '20 Feb', uptime: 82 },
    { id: 'm10', name: 'Control Panel A', code: 'U2-TVPM/PNL-A/1', unitId: 'tvpm', section: 'Utilities', status: MachineStatus.WORKING, manufacturer: 'Siemens', model: 'S7-1200', year: '2022', lastPM: '11 Feb', nextPM: '25 Feb', uptime: 100 },
    { id: 'm11', name: 'Sewing Line 4', code: 'U1-CTPI/SEW-4/2', unitId: 'ctpi', section: 'Stitching', status: MachineStatus.WORKING, manufacturer: 'Juki', model: 'DDL-9000', year: '2020', lastPM: '09 Feb', nextPM: '23 Feb', uptime: 93 },
    { id: 'm12', name: 'Calender Roller 1', code: 'U3-VYPI/CAL-1/1', unitId: 'vypi', section: 'Finishing', status: MachineStatus.WORKING, manufacturer: 'Monforts', model: 'Mont-X', year: '2018', lastPM: '07 Feb', nextPM: '21 Feb', uptime: 91 },
  ];

  const photoMap: Record<string, string> = {
    m1: '/assets/m/01-cap.jpg',
    m2: '/assets/m/02-cap.jpg',
    m3: '/assets/m/03-cap.jpg',
    m4: '/assets/m/04-cap.jpg',
    m5: '/assets/m/05-cap.jpg',
    m8: '/assets/m/07-cap.jpg',
    m9: '/assets/m/08-cap.jpg',
    m10: '/assets/m/09-cap.jpg',
    m7: '/assets/m/06-cap.jpg',
  };

  for (const m of machines) {
    const machine = await prisma.machine.upsert({
      where: { code: m.code },
      update: {},
      create: { ...m, orgId: org.id },
    });
    if (photoMap[m.id]) {
      await prisma.machinePhoto.upsert({
        where: { id: `photo-${m.id}` },
        update: {},
        create: { id: `photo-${m.id}`, machineId: machine.id, url: photoMap[m.id], isPrimary: true },
      });
    }
  }

  // Create parts (no machineId — use PartMachine junction)
  const partsData = [
    { id: 'p1', name: 'A30 Belt', partNumber: 'PRT-2025-0001', qty: 2, minQty: 5, status: StockStatus.LOW_STOCK, spec: 'A-section, 1320mm', supplier: 'Fenner India', vendorName: 'Fenner India Ltd', vendorPhone: '+91 422 2220000', category: 'Belt', cost: 480, criticality: 'High' },
    { id: 'p2', name: 'Nylon Brush', partNumber: 'PRT-2025-0002', qty: 0, minQty: 2, status: StockStatus.OUT, spec: 'Ø80mm, 5-row', supplier: 'Perfect Brushes', vendorName: 'Perfect Brushes Co.', vendorPhone: '+91 44 2345678', category: 'Other', cost: 1250, criticality: 'Critical' },
    { id: 'p3', name: 'Drive Belt', partNumber: 'PRT-2025-0003', qty: 8, minQty: 3, status: StockStatus.OK, spec: 'B-section, 1700mm', supplier: 'Fenner India', vendorName: 'Fenner India Ltd', vendorPhone: '+91 422 2220000', category: 'Belt', cost: 620, criticality: 'Medium' },
    { id: 'p4', name: 'Drive Chain', partNumber: 'PRT-2025-0004', qty: 8, minQty: 3, status: StockStatus.OK, spec: '1/2" pitch, 80 links', supplier: 'Diamond Chain', vendorName: 'Diamond Chain Mfg', vendorPhone: '+91 80 2345678', category: 'Chain', cost: 1840, criticality: 'Medium' },
    { id: 'p5', name: 'Ball Bearing 6204', partNumber: 'PRT-2025-0005', qty: 3, minQty: 6, status: StockStatus.LOW_STOCK, spec: '6204-2RS, 20×47', supplier: 'SKF', vendorName: 'SKF India', vendorPhone: '+91 20 6602000', category: 'Bearing', cost: 210, criticality: 'High' },
    { id: 'p6', name: 'Air Filter Element', partNumber: 'PRT-2025-0006', qty: 1, minQty: 4, status: StockStatus.LOW_STOCK, spec: 'PD-220, pleated', supplier: 'Atlas Copco', vendorName: 'Atlas Copco India', vendorPhone: '+91 80 2294000', category: 'Filter', cost: 2400, criticality: 'High' },
    { id: 'p7', name: 'Spray Nozzle', partNumber: 'PRT-2025-0007', qty: 0, minQty: 3, status: StockStatus.OUT, spec: '1.2mm brass', supplier: 'Spraying Systems', vendorName: 'Spraying Systems India', vendorPhone: '+91 44 2890000', category: 'Other', cost: 340, criticality: 'Critical' },
    { id: 'p8', name: 'Timing Belt', partNumber: 'PRT-2025-0008', qty: 6, minQty: 2, status: StockStatus.OK, spec: 'HTD 5M, 800mm', supplier: 'Gates India', vendorName: 'Gates India Pvt Ltd', vendorPhone: '+91 80 6720000', category: 'Belt', cost: 560, criticality: 'Low' },
    { id: 'p9', name: 'Solenoid Valve', partNumber: 'PRT-2025-0009', qty: 12, minQty: 4, status: StockStatus.OK, spec: '1/4" 24VDC', supplier: 'Festo', vendorName: 'Festo India', vendorPhone: '+91 80 2294444', category: 'Valve', cost: 1890, criticality: 'Medium' },
    { id: 'p10', name: 'Needle Set', partNumber: 'PRT-2025-0010', qty: 4, minQty: 10, status: StockStatus.LOW_STOCK, spec: 'DBx1 #14', supplier: 'Groz-Beckert', vendorName: 'Groz-Beckert India', vendorPhone: '+91 11 4160000', category: 'Other', cost: 95, criticality: 'Low' },
  ];

  // machine associations for each part: partId → [machineId, ...]
  const partMachineMap: Record<string, string[]> = {
    p1: ['m3', 'm8'],    // A30 Belt — used on Gross Pack 3 and Dipping Machine 2
    p2: ['m6'],           // Nylon Brush — Halfline 1
    p3: ['m8', 'm1'],    // Drive Belt — Dipping 2 and Dipping 3
    p4: ['m1'],           // Drive Chain — Dipping Machine 3
    p5: ['m2', 'm9'],    // Ball Bearing — Inner Machine 3 and Winding Machine 5
    p6: ['m5'],           // Air Filter — Compressor Unit 1
    p7: ['m1'],           // Spray Nozzle — Dipping Machine 3
    p8: ['m4'],           // Timing Belt — Dozen Machine 2
    p9: ['m10'],          // Solenoid Valve — Control Panel A
    p10: ['m11'],         // Needle Set — Sewing Line 4
  };

  for (const p of partsData) {
    const partRecord = { ...p, orgId: org.id };
    await prisma.part.upsert({
      where: { id: p.id },
      update: partRecord,
      create: partRecord,
    });
    // Create machine associations
    const machineIds = partMachineMap[p.id] || [];
    for (const machineId of machineIds) {
      await prisma.partMachine.upsert({
        where: { partId_machineId: { partId: p.id, machineId } },
        update: {},
        create: { partId: p.id, machineId },
      });
    }
  }

  // Seed default part categories
  const categoryNames = ['Belt', 'Chain', 'Bearing', 'Filter', 'Valve', 'Shaft', 'Gear', 'Seal', 'Other'];
  for (const name of categoryNames) {
    await prisma.partCategory.upsert({
      where: { name_orgId: { name, orgId: org.id } },
      update: {},
      create: { name, orgId: org.id },
    });
  }

  // Create tickets
  const ticketsData = [
    {
      id: 'TKT-2025-0042', ticketNum: 'TKT-2025-0042', machineId: 'm2',
      severity: Severity.CRITICAL, status: TicketStatus.OPEN, type: 'Breakdown',
      title: 'Drive program error — machine stopped mid-cycle',
      description: 'Machine threw a drive fault code and stopped during the dipping cycle. Cannot reset from HMI. Production line halted.',
      raisedById: rajan.id, assignedToId: murugan.id, downtime: null,
      timeline: [
        { time: '09:42', kind: 'crit', icon: 'alert', text: 'Ticket raised by Rajan Kumar' },
        { time: '09:42', kind: 'info', icon: 'whatsapp', text: 'WhatsApp sent → Supervisor, 3 technicians' },
      ],
      comments: [],
    },
    {
      id: 'TKT-2025-0041', ticketNum: 'TKT-2025-0041', machineId: 'm6',
      severity: Severity.CRITICAL, status: TicketStatus.IN_PROGRESS, type: 'Breakdown',
      title: 'Heating element not reaching set temperature',
      description: 'Finishing line not hitting 180°C set point. Suspect failed heating coil.',
      raisedById: selvam.id, assignedToId: murugan.id, downtime: null,
      timeline: [
        { time: '08:10', kind: 'crit', icon: 'alert', text: 'Ticket raised by Selvam R.' },
        { time: '08:12', kind: 'info', icon: 'whatsapp', text: 'WhatsApp sent → Supervisor, 3 technicians' },
        { time: '08:30', kind: 'info', icon: 'check', text: 'Acknowledged by Murugan S.' },
        { time: '08:48', kind: 'warn', icon: 'wrench', text: 'Work started' },
      ],
      comments: [{ userId: murugan.id, text: 'Coil resistance is out of spec. Need a replacement element.' }],
    },
    {
      id: 'TKT-2025-0040', ticketNum: 'TKT-2025-0040', machineId: 'm3',
      severity: Severity.HIGH, status: TicketStatus.ACKNOWLEDGED, type: 'Repair needed',
      title: 'Conveyor belt slipping under load',
      description: 'Pack conveyor belt slips when boxes stack up. Belt tension low.',
      raisedById: rajan.id, assignedToId: selvam.id, downtime: null,
      timeline: [
        { time: '07:30', kind: 'high', icon: 'alert', text: 'Ticket raised by Rajan Kumar' },
        { time: '07:31', kind: 'info', icon: 'whatsapp', text: 'WhatsApp sent → Supervisor, 3 technicians' },
        { time: '07:52', kind: 'info', icon: 'check', text: 'Acknowledged by Selvam R.' },
      ],
      comments: [],
    },
    {
      id: 'TKT-2025-0039', ticketNum: 'TKT-2025-0039', machineId: 'm9',
      severity: Severity.MEDIUM, status: TicketStatus.OPEN, type: 'Inspection',
      title: 'Unusual noise from winding spindle',
      description: 'Operator reports grinding noise at high speed. Needs inspection.',
      raisedById: selvam.id, assignedToId: null, downtime: null,
      timeline: [
        { time: '16:20', kind: 'warn', icon: 'alert', text: 'Ticket raised by Selvam R.' },
        { time: '16:20', kind: 'info', icon: 'whatsapp', text: 'WhatsApp sent → Supervisor' },
      ],
      comments: [],
    },
    {
      id: 'TKT-2025-0038', ticketNum: 'TKT-2025-0038', machineId: 'm1',
      severity: Severity.HIGH, status: TicketStatus.RESOLVED, type: 'Breakdown',
      title: 'Drive belt snapped during start-up',
      description: 'Belt failure on cold start. Replaced with spare.',
      raisedById: rajan.id, assignedToId: murugan.id, downtime: '1h 48m',
      timeline: [
        { time: '11:05', kind: 'high', icon: 'alert', text: 'Ticket raised by Rajan Kumar' },
        { time: '11:06', kind: 'info', icon: 'whatsapp', text: 'WhatsApp sent → Supervisor, 3 technicians' },
        { time: '11:18', kind: 'info', icon: 'check', text: 'Acknowledged by Murugan S.' },
        { time: '11:30', kind: 'warn', icon: 'wrench', text: 'Work started' },
        { time: '12:53', kind: 'ok', icon: 'checkcircle', text: 'Resolved — \u201cReplaced drive belt.\u201d', partName: 'A30 Belt', partQty: 1, downtime: '1h 48m' },
      ],
      comments: [],
    },
    {
      id: 'TKT-2025-0037', ticketNum: 'TKT-2025-0037', machineId: 'm4',
      severity: Severity.LOW, status: TicketStatus.CLOSED, type: 'Development',
      title: 'Add guard rail to feed table',
      description: 'Safety improvement request from floor.',
      raisedById: ganesh.id, assignedToId: selvam.id, downtime: null,
      timeline: [
        { time: '14:00', kind: 'neut', icon: 'alert', text: 'Ticket raised by Ganesh M.' },
        { time: '15:20', kind: 'ok', icon: 'checkcircle', text: 'Resolved — guard rail fitted' },
        { time: '15:25', kind: 'neut', icon: 'check', text: 'Closed' },
      ],
      comments: [],
    },
  ];

  for (const t of ticketsData) {
    const { timeline, comments, ...ticketData } = t;
    const ticket = await prisma.ticket.upsert({
      where: { ticketNum: t.ticketNum },
      update: {},
      create: {
        id: ticketData.id,
        ticketNum: ticketData.ticketNum,
        machineId: ticketData.machineId,
        severity: ticketData.severity,
        status: ticketData.status,
        type: ticketData.type,
        title: ticketData.title,
        description: ticketData.description,
        raisedById: ticketData.raisedById,
        assignedToId: ticketData.assignedToId,
        downtime: ticketData.downtime,
      },
    });

    for (let i = 0; i < timeline.length; i++) {
      const e = timeline[i];
      await prisma.ticketTimeline.upsert({
        where: { id: `tl-${ticket.id}-${i}` },
        update: {},
        create: {
          id: `tl-${ticket.id}-${i}`,
          ticketId: ticket.id,
          time: e.time,
          kind: e.kind,
          icon: e.icon,
          text: e.text,
          partName: (e as any).partName || null,
          partQty: (e as any).partQty || null,
          downtime: (e as any).downtime || null,
        },
      });
    }

    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      await prisma.ticketComment.upsert({
        where: { id: `tc-${ticket.id}-${i}` },
        update: {},
        create: {
          id: `tc-${ticket.id}-${i}`,
          ticketId: ticket.id,
          userId: c.userId,
          text: c.text,
        },
      });
    }
  }

  // Create PM tasks
  const pmTasksData = [
    { id: 'pm1', machineId: 'm4', task: 'Weekly belt inspection', section: 'Packing', assigneeId: murugan.id, dueDate: '10 Feb', state: PMState.OVERDUE, overdueBy: '3 days' },
    { id: 'pm2', machineId: 'm2', task: 'Lubrication & needle check', section: 'Knitting', assigneeId: rajan.id, dueDate: '11 Feb', state: PMState.OVERDUE, overdueBy: '2 days' },
    { id: 'pm3', machineId: 'm6', task: 'Heating element calibration', section: 'Finishing', assigneeId: selvam.id, dueDate: '12 Feb', state: PMState.OVERDUE, overdueBy: '1 day' },
    { id: 'pm4', machineId: 'm3', task: 'Conveyor tension & alignment', section: 'Packing', assigneeId: murugan.id, dueDate: 'Today', state: PMState.DUE, overdueBy: null },
    { id: 'pm5', machineId: 'm7', task: 'Form pressure test', section: 'Finishing', assigneeId: selvam.id, dueDate: 'Today', state: PMState.DUE, overdueBy: null },
    { id: 'pm6', machineId: 'm1', task: 'Quarterly full service', section: 'Dipping', assigneeId: murugan.id, dueDate: '16 Feb', state: PMState.UPCOMING, overdueBy: null },
    { id: 'pm7', machineId: 'm5', task: 'Air filter replacement', section: 'Utilities', assigneeId: rajan.id, dueDate: '26 Feb', state: PMState.UPCOMING, overdueBy: null },
    { id: 'pm8', machineId: 'm8', task: 'Pump seal inspection', section: 'Dipping', assigneeId: murugan.id, dueDate: '22 Feb', state: PMState.UPCOMING, overdueBy: null },
    { id: 'pm9', machineId: 'm10', task: 'PLC backup & I/O test', section: 'Utilities', assigneeId: selvam.id, dueDate: '25 Feb', state: PMState.UPCOMING, overdueBy: null },
    { id: 'pm10', machineId: 'm11', task: 'Hook timing adjustment', section: 'Stitching', assigneeId: rajan.id, dueDate: '23 Feb', state: PMState.UPCOMING, overdueBy: null },
    { id: 'pm11', machineId: 'm12', task: 'Roller bearing greasing', section: 'Finishing', assigneeId: murugan.id, dueDate: '21 Feb', state: PMState.UPCOMING, overdueBy: null },
    { id: 'pm12', machineId: 'm9', task: 'Spindle balance check', section: 'Knitting', assigneeId: selvam.id, dueDate: '20 Feb', state: PMState.UPCOMING, overdueBy: null },
  ];

  for (const pm of pmTasksData) {
    await prisma.pMTask.upsert({
      where: { id: pm.id },
      update: {},
      create: pm,
    });
  }

  // Create work orders
  const workOrdersData = [
    {
      id: 'WO-2025-0118', woNum: 'WO-2025-0118', ticketId: 'TKT-2025-0041', machineId: 'm6',
      title: 'Replace heating element & recalibrate', priority: Priority.HIGH, status: WOStatus.IN_PROGRESS,
      assigneeId: murugan.id, dueDate: '14 Feb, 02:00 PM', estimatedHrs: '3h', loggedHrs: '1h 25m', isPM: false,
      steps: [
        { title: 'Isolate power & lock out', done: true, sortOrder: 0 },
        { title: 'Remove failed heating coil', done: true, sortOrder: 1 },
        { title: 'Fit replacement element', done: false, sortOrder: 2 },
        { title: 'Recalibrate to 180°C set point', done: false, sortOrder: 3 },
        { title: 'Test run 2 cycles & sign off', done: false, sortOrder: 4 },
      ],
      parts: [{ partName: 'Nylon Brush', qty: 1, cost: 1250 }],
      labor: [{ userId: murugan.id, hours: '1h 25m' }],
    },
    {
      id: 'WO-2025-0117', woNum: 'WO-2025-0117', ticketId: 'TKT-2025-0040', machineId: 'm3',
      title: 'Re-tension & align pack conveyor belt', priority: Priority.MEDIUM, status: WOStatus.OPEN,
      assigneeId: selvam.id, dueDate: '14 Feb, 04:00 PM', estimatedHrs: '1h 30m', loggedHrs: '—', isPM: false,
      steps: [
        { title: 'Inspect belt & pulleys', done: false, sortOrder: 0 },
        { title: 'Adjust tensioner', done: false, sortOrder: 1 },
        { title: 'Re-align tracking', done: false, sortOrder: 2 },
        { title: 'Load test', done: false, sortOrder: 3 },
      ],
      parts: [],
      labor: [],
    },
    {
      id: 'WO-2025-0116', woNum: 'WO-2025-0116', ticketId: null, machineId: 'm4',
      title: 'PM — weekly belt inspection (Dozen Machine 2)', priority: Priority.LOW, status: WOStatus.OPEN,
      assigneeId: murugan.id, dueDate: '14 Feb, 06:00 PM', estimatedHrs: '45m', loggedHrs: '—', isPM: true,
      steps: [
        { title: 'Visual inspection', done: false, sortOrder: 0 },
        { title: 'Tension check', done: false, sortOrder: 1 },
        { title: 'Lubricate', done: false, sortOrder: 2 },
      ],
      parts: [],
      labor: [],
    },
    {
      id: 'WO-2025-0115', woNum: 'WO-2025-0115', ticketId: 'TKT-2025-0038', machineId: 'm1',
      title: 'Replace snapped drive belt', priority: Priority.HIGH, status: WOStatus.COMPLETED,
      assigneeId: murugan.id, dueDate: '13 Feb, 01:00 PM', estimatedHrs: '1h', loggedHrs: '1h 48m', isPM: false,
      steps: [
        { title: 'Isolate & lock out', done: true, sortOrder: 0 },
        { title: 'Remove damaged belt', done: true, sortOrder: 1 },
        { title: 'Fit A30 belt & tension', done: true, sortOrder: 2 },
        { title: 'Test run & sign off', done: true, sortOrder: 3 },
      ],
      parts: [{ partName: 'A30 Belt', qty: 1, cost: 480 }],
      labor: [{ userId: murugan.id, hours: '1h 48m' }],
    },
    {
      id: 'WO-2025-0114', woNum: 'WO-2025-0114', ticketId: 'TKT-2025-0037', machineId: 'm4',
      title: 'Fit guard rail to feed table', priority: Priority.LOW, status: WOStatus.COMPLETED,
      assigneeId: selvam.id, dueDate: '12 Feb, 05:00 PM', estimatedHrs: '2h', loggedHrs: '1h 20m', isPM: false,
      steps: [
        { title: 'Measure & cut rail', done: true, sortOrder: 0 },
        { title: 'Drill & mount', done: true, sortOrder: 1 },
        { title: 'Safety check', done: true, sortOrder: 2 },
      ],
      parts: [],
      labor: [{ userId: selvam.id, hours: '1h 20m' }],
    },
  ];

  for (const wo of workOrdersData) {
    const { steps, parts, labor, ...woData } = wo;
    const workOrder = await prisma.workOrder.upsert({
      where: { woNum: wo.woNum },
      update: {},
      create: {
        id: woData.id,
        woNum: woData.woNum,
        ticketId: woData.ticketId,
        machineId: woData.machineId,
        title: woData.title,
        priority: woData.priority,
        status: woData.status,
        assigneeId: woData.assigneeId,
        dueDate: woData.dueDate,
        estimatedHrs: woData.estimatedHrs,
        loggedHrs: woData.loggedHrs,
        isPM: woData.isPM,
      },
    });

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      await prisma.workOrderStep.upsert({
        where: { id: `wos-${workOrder.id}-${i}` },
        update: {},
        create: { id: `wos-${workOrder.id}-${i}`, workOrderId: workOrder.id, title: s.title, done: s.done, sortOrder: s.sortOrder },
      });
    }
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      await prisma.workOrderPart.upsert({
        where: { id: `wop-${workOrder.id}-${i}` },
        update: {},
        create: { id: `wop-${workOrder.id}-${i}`, workOrderId: workOrder.id, partName: p.partName, qty: p.qty, cost: p.cost },
      });
    }
    for (let i = 0; i < labor.length; i++) {
      const l = labor[i];
      await prisma.workOrderLabor.upsert({
        where: { id: `wol-${workOrder.id}-${i}` },
        update: {},
        create: { id: `wol-${workOrder.id}-${i}`, workOrderId: workOrder.id, userId: l.userId, hours: l.hours },
      });
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
