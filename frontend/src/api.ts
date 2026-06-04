// MachineOps API client
import { getToken, Unit } from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const BASE_URL = import.meta.env.VITE_API_URL ?? '';
  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export const api = {
  auth: {
    login: (email: string, password: string) => post<{ token: string; user: any }>('/auth/login', { email, password }),
  },
  machines: {
    list: () => get<any[]>('/machines'),
    get: (id: string) => get<any>(`/machines/${id}`),
    nextCode: (unitCode: string, section: string, machineType: string) =>
      get<{ code: string }>(`/machines/next-code?unitCode=${encodeURIComponent(unitCode)}&section=${encodeURIComponent(section)}&machineType=${encodeURIComponent(machineType)}`),
    photos: (id: string) => get<any[]>(`/machines/${id}/photos`),
    addPhoto: (id: string, url: string, isPrimary?: boolean) => post<any>(`/machines/${id}/photos`, { url, isPrimary }),
    deletePhoto: (id: string, photoId: string) => del<any>(`/machines/${id}/photos/${photoId}`),
    create: (body: any) => post<any>('/machines', body),
    update: (id: string, body: any) => put<any>(`/machines/${id}`, body),
    delete: (id: string) => del<any>(`/machines/${id}`),
  },
  tickets: {
    list: () => get<any[]>('/tickets'),
    get: (id: string) => get<any>(`/tickets/${id}`),
    create: (body: any) => post<any>('/tickets', body),
    acknowledge: (id: string, body: any) => post<any>(`/tickets/${id}/acknowledge`, body),
    startWork: (id: string) => post<any>(`/tickets/${id}/startwork`, {}),
    resolve: (id: string, body: any) => post<any>(`/tickets/${id}/resolve`, body),
    assign: (id: string, body: any) => post<any>(`/tickets/${id}/assign`, body),
    addComment: (id: string, body: any) => post<any>(`/tickets/${id}/comments`, body),
  },
  parts: {
    list: () => get<any[]>('/parts'),
    get: (id: string) => get<any>(`/parts/${id}`),
    create: (body: any) => post<any>('/parts', body),
    update: (id: string, body: any) => put<any>(`/parts/${id}`, body),
    delete: (id: string) => del<any>(`/parts/${id}`),
    addStock: (id: string, body: any) => post<any>(`/parts/${id}/addstock`, body),
    consume: (id: string, body: any) => post<any>(`/parts/${id}/consume`, body),
  },
  pmTasks: {
    list: () => get<any[]>('/pm-tasks'),
    create: (body: any) => post<any>('/pm-tasks', body),
    complete: (id: string) => post<any>(`/pm-tasks/${id}/complete`, {}),
    dueSoon: () => get<any[]>('/pm-tasks/due-soon'),
  },
  reports: {
    summary: () => get<any>('/reports/summary'),
  },
  settings: {
    get: () => get<any>('/settings'),
    update: (body: any) => put<any>('/settings', body),
  },
  customFields: {
    list: (entityType?: string) => get<any[]>(`/custom-fields${entityType ? `?entityType=${entityType}` : ''}`),
    create: (body: any) => post<any>('/custom-fields', body),
    update: (id: string, body: any) => put<any>(`/custom-fields/${id}`, body),
    delete: (id: string) => del<any>(`/custom-fields/${id}`),
    getValues: (entityType: string, entityId: string) => get<any[]>(`/custom-fields/values/${entityType}/${entityId}`),
    saveValues: (entityId: string, values: { fieldId: string; value: string }[]) =>
      put<any>(`/custom-fields/values/${entityId}`, { values }),
  },
  units: {
    list: () => get<Unit[]>('/units'),
    create: (body: any) => post<Unit>('/units', body),
    update: (id: string, body: any) => put<Unit>(`/units/${id}`, body),
    delete: (id: string) => del<any>(`/units/${id}`),
  },
  users: {
    list: () => get<any[]>('/users'),
    create: (body: any) => post<any>('/users', body),
    update: (id: string, body: any) => put<any>(`/users/${id}`, body),
    delete: (id: string) => del<any>(`/users/${id}`),
  },
  partCategories: {
    list: () => get<any[]>('/part-categories'),
    create: (name: string) => post<any>('/part-categories', { name }),
    delete: (id: string) => del<any>(`/part-categories/${id}`),
  },
  workOrders: {
    list: () => get<any[]>('/work-orders'),
    get: (id: string) => get<any>(`/work-orders/${id}`),
    create: (body: any) => post<any>('/work-orders', body),
    update: (id: string, body: any) => put<any>(`/work-orders/${id}`, body),
    assign: (id: string, assigneeId: string) => post<any>(`/work-orders/${id}/assign`, { assigneeId }),
    toggleStep: (id: string, stepId: string) => post<any>(`/work-orders/${id}/steps/${stepId}/toggle`, {}),
    addPart: (id: string, body: any) => post<any>(`/work-orders/${id}/parts`, body),
    removePart: (id: string, partItemId: string) => del<any>(`/work-orders/${id}/parts/${partItemId}`),
  },
};
