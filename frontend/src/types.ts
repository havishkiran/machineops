// MachineOps TypeScript types matching Prisma models

export type MachineStatus = 'WORKING' | 'CRITICAL' | 'WARNING' | 'IDLE' | 'INACTIVE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type StockStatus = 'OK' | 'LOW_STOCK' | 'OUT';
export type PMState = 'OVERDUE' | 'DUE' | 'UPCOMING' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WOStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Organization {
  id: string;
  name: string;
  unitCode: string;
  whatsapp?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  unitNo?: string | null;
  orgId: string;
  _count?: { machines: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  active: boolean;
  orgId: string;
  org?: Organization;
}

export const ROLES = ['Super Admin', 'Floor Supervisor', 'Shift Supervisor', 'Senior Technician', 'Technician'] as const;
export type UserRole = typeof ROLES[number];

export interface MachinePhoto {
  id: string;
  machineId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Machine {
  id: string;
  name: string;
  code: string;
  machineType?: string | null;
  unitId: string;
  section: string;
  status: MachineStatus;
  manufacturer?: string | null;
  model?: string | null;
  year?: string | null;
  lastPM?: string | null;
  nextPM?: string | null;
  uptime: number;
  orgId: string;
  photos?: MachinePhoto[];
  _count?: { tickets: number };
}

export interface TicketTimeline {
  id: string;
  ticketId: string;
  time: string;
  kind: string;
  icon: string;
  text: string;
  partName?: string | null;
  partQty?: number | null;
  downtime?: string | null;
  createdAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  user: User;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNum: string;
  machineId: string;
  machine: Machine;
  severity: Severity;
  status: TicketStatus;
  type: string;
  title: string;
  description: string;
  raisedById: string;
  raisedBy: User;
  assignedToId?: string | null;
  assignedTo?: User | null;
  downtime?: string | null;
  raisedAt: string;
  updatedAt: string;
  timeline: TicketTimeline[];
  comments: TicketComment[];
}

export interface Part {
  id: string;
  name: string;
  machineId: string;
  machine: Machine;
  spec?: string | null;
  qty: number;
  minQty: number;
  status: StockStatus;
  photoUrl?: string | null;
  supplier?: string | null;
  cost: number;
  criticality: string;
  orgId: string;
  transactions?: PartTransaction[];
}

export interface PartTransaction {
  id: string;
  partId: string;
  type: 'ADD' | 'CONSUME' | 'ADJUST';
  qty: number;
  notes?: string | null;
  userId: string;
  user?: User;
  createdAt: string;
}

export type PMFrequency = 'NONE' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export const FREQ_LABELS: Record<PMFrequency, string> = {
  NONE: 'One-time',
  WEEKLY: 'Weekly',
  FORTNIGHTLY: 'Fortnightly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export interface PMTask {
  id: string;
  machineId: string;
  machine: Machine;
  task: string;
  section: string;
  assigneeId: string;
  assignee: User;
  dueDate: string;
  nextDueDate?: string | null;
  frequency: PMFrequency;
  notifyDaysBefore: number;
  state: PMState;
  overdueBy?: string | null;
  daysUntilDue?: number | null;
  completedAt?: string | null;
}

export interface WorkOrderStep {
  id: string;
  workOrderId: string;
  title: string;
  done: boolean;
  sortOrder: number;
}

export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  partId?: string | null;
  part?: { id: string; name: string; qty: number; status: string; photoUrl?: string | null } | null;
  partName: string;
  qty: number;
  cost: number;
}

export interface WorkOrderLabor {
  id: string;
  workOrderId: string;
  userId: string;
  user: User;
  hours: string;
}

export interface WorkOrder {
  id: string;
  woNum: string;
  ticketId?: string | null;
  ticket?: Ticket | null;
  machineId: string;
  machine: Machine;
  title: string;
  priority: Priority;
  status: WOStatus;
  assigneeId: string;
  assignee: User;
  createdAt: string;
  dueDate?: string | null;
  estimatedHrs?: string | null;
  loggedHrs?: string | null;
  isPM: boolean;
  steps: WorkOrderStep[];
  parts: WorkOrderPart[];
  labor: WorkOrderLabor[];
}

// Status display map — same as prototype STATUS_MAP
export const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  CRITICAL: { cls: 'b-crit', label: 'Critical' },
  critical: { cls: 'b-crit', label: 'Critical' },
  breakdown: { cls: 'b-crit', label: 'Breakdown' },
  out: { cls: 'b-crit', label: 'Out of stock' },
  OUT: { cls: 'b-crit', label: 'Out of stock' },
  down: { cls: 'b-crit', label: 'Down' },
  HIGH: { cls: 'b-high', label: 'High' },
  high: { cls: 'b-high', label: 'High' },
  overdue: { cls: 'b-high', label: 'Overdue' },
  OVERDUE: { cls: 'b-high', label: 'Overdue' },
  WARNING: { cls: 'b-warn', label: 'Warning' },
  warning: { cls: 'b-warn', label: 'Warning' },
  MEDIUM: { cls: 'b-warn', label: 'Medium' },
  medium: { cls: 'b-warn', label: 'Medium' },
  LOW_STOCK: { cls: 'b-warn', label: 'Low stock' },
  low_stock: { cls: 'b-warn', label: 'Low stock' },
  DUE: { cls: 'b-warn', label: 'Due today' },
  due: { cls: 'b-warn', label: 'Due today' },
  IDLE: { cls: 'b-warn', label: 'Idle' },
  idle: { cls: 'b-warn', label: 'Idle' },
  WORKING: { cls: 'b-ok', label: 'Working' },
  working: { cls: 'b-ok', label: 'Working' },
  COMPLETED: { cls: 'b-ok', label: 'Completed' },
  completed: { cls: 'b-ok', label: 'Completed' },
  RESOLVED: { cls: 'b-ok', label: 'Resolved' },
  resolved: { cls: 'b-ok', label: 'Resolved' },
  OK: { cls: 'b-ok', label: 'OK' },
  ok: { cls: 'b-ok', label: 'OK' },
  OPEN: { cls: 'b-info', label: 'Open' },
  open: { cls: 'b-info', label: 'Open' },
  IN_PROGRESS: { cls: 'b-info', label: 'In progress' },
  in_progress: { cls: 'b-info', label: 'In progress' },
  ACKNOWLEDGED: { cls: 'b-info', label: 'Acknowledged' },
  acknowledged: { cls: 'b-info', label: 'Acknowledged' },
  LOW: { cls: 'b-neut', label: 'Low' },
  low: { cls: 'b-neut', label: 'Low' },
  UPCOMING: { cls: 'b-neut', label: 'Upcoming' },
  upcoming: { cls: 'b-neut', label: 'Upcoming' },
  CLOSED: { cls: 'b-neut', label: 'Closed' },
  closed: { cls: 'b-neut', label: 'Closed' },
  INACTIVE: { cls: 'b-neut', label: 'Inactive' },
  inactive: { cls: 'b-neut', label: 'Inactive' },
};

// Unit definitions — now loaded from DB; keep empty array fallback so old imports don't break
export const UNITS: Unit[] = [];

export const fmtINR = (n: number) => '₹' + n.toLocaleString('en-IN');

export interface CustomField {
  id: string;
  entityType: 'MACHINE' | 'PART';
  name: string;
  label: string;
  fieldType: 'text' | 'number' | 'select' | 'date';
  options: string[] | null;
  sortOrder: number;
  required: boolean;
  orgId: string;
  createdAt: string;
  // populated by /values endpoint
  value?: string;
}

// Auth token storage
export const getToken = () => localStorage.getItem('mo_token');
export const setToken = (t: string) => localStorage.setItem('mo_token', t);
export const clearToken = () => localStorage.removeItem('mo_token');
