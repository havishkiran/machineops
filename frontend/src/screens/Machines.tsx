import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Machine, CustomField } from '../types';
import { Badge, Btn, Photo, QRBox, EmptyState, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { MachineCard, PageTitle, FilterBar, Drop } from '../components/shared';
import { api } from '../api';

/* ─── Machine Add / Edit form slide-over ─────────────────────────────────── */
interface MachineFormProps {
  machine?: Machine | null;
  onClose: () => void;
  onSaved: (m: Machine) => void;
}

function MachineForm({ machine, onClose, onSaved }: MachineFormProps) {
  const { createMachine, updateMachine, customFields, org, units } = useStore();
  const isEdit = !!machine;

  const [form, setForm] = useState({
    name: machine?.name ?? '',
    code: machine?.code ?? '',
    unitId: machine?.unitId ?? 'tvpm',
    section: machine?.section ?? '',
    status: machine?.status ?? 'WORKING',
    manufacturer: machine?.manufacturer ?? '',
    model: machine?.model ?? '',
    year: machine?.year ?? '',
    lastPM: machine?.lastPM ?? '',
    nextPM: machine?.nextPM ?? '',
    uptime: machine?.uptime ?? 100,
  });

  // Custom field values for this machine
  const machineCustomFields = customFields.filter(f => f.entityType === 'MACHINE');
  const [cfValues, setCfValues] = useState<Record<string, string>>({});
  const [loadingCF, setLoadingCF] = useState(false);

  useEffect(() => {
    if (isEdit && machine && machineCustomFields.length > 0) {
      setLoadingCF(true);
      api.customFields.getValues('MACHINE', machine.id)
        .then(rows => {
          const map: Record<string, string> = {};
          rows.forEach((r: any) => { map[r.id] = r.value ?? ''; });
          setCfValues(map);
        })
        .finally(() => setLoadingCF(false));
    }
  }, [machine?.id]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.section.trim()) {
      setError('Name, code and section are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, uptime: Number(form.uptime) };
      const saved = isEdit
        ? await updateMachine(machine!.id, payload)
        : await createMachine(payload);

      // Save custom field values
      if (machineCustomFields.length > 0) {
        const values = machineCustomFields.map(f => ({ fieldId: f.id, value: cfValues[f.id] ?? '' }));
        await api.customFields.saveValues(saved.id, values);
      }

      onSaved(saved);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save machine.');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = ['WORKING', 'WARNING', 'CRITICAL', 'IDLE', 'INACTIVE'];
  const unitOptions = units;

  return (
    <SlideOver title={isEdit ? `Edit — ${machine!.name}` : 'Add machine'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Core fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Machine name *" style={{ gridColumn: '1 / -1' }}>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dipping Machine 4" />
          </Field>
          <Field label="Machine code *">
            <input className="inp mono" value={form.code} onChange={e => set('code', e.target.value)} placeholder="U2-TVPM/DIP-4/1" />
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </Field>
          <Field label="Unit">
            <select className="input" value={form.unitId} onChange={e => set('unitId', e.target.value)}>
              {unitOptions.map(u => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
            </select>
          </Field>
          <Field label="Section *">
            <input className="input" value={form.section} onChange={e => set('section', e.target.value)} placeholder="e.g. Dipping" />
          </Field>
        </div>

        <div style={{ height: 1, background: '#E2E8F0', margin: '2px 0' }} />

        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Machine details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Manufacturer">
            <input className="input" value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Sussman" />
          </Field>
          <Field label="Model">
            <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. DX-300" />
          </Field>
          <Field label="Year">
            <input className="input" value={form.year} onChange={e => set('year', e.target.value)} placeholder="e.g. 2021" />
          </Field>
          <Field label="Uptime %">
            <input className="input" type="number" min={0} max={100} value={form.uptime} onChange={e => set('uptime', e.target.value)} />
          </Field>
          <Field label="Last PM">
            <input className="input" value={form.lastPM} onChange={e => set('lastPM', e.target.value)} placeholder="e.g. 10 Feb" />
          </Field>
          <Field label="Next PM">
            <input className="input" value={form.nextPM} onChange={e => set('nextPM', e.target.value)} placeholder="e.g. 24 Feb" />
          </Field>
        </div>

        {/* Custom fields section */}
        {machineCustomFields.length > 0 && (
          <>
            <div style={{ height: 1, background: '#E2E8F0', margin: '2px 0' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Custom fields
            </div>
            {loadingCF ? (
              <div style={{ color: '#94A3B8', fontSize: 13 }}>Loading…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {machineCustomFields.map(f => (
                  <Field key={f.id} label={f.label + (f.required ? ' *' : '')}
                    style={f.fieldType === 'select' || f.label.length > 20 ? { gridColumn: '1 / -1' } : {}}>
                    <CustomFieldInput field={f} value={cfValues[f.id] ?? ''} onChange={v => setCfValues(p => ({ ...p, [f.id]: v }))} />
                  </Field>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        <Btn variant="secondary" size="lg" block onClick={onClose}>Cancel</Btn>
        <Btn size="lg" block onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add machine'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* Helper sub-components */
function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function CustomFieldInput({ field, value, onChange }: { field: CustomField; value: string; onChange: (v: string) => void }) {
  if (field.fieldType === 'select' && field.options) {
    return (
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— select —</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (field.fieldType === 'number') {
    return <input className="input" type="number" value={value} onChange={e => onChange(e.target.value)} />;
  }
  if (field.fieldType === 'date') {
    return <input className="input" type="date" value={value} onChange={e => onChange(e.target.value)} />;
  }
  return <input className="input" type="text" value={value} onChange={e => onChange(e.target.value)} />;
}

/* ─── Machine List ──────────────────────────────────────────────────────────── */
export function MachineList() {
  const { nav, machines, units } = useStore();
  const [view, setView] = useState(window.innerWidth < 1024 ? 'grid' : 'table');
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const list = machines.filter(m =>
    (unit === 'all' || m.unitId === unit) &&
    (m.name.toLowerCase().includes(q.toLowerCase()) || m.code.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="content-pad fade-in">
      <PageTitle
        title="Machines"
        right={<Btn size="lg" icon="plus" onClick={() => setShowForm(true)}>Add machine</Btn>}
      />
      <FilterBar>
        <div className="seg">
          {[{ id: 'all', code: 'All' }, ...units].map(u => <button key={u.id} className={unit === u.id ? 'on' : ''} onClick={() => setUnit(u.id)}>{u.code}</button>)}
        </div>
        <Drop label="All types" />
        <Drop label="All status" />
        <div className="searchbox" style={{ maxWidth: 260 }}>
          <Icons.search size={17} style={{ color: '#94A3B8' }} />
          <input placeholder="Search machines…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="spacer" style={{ flex: 1 }} />
        <div className="seg hide-mobile">
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><Icons.grid size={16} /> Grid</button>
          <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}><Icons.list size={16} /> Table</button>
        </div>
      </FilterBar>

      {list.length === 0 && (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="machine" heading="No machines" subtext="Add your first machine to get started." cta="Add machine" onCta={() => setShowForm(true)} />
        </div>
      )}

      {list.length > 0 && (view === 'grid' || window.innerWidth < 1024) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {list.map(m => <MachineCard key={m.id} m={m} />)}
        </div>
      )}

      {list.length > 0 && view === 'table' && window.innerWidth >= 1024 && (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 64 }}></th>
              <th>Machine</th><th>Code</th><th>Unit</th><th>Section</th><th>Status</th><th>Last PM</th><th></th>
            </tr></thead>
            <tbody>
              {list.map(m => {
                const unitObj = units.find(u => u.id === m.unitId);
                const photo = m.photos?.[0]?.url ?? null;
                return (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => nav('machineDetail', { id: m.id })}>
                    <td><Photo src={photo} kind="machine" radius={8} style={{ width: 48, height: 48 }} /></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td className="mono" style={{ fontSize: 13, color: '#475569' }}>{m.code}</td>
                    <td>{unitObj?.code}</td>
                    <td style={{ color: '#475569' }}>{m.section}</td>
                    <td><Badge status={m.status} /></td>
                    <td style={{ color: '#475569' }}>{m.lastPM}</td>
                    <td><Icons.chevright size={18} style={{ color: '#94A3B8' }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MachineForm
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

/* ─── Machine Detail ─────────────────────────────────────────────────────── */
export function MachineDetail({ id }: { id: string }) {
  const { nav, tickets, parts, machines, units, addMachinePhoto, deleteMachinePhoto } = useStore();
  const m = machines.find(mc => mc.id === id) || machines[0];
  const unit = units.find(u => u.id === m?.unitId);
  const [tab, setTab] = useState('overview');
  const [activePhoto, setActivePhoto] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [machine, setMachine] = useState(m);
  const [addingPhotoUrl, setAddingPhotoUrl] = useState('');
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  // Sync if store updates (including photo changes)
  useEffect(() => {
    const updated = machines.find(mc => mc.id === id) || m;
    setMachine(updated);
    setActivePhoto(i => Math.min(i, Math.max((updated?.photos?.length ?? 1) - 1, 0)));
  }, [machines, id]);

  if (!machine) return <div className="content-pad"><p>Machine not found.</p></div>;

  const mtickets = tickets.filter(t => t.machineId === machine.id);
  const mparts = parts.filter(p => p.machineId === machine.id);
  const openCount = mtickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status)).length;
  const photos = machine.photos ?? [];

  const handleDeletePhoto = async (photoId: string, idx: number) => {
    await deleteMachinePhoto(machine.id, photoId);
    if (activePhoto >= idx && activePhoto > 0) setActivePhoto(activePhoto - 1);
  };

  const handleAddPhoto = async () => {
    if (!addingPhotoUrl.trim()) return;
    await addMachinePhoto(machine.id, addingPhotoUrl.trim(), photos.length === 0);
    setAddingPhotoUrl('');
    setShowAddPhoto(false);
  };

  const tabs = [
    { k: 'overview', l: 'Overview' },
    { k: 'tickets', l: 'Tickets', c: mtickets.length },
    { k: 'maintenance', l: 'Maintenance' },
    { k: 'parts', l: 'Parts', c: mparts.length },
    { k: 'workorders', l: 'Work Orders' },
  ];

  return (
    <div className="content-pad fade-in" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('machines')}><Icons.arrowleft size={18} /> Back</button>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{machine.name}</h1>
        <Badge status={machine.status} />
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" size="md" icon="edit" onClick={() => setShowEdit(true)}>Edit</Btn>
        <button className="btn btn-ghost btn-md" style={{ padding: '0 10px' }}><Icons.dots size={20} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }} className="md-detail-grid">
        <div>
          <Photo src={photos[activePhoto]?.url ?? null} kind="machine" radius={12} style={{ height: 240 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }} className="no-scrollbar">
            {photos.map((p, i) => (
              <div key={p.id} style={{ position: 'relative', flex: '0 0 80px' }}>
                <button onClick={() => setActivePhoto(i)} style={{ display: 'block', width: 80 }}>
                  <Photo src={p.url} kind="machine" radius={8} style={{ width: 80, height: 80, border: i === activePhoto ? '2px solid #1B4FD8' : '2px solid transparent' }} />
                </button>
                <button
                  onClick={() => handleDeletePhoto(p.id, i)}
                  title="Remove photo"
                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 99, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}>
                  <Icons.close size={11} />
                </button>
              </div>
            ))}
            {/* Add photo */}
            {!showAddPhoto ? (
              <button onClick={() => setShowAddPhoto(true)} style={{ flex: '0 0 80px', height: 80, border: '2px dashed #E2E8F0', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#94A3B8', cursor: 'pointer' }}>
                <Icons.camera size={20} /><span style={{ fontSize: 10 }}>Add</span>
              </button>
            ) : (
              <div style={{ flex: '0 0 220px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  className="input"
                  style={{ fontSize: 12, padding: '5px 8px' }}
                  placeholder="Paste image URL…"
                  value={addingPhotoUrl}
                  onChange={e => setAddingPhotoUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddPhoto(); if (e.key === 'Escape') { setShowAddPhoto(false); setAddingPhotoUrl(''); } }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" onClick={handleAddPhoto} disabled={!addingPhotoUrl.trim()}>Add</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => { setShowAddPhoto(false); setAddingPhotoUrl(''); }}>Cancel</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              {([
                ['Code', <span className="mono">{machine.code}</span>],
                ['Unit', unit?.name],
                ['Section', machine.section],
                ['Manufacturer', machine.manufacturer || '—'],
                ['Model', machine.model || '—'],
                ['Year', machine.year || '—'],
              ] as [string, React.ReactNode][]).map(([k, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ color: '#0F172A', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <QRBox size={88} />
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: '#1B4FD8' }}><Icons.download size={15} /> QR</button>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 24, marginBottom: 18, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.k} className={'tab ' + (tab === t.k ? 'active' : '')} onClick={() => setTab(t.k)}>
            {t.l}{t.c != null && <span className="cnt">{t.c}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="fade-in">
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 8, fontWeight: 500 }}>30-day uptime</div>
            <div style={{ display: 'flex', gap: 3, height: 36 }}>
              {Array.from({ length: 30 }).map((_, i) => {
                const r = ((i * 7 + 3) % 30) / 30;
                const c = i === 12 ? '#DC2626' : (i === 19 || i === 5) ? '#D97706' : '#16A34A';
                return <div key={i} style={{ flex: 1, borderRadius: 3, background: c, opacity: 0.55 + r * 0.45 }} />;
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 6 }}><span>15 Jan</span><span>14 Feb</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            {([['Uptime', `${machine.uptime}%`], ['Open tickets', openCount], ['Last PM', machine.lastPM || '—'], ['Next PM', machine.nextPM || '—']] as [string, React.ReactNode][]).map(([k, v], i) => (
              <div key={i} className="card card-pad" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: '#64748B' }}>{k}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-head)', marginTop: 3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          {mtickets.length === 0 ? <EmptyState icon="checkcircle" heading="All clear" subtext="No tickets for this machine." /> :
            mtickets.map((t, i) => (
              <button key={t.id} onClick={() => nav('ticketDetail', { id: t.ticketNum })} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '14px 16px', borderBottom: i < mtickets.length - 1 ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}>
                <Badge status={t.severity} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: '#64748B' }}>{t.ticketNum}</div>
                </div>
                <Badge status={t.status} />
                <Icons.chevright size={18} style={{ color: '#94A3B8' }} />
              </button>
            ))}
        </div>
      )}

      {tab === 'parts' && (
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          {mparts.length === 0
            ? <EmptyState icon="box" heading="No parts" subtext="No spare parts linked to this machine." />
            : (
              <table className="tbl">
                <thead><tr><th style={{ width: 56 }}></th><th>Part name</th><th>Qty</th><th>Min</th><th>Status</th></tr></thead>
                <tbody>
                  {mparts.map(p => (
                    <tr key={p.id} className={p.status === 'OUT' ? 'row-crit' : p.status === 'LOW_STOCK' ? 'row-warn' : ''}>
                      <td><Photo src={p.photoUrl} kind="part" radius={6} style={{ width: 40, height: 40 }} /></td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.qty}</td><td style={{ color: '#64748B' }}>{p.minQty}</td>
                      <td><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          <div style={{ padding: 14 }}><Btn variant="ghost" icon="plus" style={{ color: '#1B4FD8' }}>Add part to this machine</Btn></div>
        </div>
      )}

      {(tab === 'maintenance' || tab === 'workorders') && (
        <div className="card fade-in" style={{ padding: 0 }}>
          <EmptyState icon={tab === 'maintenance' ? 'maintenance' : 'workorder'} heading={tab === 'maintenance' ? 'PM schedule' : 'Work orders'} subtext={tab === 'maintenance' ? 'Scheduled maintenance for this machine appears here.' : 'Work orders linked to this machine appear here.'} />
        </div>
      )}

      {showEdit && machine && (
        <MachineForm
          machine={machine}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setMachine(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}
