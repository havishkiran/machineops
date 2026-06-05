import { create } from 'zustand';
import { api } from './api';
import { Ticket, Part, Machine, PMTask, PMChecklistItem, WorkOrder, User, Organization, CustomField, Unit, PartCategory, setToken, clearToken, getToken } from './types';

export interface RouteState {
  screen: string;
  params: Record<string, any>;
}

export interface Toast {
  id: string;
  text: string;
  icon: string;
}

interface StoreState {
  // Auth
  authed: boolean;
  me: User | null;

  // Route
  route: RouteState;

  // Data
  org: Organization | null;
  machines: Machine[];
  tickets: Ticket[];
  parts: Part[];
  pmTasks: PMTask[];
  workOrders: WorkOrder[];
  customFields: CustomField[];
  units: Unit[];
  users: User[];
  partCategories: PartCategory[];

  // UI
  toasts: Toast[];
  loading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  nav: (screen: string, params?: Record<string, any>) => void;
  toast: (text: string, icon?: string) => void;
  loadAll: () => Promise<void>;

  // Ticket mutations
  acknowledgeTicket: (id: string) => Promise<void>;
  startWork: (id: string) => Promise<void>;
  resolveTicket: (id: string, note: string, part: Part | null) => Promise<void>;
  assignTicket: (id: string, userId: string, userName: string) => Promise<void>;
  addComment: (id: string, text: string) => Promise<void>;
  createTicket: (data: { machineId?: string | null; category?: string; severity: string; type: string; desc: string }) => Promise<string>;

  // Part mutations
  consumePart: (id: string, qty: number) => Promise<void>;
  addStock: (id: string, qty: number) => Promise<void>;

  // Part CRUD
  createPart: (data: Partial<Part>) => Promise<Part>;
  updatePart: (id: string, data: Partial<Part>) => Promise<Part>;
  deletePart: (id: string) => Promise<void>;

  // PM mutations
  createPMTask: (data: any) => Promise<void>;
  updatePMTask: (id: string, data: any) => Promise<PMTask>;
  completeTask: (id: string, task: string, notes?: string, checkedItems?: string[]) => Promise<void>;
  loadPMTask: (id: string) => Promise<PMTask>;
  addPMChecklistItem: (pmTaskId: string, text: string) => Promise<PMChecklistItem>;
  updatePMChecklistItem: (pmTaskId: string, itemId: string, data: any) => Promise<PMChecklistItem>;
  deletePMChecklistItem: (pmTaskId: string, itemId: string) => Promise<void>;

  // Machine CRUD
  createMachine: (data: Partial<Machine>) => Promise<Machine>;
  updateMachine: (id: string, data: Partial<Machine>) => Promise<Machine>;
  deleteMachine: (id: string) => Promise<void>;
  addMachinePhoto: (id: string, url: string, isPrimary?: boolean) => Promise<Machine>;
  deleteMachinePhoto: (id: string, photoId: string) => Promise<Machine>;

  // Custom fields
  loadCustomFields: () => Promise<void>;
  createCustomField: (data: Partial<CustomField>) => Promise<CustomField>;
  updateCustomField: (id: string, data: Partial<CustomField>) => Promise<CustomField>;
  deleteCustomField: (id: string) => Promise<void>;

  // Unit CRUD
  createUnit: (data: Partial<Unit>) => Promise<Unit>;
  updateUnit: (id: string, data: Partial<Unit>) => Promise<Unit>;
  deleteUnit: (id: string) => Promise<void>;

  // User management
  createUser: (data: any) => Promise<User>;
  updateUser: (id: string, data: any) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  // Work order CRUD
  createWorkOrder: (data: any) => Promise<WorkOrder>;
  updateWorkOrder: (id: string, data: any) => Promise<WorkOrder>;
  assignWorkOrder: (id: string, assigneeId: string) => Promise<WorkOrder>;
  addWOPart: (woId: string, data: any) => Promise<WorkOrder>;
  removeWOPart: (woId: string, partItemId: string) => Promise<WorkOrder>;

  // Part categories
  loadPartCategories: () => Promise<void>;
  createPartCategory: (name: string) => Promise<PartCategory>;
  deletePartCategory: (id: string) => Promise<void>;

  // Settings
  setOrg: (updater: (prev: Organization) => Organization) => void;
  saveSettings: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  authed: !!getToken(),
  me: null,
  route: { screen: getToken() ? 'dashboard' : 'login', params: {} },
  org: null,
  machines: [],
  tickets: [],
  parts: [],
  pmTasks: [],
  workOrders: [],
  customFields: [],
  units: [],
  users: [],
  partCategories: [],
  toasts: [],
  loading: false,

  login: async (email, password) => {
    const { token, user } = await api.auth.login(email, password);
    setToken(token);
    set({ authed: true, me: user });
    await get().loadAll();
    get().nav('dashboard');
  },

  logout: () => {
    clearToken();
    set({ authed: false, me: null, route: { screen: 'login', params: {} } });
  },

  nav: (screen, params = {}) => {
    set({ route: { screen, params } });
    const c = document.querySelector('.content');
    if (c) c.scrollTop = 0;
  },

  toast: (text, icon = 'check') => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, text, icon }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2800);
  },

  loadAll: async () => {
    set({ loading: true });
    try {
      const [machines, tickets, parts, pmTasks, workOrders, settings, customFields, units, users, partCategories] = await Promise.all([
        api.machines.list(),
        api.tickets.list(),
        api.parts.list(),
        api.pmTasks.list(),
        api.workOrders.list(),
        api.settings.get(),
        api.customFields.list(),
        api.units.list(),
        api.users.list(),
        api.partCategories.list(),
      ]);
      set({ machines, tickets, parts, pmTasks, workOrders, org: settings.org, customFields, units, users, partCategories, loading: false });

      // Check for PM tasks due soon — show in-app notification toasts
      try {
        const dueSoon = await api.pmTasks.dueSoon();
        dueSoon.forEach((t: any) => {
          const days = t.daysUntilDue;
          const msg = days === 0
            ? `PM due today: ${t.task} — ${t.machine?.name}`
            : `PM due in ${days} day${days !== 1 ? 's' : ''}: ${t.task} — ${t.machine?.name}`;
          get().toast(msg, 'maintenance');
        });
      } catch { /* non-critical */ }
    } catch (e) {
      set({ loading: false });
      console.error('Failed to load data', e);
    }
  },

  acknowledgeTicket: async (id) => {
    const { me } = get();
    const updated = await api.tickets.acknowledge(id, { userId: me?.id, userName: me?.name });
    set(s => ({ tickets: s.tickets.map(t => t.id === id ? updated : t) }));
    get().toast('Ticket acknowledged');
  },

  startWork: async (id) => {
    const updated = await api.tickets.startWork(id);
    set(s => ({ tickets: s.tickets.map(t => t.id === id ? updated : t) }));
    get().toast('Work started');
  },

  resolveTicket: async (id, note, part) => {
    const updated = await api.tickets.resolve(id, {
      note,
      partName: part?.name || null,
      partQty: part ? 1 : null,
    });
    set(s => ({ tickets: s.tickets.map(t => t.id === id ? updated : t) }));
    if (part) get().consumePart(part.id, 1);
    get().toast('Ticket resolved');
  },

  assignTicket: async (id, userId, userName) => {
    const updated = await api.tickets.assign(id, { userId, userName });
    set(s => ({ tickets: s.tickets.map(t => t.id === id ? updated : t) }));
    get().toast(`Assigned to ${userName}`);
  },

  addComment: async (id, text) => {
    const { me } = get();
    await api.tickets.addComment(id, { userId: me?.id, text });
    // Refresh the ticket
    const updated = await api.tickets.get(id);
    set(s => ({ tickets: s.tickets.map(t => t.id === id ? updated : t) }));
  },

  createTicket: async ({ machineId, category = 'Machine', severity, type, desc }) => {
    const { me } = get();
    const title = desc.split('\n')[0].slice(0, 60) || 'Reported issue';
    const newTicket = await api.tickets.create({
      machineId: machineId || null,
      category,
      severity: severity.toUpperCase(),
      type,
      title,
      description: desc,
      raisedById: me?.id,
    });
    set(s => ({ tickets: [newTicket, ...s.tickets] }));
    return newTicket.ticketNum;
  },

  consumePart: async (id, qty) => {
    const { me } = get();
    const updated = await api.parts.consume(id, { qty, userId: me?.id });
    set(s => ({ parts: s.parts.map(p => p.id === id ? { ...p, ...updated } : p) }));
  },

  addStock: async (id, qty) => {
    const { me } = get();
    const updated = await api.parts.addStock(id, { qty, userId: me?.id });
    set(s => ({ parts: s.parts.map(p => p.id === id ? { ...p, ...updated } : p) }));
  },

  // Part CRUD
  createPart: async (data) => {
    const part = await api.parts.create(data);
    set(s => ({ parts: [...s.parts, part].sort((a, b) => a.name.localeCompare(b.name)) }));
    get().toast('Part added');
    return part;
  },
  updatePart: async (id, data) => {
    const part = await api.parts.update(id, data);
    set(s => ({ parts: s.parts.map(p => p.id === id ? { ...p, ...part } : p) }));
    get().toast('Part updated');
    return part;
  },
  deletePart: async (id) => {
    await api.parts.delete(id);
    set(s => ({ parts: s.parts.filter(p => p.id !== id) }));
    get().toast('Part deleted');
  },

  createPMTask: async (data) => {
    const task = await api.pmTasks.create(data);
    set(s => ({ pmTasks: [task, ...s.pmTasks] }));
    get().toast('PM task added', 'checkcircle');
  },

  updatePMTask: async (id, data) => {
    const task = await api.pmTasks.update(id, data);
    set(s => ({ pmTasks: s.pmTasks.map(p => p.id === id ? task : p) }));
    get().toast('PM task updated');
    return task;
  },

  completeTask: async (id, task, notes, checkedItems) => {
    const { me } = get();
    const updated = await api.pmTasks.complete(id, { notes, checkedItems, completedById: me?.id });
    set(s => ({ pmTasks: s.pmTasks.map(p => p.id === id ? updated : p) }));
    get().toast(`Completed: ${task}`, 'checkcircle');
  },

  loadPMTask: async (id) => {
    const task = await api.pmTasks.get(id);
    set(s => ({ pmTasks: s.pmTasks.map(p => p.id === id ? task : p) }));
    return task;
  },

  addPMChecklistItem: async (pmTaskId, text) => {
    const item = await api.pmTasks.addChecklistItem(pmTaskId, text);
    set(s => ({
      pmTasks: s.pmTasks.map(p => p.id === pmTaskId
        ? { ...p, checklistItems: [...(p.checklistItems ?? []), item] }
        : p),
    }));
    return item;
  },

  updatePMChecklistItem: async (pmTaskId, itemId, data) => {
    const item = await api.pmTasks.updateChecklistItem(pmTaskId, itemId, data);
    set(s => ({
      pmTasks: s.pmTasks.map(p => p.id === pmTaskId
        ? { ...p, checklistItems: (p.checklistItems ?? []).map(i => i.id === itemId ? item : i) }
        : p),
    }));
    return item;
  },

  deletePMChecklistItem: async (pmTaskId, itemId) => {
    await api.pmTasks.deleteChecklistItem(pmTaskId, itemId);
    set(s => ({
      pmTasks: s.pmTasks.map(p => p.id === pmTaskId
        ? { ...p, checklistItems: (p.checklistItems ?? []).filter(i => i.id !== itemId) }
        : p),
    }));
  },

  // Machine CRUD
  createMachine: async (data) => {
    const machine = await api.machines.create(data);
    set(s => ({ machines: [...s.machines, machine].sort((a, b) => a.name.localeCompare(b.name)) }));
    get().toast('Machine added');
    return machine;
  },
  updateMachine: async (id, data) => {
    const machine = await api.machines.update(id, data);
    set(s => ({ machines: s.machines.map(m => m.id === id ? { ...m, ...machine } : m) }));
    get().toast('Machine updated');
    return machine;
  },
  deleteMachine: async (id) => {
    await api.machines.delete(id);
    set(s => ({ machines: s.machines.filter(m => m.id !== id) }));
    get().toast('Machine deleted');
  },

  addMachinePhoto: async (id, url, isPrimary) => {
    const machine = await api.machines.addPhoto(id, url, isPrimary);
    set(s => ({ machines: s.machines.map(m => m.id === id ? machine : m) }));
    return machine;
  },
  deleteMachinePhoto: async (id, photoId) => {
    const machine = await api.machines.deletePhoto(id, photoId);
    set(s => ({ machines: s.machines.map(m => m.id === id ? machine : m) }));
    get().toast('Photo removed');
    return machine;
  },

  // Custom fields
  loadCustomFields: async () => {
    const customFields = await api.customFields.list();
    set({ customFields });
  },
  createCustomField: async (data) => {
    const field = await api.customFields.create(data);
    set(s => ({ customFields: [...s.customFields, field] }));
    return field;
  },
  updateCustomField: async (id, data) => {
    const field = await api.customFields.update(id, data);
    set(s => ({ customFields: s.customFields.map(f => f.id === id ? field : f) }));
    return field;
  },
  deleteCustomField: async (id) => {
    await api.customFields.delete(id);
    set(s => ({ customFields: s.customFields.filter(f => f.id !== id) }));
  },

  // Unit CRUD
  createUnit: async (data) => {
    const unit = await api.units.create(data);
    set(s => ({ units: [...s.units, unit] }));
    get().toast('Unit added');
    return unit;
  },
  updateUnit: async (id, data) => {
    const unit = await api.units.update(id, data);
    set(s => ({ units: s.units.map(u => u.id === id ? { ...u, ...unit } : u) }));
    get().toast('Unit updated');
    return unit;
  },
  deleteUnit: async (id) => {
    await api.units.delete(id);
    set(s => ({ units: s.units.filter(u => u.id !== id) }));
    get().toast('Unit deleted');
  },

  // User management
  createUser: async (data) => {
    const user = await api.users.create(data);
    set(s => ({ users: [...s.users, user].sort((a, b) => a.name.localeCompare(b.name)) }));
    get().toast('Team member added');
    return user;
  },
  updateUser: async (id, data) => {
    const user = await api.users.update(id, data);
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...user } : u) }));
    get().toast('User updated');
    return user;
  },
  deleteUser: async (id) => {
    await api.users.delete(id);
    set(s => ({ users: s.users.filter(u => u.id !== id) }));
    get().toast('User deleted');
  },

  createWorkOrder: async (data) => {
    const wo = await api.workOrders.create(data);
    set(s => ({ workOrders: [wo, ...s.workOrders] }));
    get().toast('Work order created');
    return wo;
  },
  updateWorkOrder: async (id, data) => {
    const wo = await api.workOrders.update(id, data);
    set(s => ({ workOrders: s.workOrders.map(w => w.id === id ? wo : w) }));
    if (data.status === 'COMPLETED') get().toast('Work order completed');
    else if (data.status === 'IN_PROGRESS') get().toast('Work started');
    return wo;
  },

  assignWorkOrder: async (id, assigneeId) => {
    const wo = await api.workOrders.assign(id, assigneeId);
    set(s => ({ workOrders: s.workOrders.map(w => w.id === id ? wo : w) }));
    get().toast('Work order reassigned');
    return wo;
  },

  addWOPart: async (woId, data) => {
    const wo = await api.workOrders.addPart(woId, data);
    set(s => ({ workOrders: s.workOrders.map(w => w.id === woId ? wo : w) }));
    return wo;
  },
  removeWOPart: async (woId, partItemId) => {
    const wo = await api.workOrders.removePart(woId, partItemId);
    set(s => ({ workOrders: s.workOrders.map(w => w.id === woId ? wo : w) }));
    return wo;
  },

  // Part categories
  loadPartCategories: async () => {
    const partCategories = await api.partCategories.list();
    set({ partCategories });
  },
  createPartCategory: async (name) => {
    const cat = await api.partCategories.create(name);
    set(s => ({ partCategories: [...s.partCategories, cat].sort((a, b) => a.name.localeCompare(b.name)) }));
    return cat;
  },
  deletePartCategory: async (id) => {
    await api.partCategories.delete(id);
    set(s => ({ partCategories: s.partCategories.filter(c => c.id !== id) }));
  },

  setOrg: (updater) => {
    set(s => ({ org: s.org ? updater(s.org) : s.org }));
  },

  saveSettings: async () => {
    const { org } = get();
    if (!org) return;
    await api.settings.update({ name: org.name, unitCode: org.unitCode, whatsapp: org.whatsapp });
    get().toast('Company profile saved');
  },
}));
