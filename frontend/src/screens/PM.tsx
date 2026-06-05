import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { PMTask, PMChecklistItem, FREQ_LABELS, PMFrequency } from '../types';
import { Btn, Photo, Badge, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle } from '../components/shared';

const FREQUENCIES: PMFrequency[] = ['NONE', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

/* ─── Add / Edit PM Task form ─────────────────────────────────────────────── */
function PMTaskForm({ existing, onClose }: { existing?: PMTask; onClose: () => void }) {
  const { machines, users, parts, createPMTask, updatePMTask } = useStore();
  const [form, setForm] = useState({
    machineId: existing?.machineId ?? '',
    partId: existing?.partId ?? '',
    task: existing?.task ?? '',
    section: existing?.section ?? '',
    assigneeId: existing?.assigneeId ?? '',
    nextDueDate: existing?.nextDueDate ? existing.nextDueDate.slice(0, 10) : '',
    frequency: (existing?.frequency ?? 'MONTHLY') as PMFrequency,
    notifyDaysBefore: existing?.notifyDaysBefore ?? 3,
  });
  const [saving, setSaving] = useState(false);

  const upd = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const onMachineChange = (id: string) => {
    const m = machines.find(m => m.id === id);
    setForm(f => ({ ...f, machineId: id, section: m?.section ?? f.section, partId: '' }));
  };

  // Parts linked to the selected machine
  const machineParts = parts.filter(p => p.machines?.some(m => m.machineId === form.machineId));

  const handleSave = async () => {
    if (!form.machineId || !form.task || !form.section || !form.assigneeId || !form.nextDueDate) return;
    setSaving(true);
    try {
      const data = {
        machineId: form.machineId,
        partId: form.partId || null,
        task: form.task,
        section: form.section,
        assigneeId: form.assigneeId,
        nextDueDate: form.nextDueDate,
        frequency: form.frequency,
        notifyDaysBefore: form.notifyDaysBefore,
      };
      if (existing) {
        await updatePMTask(existing.id, data);
      } else {
        await createPMTask(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const canSave = form.machineId && form.task && form.section && form.assigneeId && form.nextDueDate;

  return (
    <SlideOver title={existing ? 'Edit PM task' : 'Add PM task'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Machine *</div>
          <select className="input" value={form.machineId} onChange={e => onMachineChange(e.target.value)}>
            <option value="">Select machine…</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
          </select>
        </div>
        {form.machineId && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
              Part <span style={{ fontWeight: 400, color: '#94A3B8' }}>— optional, if PM is for a specific part</span>
            </div>
            <select className="input" value={form.partId} onChange={e => upd('partId', e.target.value)}>
              <option value="">Machine-level PM (no specific part)</option>
              {machineParts.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.partNumber ? ` (${p.partNumber})` : ''}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Task description *</div>
          <input className="input" placeholder="e.g. Belt inspection" value={form.task} onChange={e => upd('task', e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Section *</div>
          <input className="input" placeholder="e.g. Packing" value={form.section} onChange={e => upd('section', e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Assignee *</div>
          <select className="input" value={form.assigneeId} onChange={e => upd('assigneeId', e.target.value)}>
            <option value="">Select technician…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
          </select>
        </div>
        <div className="divider" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Frequency *</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {FREQUENCIES.map(f => (
              <button key={f} onClick={() => upd('frequency', f)}
                style={{ padding: '8px 4px', borderRadius: 8, border: `1.5px solid ${form.frequency === f ? '#1B4FD8' : '#E2E8F0'}`, background: form.frequency === f ? '#EEF2FF' : '#fff', color: form.frequency === f ? '#1B4FD8' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {FREQ_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{existing ? 'Due date *' : 'First due date *'}</div>
          <input className="input" type="date" value={form.nextDueDate} onChange={e => upd('nextDueDate', e.target.value)} style={{ maxWidth: 200 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Notify assignee before</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="seg">
              {[1, 2, 3, 5, 7].map(n => (
                <button key={n} className={form.notifyDaysBefore === n ? 'on' : ''} onClick={() => upd('notifyDaysBefore', n)}>{n}d</button>
              ))}
            </div>
            <span style={{ fontSize: 13, color: '#64748B' }}>before due date</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        <Btn variant="secondary" size="lg" block onClick={onClose}>Cancel</Btn>
        <Btn size="lg" block onClick={handleSave} disabled={!canSave || saving}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Add PM task'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* ─── PM Detail slide-over ───────────────────────────────────────────────── */
function PMDetail({ pmTask: initialTask, onClose, onEdit }: { pmTask: PMTask; onClose: () => void; onEdit: () => void }) {
  const { loadPMTask, completeTask, addPMChecklistItem, updatePMChecklistItem, deletePMChecklistItem, nav } = useStore();
  const [task, setTask] = useState<PMTask>(initialTask);
  const [loading, setLoading] = useState(true);

  // Completion state
  const [completing, setCompleting] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Checklist editing
  const [newItemText, setNewItemText] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const newItemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPMTask(initialTask.id).then(t => { setTask(t); setLoading(false); });
  }, [initialTask.id]);

  const checklistItems: PMChecklistItem[] = task.checklistItems ?? [];
  const completions = task.completions ?? [];

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    const item = await addPMChecklistItem(task.id, newItemText.trim());
    setTask(t => ({ ...t, checklistItems: [...(t.checklistItems ?? []), item] }));
    setNewItemText('');
    setAddingItem(false);
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!editingText.trim()) return;
    const updated = await updatePMChecklistItem(task.id, itemId, { text: editingText.trim() });
    setTask(t => ({ ...t, checklistItems: (t.checklistItems ?? []).map(i => i.id === itemId ? updated : i) }));
    setEditingItemId(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deletePMChecklistItem(task.id, itemId);
    setTask(t => ({ ...t, checklistItems: (t.checklistItems ?? []).filter(i => i.id !== itemId) }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeTask(task.id, task.task, notes, Array.from(checkedIds));
      const refreshed = await loadPMTask(task.id);
      setTask(refreshed);
      setCompleting(false);
      setCheckedIds(new Set());
      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  const m = task.machine;
  const photo = m?.photos?.[0]?.url ?? null;
  const unitCode = (m as any)?.unit?.code ?? '';
  const isCompleted = task.state === 'COMPLETED';

  const stateColor: Record<string, string> = {
    OVERDUE: '#DC2626', DUE: '#D97706', UPCOMING: '#1B4FD8', COMPLETED: '#16A34A',
  };

  return (
    <SlideOver title={task.task} onClose={onClose}>
      {loading ? (
        <div style={{ padding: 24, color: '#94A3B8', textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* State banner */}
          {task.state === 'OVERDUE' && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.alert size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Overdue by {task.overdueBy}</span>
            </div>
          )}
          {task.state === 'DUE' && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.alert size={16} style={{ color: '#D97706', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>Due today</span>
            </div>
          )}

          {/* Machine + Part */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Photo src={photo} kind="machine" radius={8} style={{ width: 52, height: 52, flex: '0 0 52px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <button onClick={() => { onClose(); nav('machineDetail', { id: m?.id }); }}
                style={{ fontWeight: 600, fontSize: 14, color: '#1B4FD8', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                {m?.name} <Icons.chevright size={13} />
              </button>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                {unitCode && <>{unitCode} · </>}{m?.code}
              </div>
              {task.part && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#EEF2FF', color: '#1B4FD8', padding: '3px 8px', borderRadius: 99, width: 'fit-content' }}>
                  <Icons.parts size={12} />
                  {task.part.name}{task.part.partNumber ? ` · ${task.part.partNumber}` : ''}
                </div>
              )}
            </div>
            <Badge status={task.state} />
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
            {[
              { label: 'Section', value: task.section },
              { label: 'Frequency', value: FREQ_LABELS[task.frequency] },
              { label: 'Due date', value: task.dueDate },
              { label: 'Assignee', value: task.assignee?.name },
              { label: 'Notify', value: `${task.notifyDaysBefore} days before` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          <div className="divider" style={{ marginBottom: 20 }} />

          {/* Checklist */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                Checklist
                {checklistItems.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 12, color: '#94A3B8', fontWeight: 400 }}>
                    ({checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              {!completing && (
                <button onClick={() => { setAddingItem(true); setTimeout(() => newItemRef.current?.focus(), 50); }}
                  style={{ fontSize: 12, fontWeight: 600, color: '#1B4FD8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icons.plus size={14} /> Add item
                </button>
              )}
            </div>

            {checklistItems.length === 0 && !addingItem && (
              <div style={{ fontSize: 13, color: '#94A3B8', padding: '12px 0' }}>
                No checklist items yet. Add items that the technician should verify each cycle.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {checklistItems.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: completing && checkedIds.has(item.id) ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${completing && checkedIds.has(item.id) ? '#86EFAC' : '#E2E8F0'}` }}>
                  {completing ? (
                    <button onClick={() => setCheckedIds(s => { const n = new Set(s); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; })}
                      style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checkedIds.has(item.id) ? '#16A34A' : '#CBD5E1'}`, background: checkedIds.has(item.id) ? '#16A34A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                      {checkedIds.has(item.id) && <Icons.check size={12} style={{ color: '#fff' }} />}
                    </button>
                  ) : (
                    <span style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#94A3B8' }}>{idx + 1}</span>
                  )}
                  {editingItemId === item.id ? (
                    <input
                      className="input"
                      style={{ flex: 1, fontSize: 13, padding: '4px 8px' }}
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateItem(item.id); if (e.key === 'Escape') setEditingItemId(null); }}
                      onBlur={() => handleUpdateItem(item.id)}
                      autoFocus
                    />
                  ) : (
                    <span style={{ flex: 1, fontSize: 13, color: completing && checkedIds.has(item.id) ? '#94A3B8' : '#0F172A', textDecoration: completing && checkedIds.has(item.id) ? 'line-through' : 'none' }}>{item.text}</span>
                  )}
                  {!completing && editingItemId !== item.id && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditingItemId(item.id); setEditingText(item.text); }}
                        style={{ padding: 4, color: '#94A3B8', borderRadius: 5 }}><Icons.edit size={13} /></button>
                      <button onClick={() => handleDeleteItem(item.id)}
                        style={{ padding: 4, color: '#94A3B8', borderRadius: 5 }}><Icons.trash size={13} /></button>
                    </div>
                  )}
                </div>
              ))}

              {addingItem && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #1B4FD8', background: '#EEF2FF' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid #CBD5E1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#94A3B8' }}>{checklistItems.length + 1}</span>
                  <input
                    ref={newItemRef}
                    className="input"
                    style={{ flex: 1, fontSize: 13, padding: '4px 8px', background: 'transparent', border: 'none' }}
                    placeholder="e.g. Check belt tension"
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') { setAddingItem(false); setNewItemText(''); } }}
                  />
                  <Btn size="sm" onClick={handleAddItem} disabled={!newItemText.trim()}>Add</Btn>
                  <button onClick={() => { setAddingItem(false); setNewItemText(''); }} style={{ color: '#94A3B8', padding: 4 }}><Icons.close size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Complete flow */}
          {!isCompleted && completing && (
            <>
              <div className="divider" style={{ marginBottom: 16 }} />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></div>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Any observations, adjustments made, parts used…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ resize: 'none', fontSize: 13 }}
                />
              </div>
              {checklistItems.length > 0 && (
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                  {checkedIds.size} of {checklistItems.length} items checked
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" size="md" onClick={() => { setCompleting(false); setCheckedIds(new Set()); setNotes(''); }}>Cancel</Btn>
                <Btn size="md" block onClick={handleComplete} disabled={saving}>
                  {saving ? 'Saving…' : 'Confirm complete'}
                </Btn>
              </div>
            </>
          )}

          {/* Completion history */}
          {completions.length > 0 && (
            <>
              <div className="divider" style={{ margin: '20px 0 16px' }} />
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completions.map(c => {
                  const checked = (() => { try { return JSON.parse(c.checkedItems) as string[]; } catch { return []; } })();
                  return (
                    <div key={c.id} style={{ padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icons.checkcircle size={14} style={{ color: '#16A34A' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                            {new Date(c.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{c.completedBy?.name ?? 'Unknown'}</span>
                      </div>
                      {checklistItems.length > 0 && (
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          {checked.length}/{checklistItems.length} items checked
                        </div>
                      )}
                      {c.notes && <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>"{c.notes}"</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        <Btn variant="secondary" size="lg" icon="edit" onClick={onEdit}>Edit</Btn>
        {!isCompleted && !completing && (
          <Btn size="lg" block icon="check" onClick={() => setCompleting(true)}>Mark complete</Btn>
        )}
        {isCompleted && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
            <Icons.checkcircle size={16} /> Completed
          </div>
        )}
      </div>
    </SlideOver>
  );
}

/* ─── Main PM screen ─────────────────────────────────────────────────────── */
export default function PMSchedule() {
  const S = useStore();
  const { nav, pmTasks, units } = S;
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PMTask | null>(null);
  const [editingTask, setEditingTask] = useState<PMTask | null>(null);

  const groups = [
    { state: 'OVERDUE', label: 'Overdue', color: '#DC2626', bg: '#FEF2F2' },
    { state: 'DUE', label: 'Due today', color: '#D97706', bg: '#FFFBEB' },
    { state: 'UPCOMING', label: 'Upcoming', color: '#6B7280', bg: '#fff' },
  ];

  const openDetail = (task: PMTask) => setSelectedTask(task);
  const openEdit = (task: PMTask) => { setSelectedTask(null); setEditingTask(task); };

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Maintenance" right={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="seg">
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><Icons.list size={16} /> List</button>
            <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}><Icons.calendar size={16} /> Calendar</button>
          </div>
          <Btn size="lg" icon="plus" onClick={() => setShowForm(true)}>Add PM task</Btn>
        </div>
      } />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="fdrop">All units<Icons.chevdown size={15} style={{ color: '#94A3B8' }} /></button>
        <button className="fdrop">This week<Icons.chevdown size={15} style={{ color: '#94A3B8' }} /></button>
        <button className="fdrop">All status<Icons.chevdown size={15} style={{ color: '#94A3B8' }} /></button>
      </div>

      {view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map(g => {
            const items = pmTasks.filter(p => p.state === g.state);
            if (items.length === 0) return null;
            return (
              <div key={g.state}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: g.color, marginBottom: 10 }}>{g.label} ({items.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(p => {
                    const m = p.machine;
                    const photo = m?.photos?.[0]?.url ?? null;
                    const accent = g.state !== 'UPCOMING';
                    const unitObj = units.find(u => u.id === m?.unitId);
                    const itemCount = p.checklistItems?.length ?? 0;
                    return (
                      <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderLeft: accent ? `4px solid ${g.color}` : '1px solid #E2E8F0', background: accent ? g.bg : '#fff', borderRadius: accent ? '0 12px 12px 0' : '12px', cursor: 'pointer' }}
                        onClick={() => openDetail(p)}>
                        <Photo src={photo} kind="machine" radius={8} style={{ width: 48, height: 48, flex: '0 0 48px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                            {p.overdueBy
                              ? <span style={{ fontSize: 11.5, color: g.color, fontWeight: 600 }}>{p.overdueBy} overdue</span>
                              : p.daysUntilDue !== null && p.daysUntilDue !== undefined && p.daysUntilDue <= (p.notifyDaysBefore ?? 3)
                                ? <span style={{ fontSize: 11.5, color: '#D97706', fontWeight: 600 }}>Due in {p.daysUntilDue === 0 ? 'today' : `${p.daysUntilDue}d`}</span>
                                : null}
                            {p.frequency !== 'NONE' && (
                              <span style={{ fontSize: 11, background: '#EEF2FF', color: '#1B4FD8', borderRadius: 99, padding: '1px 8px', fontWeight: 500 }}>↻ {FREQ_LABELS[p.frequency as PMFrequency]}</span>
                            )}
                            {p.part && (
                              <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', borderRadius: 99, padding: '1px 8px', fontWeight: 500 }}>{p.part.name}</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m?.name} — {p.task}</div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            {unitObj?.code} / {p.section} · {p.assignee?.name} · Due {p.dueDate}
                            {itemCount > 0 && <span style={{ marginLeft: 6 }}>· {itemCount} checklist item{itemCount !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                        <Icons.chevright size={16} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {pmTasks.filter(p => p.state === 'COMPLETED').length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#16A34A', marginBottom: 10 }}>
                Completed ({pmTasks.filter(p => p.state === 'COMPLETED').length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pmTasks.filter(p => p.state === 'COMPLETED').map(p => {
                  const m = p.machine;
                  const photo = m?.photos?.[0]?.url ?? null;
                  return (
                    <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, opacity: 0.7, cursor: 'pointer' }}
                      onClick={() => openDetail(p)}>
                      <Photo src={photo} kind="machine" radius={8} style={{ width: 48, height: 48, flex: '0 0 48px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m?.name} — {p.task}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          {p.part && <>{p.part.name} · </>}Completed
                        </div>
                      </div>
                      <Icons.checkcircle size={20} style={{ color: '#16A34A' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {pmTasks.length === 0 && (
            <div className="card card-pad" style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>
              <Icons.maintenance size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 600 }}>No PM tasks yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Add a PM task to track scheduled maintenance.</div>
            </div>
          )}
        </div>
      ) : (
        <CalendarView nav={nav} pmTasks={pmTasks} onSelectTask={openDetail} />
      )}

      {showForm && <PMTaskForm onClose={() => setShowForm(false)} />}
      {editingTask && <PMTaskForm existing={editingTask} onClose={() => setEditingTask(null)} />}
      {selectedTask && (
        <PMDetail
          pmTask={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => openEdit(selectedTask)}
        />
      )}
    </div>
  );
}

function CalendarView({ nav, pmTasks, onSelectTask }: { nav: (s: string, p?: any) => void; pmTasks: any[]; onSelectTask: (t: any) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const firstDow = 6;
  const days = 28;
  const marks: Record<number, any[]> = {};
  pmTasks.forEach(p => {
    const dmap: Record<string, number> = { '10 Feb': 10, '11 Feb': 11, '12 Feb': 12, 'Today': 14, '16 Feb': 16, '26 Feb': 26, '22 Feb': 22, '25 Feb': 25, '23 Feb': 23, '21 Feb': 21, '20 Feb': 20 };
    const d = dmap[p.dueDate]; if (!d) return;
    if (!marks[d]) marks[d] = [];
    marks[d].push(p);
  });
  const stateColor: Record<string, string> = { OVERDUE: '#DC2626', DUE: '#D97706', UPCOMING: '#1D4ED8', overdue: '#DC2626', due: '#D97706', upcoming: '#1D4ED8' };
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const selTasks = sel ? (marks[sel] || []) : [];

  return (
    <div className="card card-pad fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>February 2025</h3>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#DC2626' }} />Overdue</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#D97706' }} />Due</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: '#1D4ED8' }} />Upcoming</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'center', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ts = marks[d] || [];
          const isToday = d === 14;
          return (
            <button key={i} onClick={() => ts.length && setSel(d)} style={{ minHeight: 64, border: '1px solid ' + (isToday ? '#1B4FD8' : '#E2E8F0'), borderRadius: 8, padding: 6, display: 'flex', flexDirection: 'column', gap: 4, cursor: ts.length ? 'pointer' : 'default', background: isToday ? '#EEF2FF' : '#fff', textAlign: 'left' }}>
              <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#1B4FD8' : '#475569' }}>{d}</span>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {ts.slice(0, 4).map((t: any, j: number) => <span key={j} style={{ width: 7, height: 7, borderRadius: 99, background: stateColor[t.state] || '#94A3B8' }} />)}
              </div>
            </button>
          );
        })}
      </div>

      {sel && (
        <>
          <div className="scrim" onClick={() => setSel(null)} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 62, borderRadius: '16px 16px 0 0', padding: '12px 16px calc(24px + env(safe-area-inset-bottom))', boxShadow: 'var(--shadow-xl)', maxHeight: '70vh', overflowY: 'auto', animation: 'slidein .22s ease' }}>
            <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 99, margin: '4px auto 14px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{sel} Feb · {selTasks.length} task{selTasks.length !== 1 ? 's' : ''}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selTasks.map((p: any) => {
                const m = p.machine;
                const photo = m?.photos?.[0]?.url ?? null;
                return (
                  <button key={p.id} onClick={() => { setSel(null); onSelectTask(p); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, textAlign: 'left', cursor: 'pointer', background: '#F8FAFC', width: '100%' }}>
                    <Photo src={photo} kind="machine" radius={7} style={{ width: 36, height: 36, flex: '0 0 36px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.task}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{m?.name}{p.part ? ` · ${p.part.name}` : ''}</div>
                    </div>
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: stateColor[p.state] || '#94A3B8' }} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
