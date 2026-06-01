import React, { useState } from 'react';
import { useStore } from '../store';
import { FREQ_LABELS, PMFrequency } from '../types';
import { Btn, Photo, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle } from '../components/shared';

/* ─── Add PM Task form ───────────────────────────────────────────────────── */
const FREQUENCIES: PMFrequency[] = ['NONE', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

function PMTaskForm({ onClose }: { onClose: () => void }) {
  const { machines, users, createPMTask } = useStore();
  const [form, setForm] = useState({
    machineId: '',
    task: '',
    section: '',
    assigneeId: '',
    nextDueDate: '',
    frequency: 'MONTHLY' as PMFrequency,
    notifyDaysBefore: 3,
  });
  const [saving, setSaving] = useState(false);

  const upd = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const onMachineChange = (id: string) => {
    const m = machines.find(m => m.id === id);
    setForm(f => ({ ...f, machineId: id, section: m?.section ?? f.section }));
  };

  const handleSave = async () => {
    if (!form.machineId || !form.task || !form.section || !form.assigneeId || !form.nextDueDate) return;
    setSaving(true);
    try {
      await createPMTask({
        machineId: form.machineId,
        task: form.task,
        section: form.section,
        assigneeId: form.assigneeId,
        nextDueDate: form.nextDueDate,
        frequency: form.frequency,
        notifyDaysBefore: form.notifyDaysBefore,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const canSave = form.machineId && form.task && form.section && form.assigneeId && form.nextDueDate;

  return (
    <SlideOver title="Add PM task" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Machine *</div>
          <select className="input" value={form.machineId} onChange={e => onMachineChange(e.target.value)}>
            <option value="">Select machine…</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
          </select>
        </div>
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
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>First due date *</div>
          <input className="input" type="date" value={form.nextDueDate} onChange={e => upd('nextDueDate', e.target.value)} style={{ maxWidth: 200 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
            Notify assignee before
          </div>
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
          {saving ? 'Saving…' : 'Add PM task'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* ─── Main PM screen ─────────────────────────────────────────────────────── */
export default function PMSchedule() {
  const S = useStore();
  const { nav, pmTasks, completeTask, units } = S;
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);

  const groups = [
    { state: 'OVERDUE', label: 'Overdue', color: '#DC2626', bg: '#FEF2F2' },
    { state: 'DUE', label: 'Due today', color: '#D97706', bg: '#FFFBEB' },
    { state: 'UPCOMING', label: 'Upcoming', color: '#6B7280', bg: '#fff' },
  ];

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
                    return (
                      <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderLeft: accent ? `4px solid ${g.color}` : '1px solid #E2E8F0', background: accent ? g.bg : '#fff', borderRadius: accent ? '0 12px 12px 0' : '12px' }}>
                        <Photo src={photo} kind="machine" radius={8} style={{ width: 48, height: 48, flex: '0 0 48px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                            {p.overdueBy
                              ? <span style={{ fontSize: 11.5, color: g.color, fontWeight: 600 }}>{p.overdueBy} overdue</span>
                              : p.daysUntilDue !== null && p.daysUntilDue !== undefined && p.daysUntilDue <= (p.notifyDaysBefore ?? 3)
                                ? <span style={{ fontSize: 11.5, color: '#D97706', fontWeight: 600 }}>Due in {p.daysUntilDue === 0 ? 'today' : `${p.daysUntilDue}d`}</span>
                                : null}
                            {p.frequency !== 'NONE' && (
                              <span style={{ fontSize: 11, background: '#EEF2FF', color: '#1B4FD8', borderRadius: 99, padding: '1px 8px', fontWeight: 500 }}>
                                ↻ {FREQ_LABELS[p.frequency as PMFrequency]}
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m?.name} — {p.task}</div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{unitObj?.code} / {p.section} · {p.assignee?.name} · Due {p.dueDate}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }} className="hide-mobile">
                          <Btn size="sm" variant="secondary" icon="check" onClick={() => completeTask(p.id, p.task)}>Complete</Btn>
                          <Btn size="sm" variant="ghost" iconRight="chevright" onClick={() => nav('machineDetail', { id: m?.id })}>View</Btn>
                        </div>
                        <button className="only-mobile btn btn-secondary btn-sm" onClick={() => completeTask(p.id, p.task)}><Icons.check size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {pmTasks.filter(p => p.state === 'COMPLETED').length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#16A34A', marginBottom: 10 }}>Completed ({pmTasks.filter(p => p.state === 'COMPLETED').length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pmTasks.filter(p => p.state === 'COMPLETED').map(p => {
                  const m = p.machine;
                  const photo = m?.photos?.[0]?.url ?? null;
                  return (
                    <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, opacity: 0.7 }}>
                      <Photo src={photo} kind="machine" radius={8} style={{ width: 48, height: 48, flex: '0 0 48px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m?.name} — {p.task}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Completed</div>
                      </div>
                      <Icons.checkcircle size={20} style={{ color: '#16A34A' }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <CalendarView nav={nav} pmTasks={pmTasks} />
      )}

      {showForm && <PMTaskForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function CalendarView({ nav, pmTasks }: { nav: (s: string, p?: any) => void; pmTasks: any[] }) {
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
                  <button key={p.id} onClick={() => { setSel(null); nav('machineDetail', { id: m?.id }); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, textAlign: 'left', cursor: 'pointer', background: '#F8FAFC' }}>
                    <Photo src={photo} kind="machine" radius={7} style={{ width: 36, height: 36, flex: '0 0 36px' }} />
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.task}</div><div style={{ fontSize: 12, color: '#64748B' }}>{m?.name}</div></div>
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
