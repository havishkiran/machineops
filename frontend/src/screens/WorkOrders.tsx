import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { WorkOrder, fmtINR } from '../types';
import { Badge, Btn, Photo, Avatar, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle } from '../components/shared';
import { api } from '../api';

function ProgressMini({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 90, height: 7, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#16A34A' : '#1B4FD8', borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{done}/{total}</span>
    </div>
  );
}

/* ─── Exported WO Form — used by WorkOrders and TicketDetail ─────────────── */
export function WOForm({ prefill, onClose, onSaved }: {
  prefill?: { machineId?: string; ticketId?: string; ticketNum?: string; title?: string };
  onClose: () => void;
  onSaved?: (wo: WorkOrder) => void;
}) {
  const { machines, users, me, parts: allParts, createWorkOrder } = useStore();
  const [form, setForm] = useState({
    title: prefill?.title ?? '',
    machineId: prefill?.machineId ?? '',
    assigneeId: me?.id ?? '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHrs: '',
  });
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [parts, setParts] = useState<{ partId: string | null; partName: string; qty: number; cost: number }[]>([]);
  const [partPick, setPartPick] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const machineParts = allParts.filter(p => p.machineId === form.machineId);

  const addStep = () => {
    if (newStep.trim()) { setSteps(s => [...s, newStep.trim()]); setNewStep(''); }
  };

  const addPart = () => {
    if (!partPick) return;
    const inv = machineParts.find(p => p.id === partPick);
    if (!inv) return;
    if (parts.find(p => p.partId === inv.id)) return; // already added
    setParts(ps => [...ps, { partId: inv.id, partName: inv.name, qty: parseInt(partQty) || 1, cost: inv.cost }]);
    setPartPick('');
    setPartQty('1');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.machineId || !form.assigneeId) {
      setError('Title, machine, and assignee are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const wo = await createWorkOrder({
        title: form.title.trim(),
        machineId: form.machineId,
        assigneeId: form.assigneeId,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        estimatedHrs: form.estimatedHrs || undefined,
        ticketId: prefill?.ticketId || undefined,
        steps: steps.map((title, i) => ({ title, sortOrder: i, done: false })),
        parts: parts.length > 0 ? parts : undefined,
      });
      onSaved?.(wo);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create work order.');
      setSaving(false);
    }
  };

  return (
    <SlideOver title="New work order" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {prefill?.ticketNum && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
            <Icons.ticket size={16} style={{ color: '#1B4FD8', flexShrink: 0 }} />
            <span style={{ color: '#475569' }}>Linked to ticket</span>
            <span className="mono" style={{ color: '#1B4FD8', fontWeight: 600, marginLeft: 4 }}>{prefill.ticketNum}</span>
          </div>
        )}

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Title *</div>
          <input className="input" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Describe what needs to be done…" />
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Machine *</div>
          <select className="input" value={form.machineId} onChange={e => { setF('machineId', e.target.value); setParts([]); }} disabled={!!prefill?.machineId}>
            <option value="">Select machine…</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Assignee *</div>
            <select className="input" value={form.assigneeId} onChange={e => setF('assigneeId', e.target.value)}>
              <option value="">Select…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Priority</div>
            <select className="input" value={form.priority} onChange={e => setF('priority', e.target.value)}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Due date</div>
            <input className="input" type="date" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Est. hours</div>
            <input className="input" type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={e => setF('estimatedHrs', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Checklist</div>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{i + 1}. {s}</span>
              <button onClick={() => setSteps(st => st.filter((_, j) => j !== i))} style={{ color: '#94A3B8', padding: 4 }}>
                <Icons.close size={14} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input className="input" placeholder="Add a step…" value={newStep} onChange={e => setNewStep(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStep()} style={{ flex: 1 }} />
            <Btn variant="secondary" size="sm" onClick={addStep}>Add</Btn>
          </div>
        </div>

        {/* Parts section */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Parts to use</div>
          {parts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {parts.map((p, i) => {
                const inv = machineParts.find(mp => mp.id === p.partId);
                const stockColor = inv?.status === 'OUT' ? '#DC2626' : inv?.status === 'LOW_STOCK' ? '#D97706' : '#16A34A';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <Photo src={inv?.photoUrl ?? null} kind="part" radius={5} style={{ width: 28, height: 28, flex: '0 0 28px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.partName}</div>
                      {inv && <div style={{ fontSize: 11, color: stockColor }}>Stock: {inv.qty} {inv.status === 'OUT' ? '· Out of stock' : inv.status === 'LOW_STOCK' ? '· Low stock' : ''}</div>}
                    </div>
                    <span style={{ fontSize: 13, color: '#64748B' }}>×{p.qty}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{fmtINR(p.cost * p.qty)}</span>
                    <button onClick={() => setParts(ps => ps.filter((_, j) => j !== i))} style={{ color: '#94A3B8', padding: 4, flexShrink: 0 }}>
                      <Icons.close size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {form.machineId ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="input" value={partPick} onChange={e => setPartPick(e.target.value)} style={{ flex: 2 }}
                disabled={machineParts.length === 0}>
                <option value="">{machineParts.length === 0 ? 'No parts in inventory for this machine' : 'Pick a part…'}</option>
                {machineParts.map(p => (
                  <option key={p.id} value={p.id} disabled={!!parts.find(x => x.partId === p.id)}>
                    {p.name} (stock: {p.qty})
                  </option>
                ))}
              </select>
              <input className="input" type="number" min="1" value={partQty} onChange={e => setPartQty(e.target.value)} style={{ width: 64 }} placeholder="Qty" />
              <Btn variant="secondary" size="sm" onClick={addPart} disabled={!partPick}>Add</Btn>
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: '#94A3B8' }}>Select a machine to pick parts from its inventory.</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
        <Btn variant="secondary" size="lg" block onClick={onClose}>Cancel</Btn>
        <Btn size="lg" block icon="check" onClick={handleSave} disabled={saving}>
          {saving ? 'Creating…' : 'Create work order'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* ─── Work Orders list ───────────────────────────────────────────────────── */
export default function WorkOrders() {
  const { workOrders } = useStore();
  const [filter, setFilter] = useState('active');
  const [openWO, setOpenWO] = useState<WorkOrder | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filters = [
    { k: 'active', l: 'Active', test: (w: WorkOrder) => ['OPEN', 'IN_PROGRESS'].includes(w.status) },
    { k: 'all', l: 'All', test: () => true },
    { k: 'completed', l: 'Completed', test: (w: WorkOrder) => w.status === 'COMPLETED' },
  ];
  const active = filters.find(f => f.k === filter)!;
  const list = workOrders.filter(active.test);

  const stats = [
    { l: 'Open', n: workOrders.filter(w => w.status === 'OPEN').length, c: '#1D4ED8' },
    { l: 'In progress', n: workOrders.filter(w => w.status === 'IN_PROGRESS').length, c: '#D97706' },
    { l: 'Completed', n: workOrders.filter(w => w.status === 'COMPLETED').length, c: '#16A34A' },
    { l: 'Parts cost', n: fmtINR(workOrders.reduce((s, w) => s + w.parts.reduce((a, p) => a + p.cost * p.qty, 0), 0)), c: '#0F172A' },
  ];

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Work Orders" right={<Btn size="lg" icon="plus" onClick={() => setShowForm(true)}>New work order</Btn>} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 120 }}>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-head)', color: s.c }}>{s.n}</span>
            <span style={{ fontSize: 13, color: '#64748B' }}>{s.l}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f.k} className={'chip ' + (filter === f.k ? 'on' : '')} onClick={() => setFilter(f.k)}>
            {f.l} <span style={{ opacity: 0.6 }}>{workOrders.filter(f.test).length}</span>
          </button>
        ))}
      </div>

      <div className="card hide-mobile" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Work order</th><th>Machine</th><th>Ticket</th><th>Assignee</th><th>Priority</th><th>Progress</th><th>Status</th><th>Due</th><th></th></tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94A3B8', padding: 32 }}>No work orders</td></tr>
              )}
              {list.map(w => {
                const photo = w.machine?.photos?.[0]?.url ?? null;
                const doneN = w.steps.filter(s => s.done).length;
                return (
                  <tr key={w.id} style={{ cursor: 'pointer' }} onClick={() => setOpenWO(w)}>
                    <td>
                      <div className="mono" style={{ fontSize: 12.5, color: '#1B4FD8', fontWeight: 500 }}>{w.woNum}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{w.title}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Photo src={photo} kind="machine" radius={6} style={{ width: 34, height: 34 }} />
                        <span style={{ fontSize: 13 }}>{w.machine?.name}</span>
                      </div>
                    </td>
                    <td>
                      {w.ticket ? (
                        <span className="mono" style={{ fontSize: 12, color: '#1B4FD8', fontWeight: 500 }}>{w.ticket.ticketNum}</span>
                      ) : <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Avatar name={w.assignee?.name || '?'} size={24} />
                        <span style={{ fontSize: 13 }}>{w.assignee?.name}</span>
                      </div>
                    </td>
                    <td><Badge status={w.priority} /></td>
                    <td><ProgressMini done={doneN} total={w.steps.length} /></td>
                    <td><Badge status={w.status} /></td>
                    <td style={{ fontSize: 13, color: '#475569' }}>{w.dueDate?.split(',')[1] || w.dueDate || '—'}</td>
                    <td><Icons.chevright size={18} style={{ color: '#94A3B8' }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(w => {
          const photo = w.machine?.photos?.[0]?.url ?? null;
          const doneN = w.steps.filter(s => s.done).length;
          return (
            <button key={w.id} onClick={() => setOpenWO(w)} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, textAlign: 'left', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 12, color: '#1B4FD8' }}>{w.woNum}</span>
                <Badge status={w.priority} /><Badge status={w.status} />
                {w.ticket && <span className="mono" style={{ fontSize: 11, color: '#64748B' }}>{w.ticket.ticketNum}</span>}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{w.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B' }}>
                <Photo src={photo} kind="machine" radius={6} style={{ width: 28, height: 28 }} />
                {w.machine?.name} · {w.assignee?.name}
              </div>
              <ProgressMini done={doneN} total={w.steps.length} />
            </button>
          );
        })}
      </div>

      {openWO && <WODetail wo={openWO} onClose={() => setOpenWO(null)} onUpdated={wo => setOpenWO(wo)} />}
      {showForm && <WOForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

/* ─── WO Detail slide-over ───────────────────────────────────────────────── */
function WODetail({ wo, onClose, onUpdated }: { wo: WorkOrder; onClose: () => void; onUpdated: (wo: WorkOrder) => void }) {
  const { nav, updateWorkOrder, resolveTicket, tickets, parts: allParts, addWOPart, removeWOPart } = useStore();
  const [steps, setSteps] = useState(wo.steps);
  const [completing, setCompleting] = useState(false);
  const [addingPart, setAddingPart] = useState(false);
  const [partPick, setPartPick] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partSaving, setPartSaving] = useState(false);
  const doneN = steps.filter(s => s.done).length;
  const pct = wo.steps.length ? Math.round((doneN / steps.length) * 100) : 0;
  const partCost = wo.parts.reduce((s, p) => s + p.cost * p.qty, 0);
  const photo = wo.machine?.photos?.[0]?.url ?? null;
  const linkedTicket = wo.ticketId ? tickets.find(t => t.id === wo.ticketId) : null;
  const canResolveTicket = linkedTicket && !['RESOLVED', 'CLOSED'].includes(linkedTicket.status);
  const canEditParts = ['OPEN', 'IN_PROGRESS'].includes(wo.status);
  const machineParts = allParts.filter(p => p.machineId === wo.machineId);

  const handleAddPart = async () => {
    if (!partPick) return;
    const inv = machineParts.find(p => p.id === partPick);
    if (!inv) return;
    setPartSaving(true);
    try {
      const updated = await addWOPart(wo.id, { partId: inv.id, partName: inv.name, qty: parseInt(partQty) || 1, cost: inv.cost });
      onUpdated(updated);
      setPartPick('');
      setPartQty('1');
      setAddingPart(false);
    } finally {
      setPartSaving(false);
    }
  };

  const handleRemovePart = async (partItemId: string) => {
    const updated = await removeWOPart(wo.id, partItemId);
    onUpdated(updated);
  };

  const toggleStep = async (step: any, i: number) => {
    setSteps(s => s.map((x, j) => j === i ? { ...x, done: !x.done } : x));
    try {
      await api.workOrders.toggleStep(wo.id, step.id);
    } catch {
      setSteps(s => s.map((x, j) => j === i ? { ...x, done: !x.done } : x)); // revert on error
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await updateWorkOrder(wo.id, { status: 'COMPLETED', loggedHrs: String(wo.estimatedHrs || '0') });
      onUpdated(updated);
      onClose();
    } finally {
      setCompleting(false);
    }
  };

  const handleStartWork = async () => {
    const updated = await updateWorkOrder(wo.id, { status: 'IN_PROGRESS' });
    onUpdated(updated);
  };

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="slideover" style={{ width: 540 }}>
        <div className="so-head">
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 12.5, color: '#1B4FD8' }}>{wo.woNum}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{wo.title}</h3>
          </div>
          <Badge status={wo.status} />
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><Icons.close size={20} /></button>
        </div>

        <div className="so-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Machine */}
          <button onClick={() => { onClose(); nav('machineDetail', { id: wo.machineId }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#F8FAFC', textAlign: 'left', cursor: 'pointer' }}>
            <Photo src={photo} kind="machine" radius={8} style={{ width: 46, height: 46 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{wo.machine?.name}</div>
              <div className="mono" style={{ fontSize: 12, color: '#64748B' }}>{wo.machine?.code}</div>
            </div>
            <Icons.chevright size={18} style={{ color: '#94A3B8' }} />
          </button>

          {/* Linked ticket */}
          {wo.ticket && (
            <button onClick={() => { onClose(); nav('ticketDetail', { id: wo.ticket!.ticketNum }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', textAlign: 'left', cursor: 'pointer' }}>
              <Icons.ticket size={16} style={{ color: '#1B4FD8', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#475569' }}>From ticket</span>
              <span className="mono" style={{ fontSize: 13, color: '#1B4FD8', fontWeight: 600 }}>{wo.ticket.ticketNum}</span>
              <Badge status={(wo.ticket as any).status} />
              <Icons.chevright size={16} style={{ color: '#94A3B8', marginLeft: 'auto' }} />
            </button>
          )}

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {([
              ['Assignee', <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={wo.assignee?.name || '?'} size={20} />{wo.assignee?.name}</span>],
              ['Priority', <Badge status={wo.priority} />],
              ['Due', wo.dueDate?.split(',')[1] || wo.dueDate || '—'],
              ['Est. / logged', `${wo.estimatedHrs || '—'} / ${wo.loggedHrs || '0'} hrs`],
            ] as [string, React.ReactNode][]).map(([k, v], i) => (
              <div key={i}>
                <div style={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Checklist</span>
              <span style={{ fontSize: 12.5, color: pct === 100 ? '#16A34A' : '#64748B', fontWeight: 600 }}>{doneN}/{steps.length} done</span>
            </div>
            {steps.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8' }}>No checklist steps added.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {steps.map((s, i) => (
                <button key={s.id} onClick={() => toggleStep(s, i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 9, textAlign: 'left', background: s.done ? '#F0FDF4' : '#fff', border: '1px solid ' + (s.done ? '#BBF7D0' : '#E2E8F0'), cursor: 'pointer' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, border: '1.5px solid ' + (s.done ? '#16A34A' : '#CBD5E1'), background: s.done ? '#16A34A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 22px' }}>
                    {s.done && <Icons.check size={15} style={{ color: '#fff' }} />}
                  </span>
                  <span style={{ fontSize: 13.5, color: s.done ? '#16A34A' : '#0F172A', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parts */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Parts used</span>
              {canEditParts && !addingPart && (
                <button onClick={() => setAddingPart(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#1B4FD8', padding: '4px 10px', borderRadius: 7, border: '1.5px solid #C7D2FE', background: '#EEF2FF' }}>
                  <Icons.plus size={13} /> Add part
                </button>
              )}
            </div>

            {wo.parts.length === 0 && !addingPart && (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>No parts on this work order.</p>
            )}

            {wo.parts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {wo.parts.map(p => {
                  const stockColor = p.part?.status === 'OUT' ? '#DC2626' : p.part?.status === 'LOW_STOCK' ? '#D97706' : '#16A34A';
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', background: '#F8FAFC', borderRadius: 9, border: '1px solid #E2E8F0' }}>
                      <Photo src={p.part?.photoUrl ?? null} kind="part" radius={6} style={{ width: 34, height: 34, flex: '0 0 34px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.partName}</div>
                        {p.part && (
                          <div style={{ fontSize: 11.5, color: stockColor, marginTop: 1 }}>
                            Stock: {p.part.qty} {p.part.status === 'OUT' ? '· Out of stock' : p.part.status === 'LOW_STOCK' ? '· Low stock' : '· In stock'}
                          </div>
                        )}
                        {!p.part && <div style={{ fontSize: 11.5, color: '#94A3B8' }}>Custom (not in inventory)</div>}
                      </div>
                      <span style={{ fontSize: 13, color: '#64748B', flexShrink: 0 }}>×{p.qty}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>{fmtINR(p.cost * p.qty)}</span>
                      {canEditParts && (
                        <button onClick={() => handleRemovePart(p.id)} style={{ color: '#94A3B8', padding: 4, flexShrink: 0 }}
                          title="Remove part">
                          <Icons.close size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 2 }}>
                  <span>Parts cost</span><b style={{ color: '#0F172A' }}>{fmtINR(partCost)}</b>
                </div>
              </div>
            )}

            {addingPart && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Add part from inventory</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="input" value={partPick} onChange={e => setPartPick(e.target.value)} style={{ flex: 2 }}
                    disabled={machineParts.length === 0}>
                    <option value="">{machineParts.length === 0 ? 'No inventory parts for this machine' : 'Pick a part…'}</option>
                    {machineParts.map(p => {
                      const alreadyAdded = !!wo.parts.find(wp => wp.partId === p.id);
                      return (
                        <option key={p.id} value={p.id} disabled={alreadyAdded}>
                          {p.name} (stock: {p.qty}){alreadyAdded ? ' — already added' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <input className="input" type="number" min="1" value={partQty} onChange={e => setPartQty(e.target.value)}
                    style={{ width: 70 }} placeholder="Qty" />
                </div>
                {partPick && (() => {
                  const inv = machineParts.find(p => p.id === partPick);
                  if (!inv) return null;
                  const need = parseInt(partQty) || 0;
                  const warn = need > inv.qty;
                  return (
                    <div style={{ fontSize: 12, color: warn ? '#D97706' : '#64748B', background: warn ? '#FFFBEB' : '#F1F5F9', padding: '6px 10px', borderRadius: 6 }}>
                      {warn
                        ? `⚠ Only ${inv.qty} in stock — ${need} requested. Inventory will go to 0.`
                        : `Stock available: ${inv.qty} · Unit cost: ${fmtINR(inv.cost)}`
                      }
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Btn variant="ghost" size="sm" onClick={() => { setAddingPart(false); setPartPick(''); setPartQty('1'); }}>Cancel</Btn>
                  <Btn size="sm" icon="check" onClick={handleAddPart} disabled={!partPick || partSaving}>
                    {partSaving ? 'Adding…' : 'Add part'}
                  </Btn>
                </div>
              </div>
            )}

            {wo.status === 'COMPLETED' && wo.parts.some(p => p.partId) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16A34A', marginTop: 6, padding: '6px 10px', background: '#F0FDF4', borderRadius: 6 }}>
                <Icons.check size={13} />
                Inventory auto-deducted on completion
              </div>
            )}
          </div>

          {/* Resolve linked ticket prompt */}
          {canResolveTicket && wo.status === 'COMPLETED' && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: '#15803D', marginBottom: 6 }}>Linked ticket still open</div>
              <div style={{ fontSize: 13, color: '#166534', marginBottom: 12 }}>
                {linkedTicket!.ticketNum} — {linkedTicket!.machine?.name} is still {linkedTicket!.status.toLowerCase()}. Mark it resolved?
              </div>
              <Btn size="sm" icon="checkcircle" onClick={() => { resolveTicket(linkedTicket!.id, `Resolved via work order ${wo.woNum}`, null); onClose(); }}>
                Resolve ticket
              </Btn>
            </div>
          )}
        </div>

        <div className="so-foot">
          {wo.status === 'COMPLETED' ? (
            <Btn size="lg" block variant="secondary" icon="download">Export job sheet</Btn>
          ) : wo.status === 'OPEN' ? (
            <>
              <Btn variant="ghost" size="lg" onClick={onClose}>Close</Btn>
              <Btn size="lg" block icon="play" onClick={handleStartWork}>Start work</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" size="lg" onClick={onClose}>Close</Btn>
              <Btn size="lg" block icon={pct === 100 ? 'checkcircle' : 'check'} onClick={handleComplete} disabled={completing}>
                {completing ? 'Completing…' : pct === 100 ? 'Complete work order' : 'Save progress'}
              </Btn>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
