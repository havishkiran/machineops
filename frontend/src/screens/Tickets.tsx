import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { Part } from '../types';
import { WOForm } from './WorkOrders';
import { Badge, Btn, Photo, Avatar } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle, BulkBar, ImportResultModal, downloadCSV, parseCSV } from '../components/shared';

/* ============ RAISE A BREAKDOWN ============ */
export function RaiseTicket() {
  const { nav, createTicket, machines, units, me, toast } = useStore();

  // Step 1: category
  const [category, setCategory] = useState<'Machine' | 'Development' | 'Other' | null>(null);

  // Step 2: machine (only for Machine category)
  const [unit, setUnit] = useState<string | null>(null);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [q, setQ] = useState('');

  // Step 3: severity + type
  const [sev, setSev] = useState<string | null>(null);
  const [type, setType] = useState('Breakdown');

  // Step 4: description + photo
  const [desc, setDesc] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const unitMachines = machines.filter(m => m.unitId === unit && m.name.toLowerCase().includes(q.toLowerCase()));
  const machine = machines.find(m => m.id === machineId);

  const machineStepDone = category === 'Machine' ? !!machineId : true;
  const canSubmit = category && sev && desc.trim() && machineStepDone;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!category || !sev) return;
    setLoading(true);
    try {
      const id = await createTicket({
        machineId: category === 'Machine' ? machineId : null,
        category,
        severity: sev,
        type,
        desc,
      });
      setDone(id);
    } catch (err: any) {
      toast(err.message || 'Failed to submit. Please try again.', 'alert');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flow" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="fade-in" style={{ textAlign: 'center', padding: 32, maxWidth: 380 }}>
          <div style={{ width: 72, height: 72, borderRadius: 99, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icons.checkcircle size={42} style={{ color: '#16A34A' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Breakdown raised</h1>
          <div className="mono" style={{ fontSize: 20, color: '#1B4FD8', fontWeight: 500, margin: '10px 0 6px' }}>{done}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#16A34A', background: '#F0FDF4', padding: '7px 14px', borderRadius: 99, marginTop: 6 }}>
            <Icons.whatsapp size={17} /> WhatsApp sent to supervisors
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <Btn variant="secondary" size="lg" block onClick={() => { const id = done; setDone(null); nav('ticketDetail', { id }); }}>View breakdown</Btn>
            <Btn size="lg" block onClick={() => { setDone(null); setCategory(null); setUnit(null); setMachineId(null); setSev(null); setDesc(''); setPhotoFile(null); setPhotoPreview(null); }}>Raise another</Btn>
          </div>
          <button className="btn btn-ghost btn-md" style={{ marginTop: 14 }} onClick={() => nav('dashboard')}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  const sevs = [
    { k: 'critical', label: 'Critical', sub: 'Machine stopped', dot: '#DC2626', bg: '#FEF2F2', bd: '#FECACA' },
    { k: 'high', label: 'High', sub: 'Degraded perf.', dot: '#C2410C', bg: '#FFF7ED', bd: '#FED7AA' },
    { k: 'medium', label: 'Medium', sub: 'Minor issue', dot: '#D97706', bg: '#FFFBEB', bd: '#FDE68A' },
    { k: 'low', label: 'Low', sub: 'Can wait', dot: '#6B7280', bg: '#F9FAFB', bd: '#E5E7EB' },
  ];

  const categories = [
    { k: 'Machine' as const, icon: 'gear', label: 'Machine', sub: 'Equipment breakdown or fault' },
    { k: 'Development' as const, icon: 'workorder', label: 'Development', sub: 'Improvement or new work' },
    { k: 'Other' as const, icon: 'alert', label: 'Other', sub: 'Not machine-related' },
  ];

  return (
    <div className="flow">
      <div className="flow-head">
        <h1 style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-head)' }}>Report a breakdown</h1>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => nav('dashboard')}><Icons.close size={22} /></button>
      </div>
      <div className="flow-body">
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 26 }}>

          {/* Step 1: Category */}
          <section>
            <div className="flow-step">What type of breakdown?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categories.map(c => {
                const I = Icons[c.icon] || Icons.alert;
                return (
                  <button key={c.k} onClick={() => { setCategory(c.k); setMachineId(null); setUnit(null); }}
                    style={{ textAlign: 'left', padding: '14px 18px', borderRadius: 12, border: '1.5px solid ' + (category === c.k ? '#1B4FD8' : '#E2E8F0'), background: category === c.k ? '#EEF2FF' : '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <I size={22} style={{ color: category === c.k ? '#1B4FD8' : '#94A3B8', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: category === c.k ? '#1B4FD8' : '#0F172A' }}>{c.label}</div>
                      <div style={{ fontSize: 12.5, color: '#64748B' }}>{c.sub}</div>
                    </div>
                    {category === c.k && <Icons.checkcircle size={20} style={{ color: '#1B4FD8', marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Machine selection (only for Machine category) */}
          {category === 'Machine' && (
            <section className="fade-in">
              <div className="flow-step">Which machine?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {units.map(u => (
                  <button key={u.id} onClick={() => { setUnit(u.id); setMachineId(null); }}
                    style={{ textAlign: 'left', padding: '15px 18px', borderRadius: 12, border: '1.5px solid ' + (unit === u.id ? '#1B4FD8' : '#E2E8F0'), background: unit === u.id ? '#1B4FD8' : '#fff', color: unit === u.id ? '#fff' : '#0F172A', fontWeight: 600, fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{u.code}{u.unitNo ? ` (${u.unitNo})` : ''}</span>
                    <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.8 }}>{u._count?.machines ?? 0} machines</span>
                  </button>
                ))}
              </div>
              {unit && (
                <div className="fade-in" style={{ marginTop: 14 }}>
                  <div className="searchbox" style={{ marginBottom: 10 }}>
                    <Icons.search size={17} style={{ color: '#94A3B8' }} />
                    <input placeholder="Search machine…" value={q} onChange={e => setQ(e.target.value)} />
                  </div>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', maxHeight: 248, overflowY: 'auto' }}>
                    {unitMachines.map((m, i) => {
                      const photo = m.photos?.[0]?.url ?? null;
                      return (
                        <button key={m.id} onClick={() => setMachineId(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '10px 14px', background: machineId === m.id ? '#EEF2FF' : '#fff', borderBottom: i < unitMachines.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer' }}>
                          <Photo src={photo} kind="machine" radius={8} style={{ width: 40, height: 40, flex: '0 0 40px' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>{units.find(u => u.id === m.unitId)?.code} / {m.section}</div>
                          </div>
                          {machineId === m.id && <Icons.checkcircle size={20} style={{ color: '#1B4FD8' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Step 3: Severity + type */}
          {category && machineStepDone && (
            <section className="fade-in">
              <div className="flow-step">How bad is it?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {sevs.map(s => (
                  <button key={s.k} onClick={() => setSev(s.k)} style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 12, border: '1.5px solid ' + (sev === s.k ? s.dot : '#E2E8F0'), background: sev === s.k ? s.bg : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 11, height: 11, borderRadius: 99, background: s.dot }} /><span style={{ fontWeight: 700, fontSize: 14, color: sev === s.k ? s.dot : '#0F172A' }}>{s.label}</span></div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>{s.sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                {['Breakdown', 'Repair needed', 'Inspection', 'Development'].map(c => (
                  <button key={c} className={'chip ' + (type === c ? 'on' : '')} onClick={() => setType(c)}>{type === c && <Icons.check size={14} />}{c}</button>
                ))}
              </div>
            </section>
          )}

          {/* Step 4: Description + Photo */}
          {category && machineStepDone && sev && (
            <section className="fade-in">
              <div className="flow-step">What happened?</div>
              <textarea className="textarea" style={{ minHeight: 120, fontSize: 15 }} placeholder="Describe what happened…" value={desc} onChange={e => setDesc(e.target.value)} />

              {/* Photo capture — works on mobile (camera) and desktop (file picker) */}
              <div style={{ marginTop: 12 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhoto}
                />
                {photoPreview ? (
                  <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', borderRadius: 10, border: '1px solid #E2E8F0' }} />
                    <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 99, background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.close size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ width: '100%', border: '2px dashed #E2E8F0', borderRadius: 12, padding: '18px 24px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Icons.camera size={24} style={{ color: '#94A3B8' }} />
                    <div style={{ fontSize: 14, color: '#6B7280' }}>Take photo or attach image</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>JPEG, PNG or WebP · max 5MB · optional</div>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      <div className="flow-foot">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Btn size="xl" block disabled={!canSubmit || loading} onClick={submit}>{loading ? 'Submitting…' : 'Submit breakdown'}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ============ BREAKDOWN LIST ============ */
export function TicketList() {
  const { nav, tickets, me, bulkDeleteTickets, importTickets } = useStore();
  const [filter, setFilter] = useState('open');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const isAdmin = me?.role === 'Super Admin';

  const filters = [
    { k: 'open', l: 'Open', test: (t: any) => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status) },
    { k: 'all', l: 'All', test: () => true },
    { k: 'resolved', l: 'Resolved', test: (t: any) => ['RESOLVED', 'CLOSED'].includes(t.status) },
  ];
  const active = filters.find(f => f.k === filter)!;
  const list = tickets.filter(active.test);

  const allSelected = list.length > 0 && list.every(t => selected.has(t.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map(t => t.id)));
  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} ticket${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    try { await bulkDeleteTickets(Array.from(selected)); setSelected(new Set()); }
    finally { setDeleting(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const rows = parseCSV(text);
    try { const result = await importTickets(rows); setImportResult(result); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const templateHeaders = ['machine_code', 'category', 'severity', 'type', 'title', 'description'];
  const templateSample = ['TVPM-DIP-DIPM-001', 'Machine', 'HIGH', 'Breakdown', 'Bearing noise on dipping machine', 'Unusual grinding noise heard during operation'];

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Breakdowns" right={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
              <Btn variant="secondary" size="lg" onClick={() => downloadCSV('tickets_template.csv', templateHeaders, templateSample)}>Template</Btn>
              <Btn variant="secondary" size="lg" onClick={() => importRef.current?.click()} disabled={importing}>{importing ? 'Importing…' : 'Import CSV'}</Btn>
            </>
          )}
          <Btn size="lg" icon="plus" onClick={() => nav('raise')}>Report breakdown</Btn>
        </div>
      } />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f.k} className={'chip ' + (filter === f.k ? 'on' : '')} onClick={() => setFilter(f.k)}>
            {f.l} <span style={{ opacity: 0.6 }}>{tickets.filter(f.test).length}</span>
          </button>
        ))}
      </div>
      {isAdmin && list.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingLeft: 2 }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 17, height: 17, accentColor: '#1B4FD8', cursor: 'pointer' }} />
          <span style={{ fontSize: 13, color: '#64748B', cursor: 'pointer' }} onClick={toggleAll}>
            {allSelected ? 'Deselect all' : `Select all (${list.length})`}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(t => {
          const photo = t.machine?.photos?.[0]?.url ?? null;
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isAdmin && (
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleOne(t.id)}
                  style={{ width: 17, height: 17, flexShrink: 0, accentColor: '#1B4FD8', cursor: 'pointer' }} />
              )}
              <button onClick={() => nav('ticketDetail', { id: t.ticketNum })} className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: 14, textAlign: 'left', cursor: 'pointer' }}>
                <Photo src={photo} kind="machine" radius={8} style={{ width: 52, height: 52, flex: '0 0 52px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 12, color: '#64748B' }}>{t.ticketNum}</span>
                    <Badge status={t.severity} /><Badge status={t.status} />
                    {t.category && t.category !== 'Machine' && (
                      <span className="badge b-neut">{t.category}</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                    {t.machine ? t.machine.name : t.category} · {t.assignedTo ? t.assignedTo.name : 'unassigned'}
                  </div>
                </div>
                <Icons.chevright size={20} style={{ color: '#94A3B8', flex: '0 0 20px' }} />
              </button>
            </div>
          );
        })}
      </div>
      {isAdmin && <BulkBar count={selected.size} onDelete={handleBulkDelete} onClear={() => setSelected(new Set())} deleting={deleting} />}
      <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
    </div>
  );
}

/* ============ BREAKDOWN DETAIL ============ */
export function TicketDetail({ id }: { id: string }) {
  const S = useStore();
  const { nav, tickets, parts, workOrders, me } = S;
  const t = tickets.find(x => x.ticketNum === id || x.id === id) || tickets[0];
  const [resolveOpen, setResolveOpen] = useState(false);
  const [raiseWO, setRaiseWO] = useState(false);
  const [comment, setComment] = useState('');
  const linkedWOs = workOrders.filter(w => w.ticketId === t?.id);

  // Admin/supervisor can acknowledge
  const canAcknowledge = me && ['Super Admin', 'Floor Supervisor', 'Shift Supervisor'].includes(me.role);

  const tlColor: Record<string, string> = { crit: '#DC2626', high: '#C2410C', warn: '#D97706', ok: '#16A34A', info: '#1D4ED8', neut: '#6B7280' };

  if (!t) return <div className="content-pad"><p>Breakdown not found.</p></div>;

  const photo = t.machine?.photos?.[0]?.url ?? null;

  const actions = () => {
    if (t.status === 'OPEN') return <>
      {canAcknowledge && <Btn icon="check" onClick={() => S.acknowledgeTicket(t.id)}>Acknowledge</Btn>}
      {canAcknowledge && <Btn variant="secondary" icon="user" onClick={() => S.acknowledgeTicket(t.id)}>Assign to me</Btn>}
      {!canAcknowledge && <span style={{ fontSize: 13, color: '#94A3B8' }}>Awaiting supervisor acknowledgement</span>}
    </>;
    if (t.status === 'ACKNOWLEDGED') return <>
      <Btn icon="play" onClick={() => S.startWork(t.id)}>Start work</Btn>
      <Btn variant="secondary" icon="workorder" onClick={() => setRaiseWO(true)}>Raise work order</Btn>
    </>;
    if (t.status === 'IN_PROGRESS') return <>
      <Btn icon="checkcircle" onClick={() => setResolveOpen(true)}>Mark resolved</Btn>
      <Btn variant="secondary" icon="workorder" onClick={() => setRaiseWO(true)}>Raise work order</Btn>
    </>;
    return <Badge status={t.status} />;
  };

  return (
    <div className="content-pad fade-in" style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('tickets')}><Icons.arrowleft size={18} /> Back</button>
        <h1 className="mono" style={{ fontSize: 19, fontWeight: 600 }}>{t.ticketNum}</h1>
        <Badge status={t.severity} /><Badge status={t.status} />
      </div>

      {t.machine && (
        <button onClick={() => nav('machineDetail', { id: t.machineId })} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 16 }}>
          <Photo src={photo} kind="machine" radius={8} style={{ width: 56, height: 56, flex: '0 0 56px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{t.machine.name}</div>
            <div className="mono" style={{ fontSize: 12.5, color: '#64748B' }}>{t.machine.code}</div>
          </div>
          <Icons.chevright size={20} style={{ color: '#94A3B8' }} />
        </button>
      )}

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span className="badge b-neut">{t.type}</span>
          {t.category && t.category !== 'Machine' && <span className="badge b-neut">{t.category}</span>}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t.title}</h2>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.55 }}>{t.description}</p>
        <div className="divider" style={{ margin: '16px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, fontSize: 13 }}>
          <div><div style={{ color: '#94A3B8', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Raised by</div><div style={{ fontWeight: 500, marginTop: 2 }}>{t.raisedBy?.name}</div></div>
          <div><div style={{ color: '#94A3B8', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time open</div><div style={{ fontWeight: 500, marginTop: 2 }}>{t.downtime || '—'}</div></div>
          <div><div style={{ color: '#94A3B8', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned to</div><div style={{ fontWeight: 500, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>{t.assignedTo ? <><Avatar name={t.assignedTo.name} size={20} /> {t.assignedTo.name}</> : <span style={{ color: '#94A3B8' }}>Unassigned</span>}</div></div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginRight: 4 }}>Actions</span>
        {actions()}
      </div>

      {linkedWOs.length > 0 && (
        <div className="card card-pad fade-in" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Work orders</h3>
            <Btn variant="secondary" size="sm" icon="workorder" onClick={() => setRaiseWO(true)}>New</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {linkedWOs.map(w => {
              const doneN = w.steps.filter((s: any) => s.done).length;
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: 12, color: '#1B4FD8', fontWeight: 500 }}>{w.woNum}</span>
                      <Badge status={w.priority} /><Badge status={w.status} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.title}</div>
                    {w.steps.length > 0 && (
                      <div style={{ marginTop: 5 }}>
                        <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${w.steps.length ? Math.round((doneN / w.steps.length) * 100) : 0}%`, height: '100%', background: doneN === w.steps.length ? '#16A34A' : '#1B4FD8', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3, display: 'block' }}>{doneN}/{w.steps.length} steps done</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <Avatar name={w.assignee?.name || '?'} size={24} />
                    <span style={{ fontSize: 12.5, color: '#475569' }}>{w.assignee?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Timeline</h3>
        <div className="tl">
          {t.timeline.map((e, i) => {
            const I = Icons[e.icon] || Icons.clock;
            return (
              <div className="tl-item" key={i}>
                <div className="tl-dot" style={{ borderColor: tlColor[e.kind], color: tlColor[e.kind] }}><I size={11} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{e.text}</span>
                  <span className="mono" style={{ fontSize: 12, color: '#94A3B8' }}>{e.time}</span>
                </div>
                {e.partName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12.5, color: '#475569' }}>
                    <Photo src={null} kind="part" radius={5} style={{ width: 24, height: 24 }} /> Parts used: {e.partName} × {e.partQty}
                  </div>
                )}
                {e.downtime && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>Downtime: {e.downtime}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Comments</h3>
        {t.comments.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14 }}>No comments yet.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          {t.comments.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <Avatar name={c.user?.name || 'User'} size={32} />
              <div>
                <div style={{ fontSize: 13 }}><b>{c.user?.name}</b> <span className="mono" style={{ color: '#94A3B8', fontSize: 11.5 }}>{new Date(c.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div style={{ fontSize: 13.5, color: '#475569', marginTop: 2 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Write a comment…" value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) { S.addComment(t.id, comment); setComment(''); } }} />
          <Btn icon="send" disabled={!comment.trim()} onClick={() => { S.addComment(t.id, comment); setComment(''); }}>Send</Btn>
        </div>
      </div>

      {resolveOpen && <ResolveSheet t={t} onClose={() => setResolveOpen(false)} />}
      {raiseWO && (
        <WOForm
          prefill={{ machineId: t.machineId ?? undefined, ticketId: t.id, ticketNum: t.ticketNum, title: `Repair: ${t.machine?.name ?? t.category}` }}
          onClose={() => setRaiseWO(false)}
        />
      )}
    </div>
  );
}

function ResolveSheet({ t, onClose }: { t: any; onClose: () => void }) {
  const S = useStore();
  const [note, setNote] = useState('');
  const [usePart, setUsePart] = useState(false);
  // Get parts associated with this machine (if any)
  const machineParts = t.machineId
    ? S.parts.filter((p: Part) => p.machines?.some((m: any) => m.machineId === t.machineId))
    : [];
  const part = machineParts[0] || null;

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="slideover">
        <div className="so-head">
          <h3 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Resolve breakdown</h3>
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><Icons.close size={20} /></button>
        </div>
        <div className="so-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 13, color: '#64748B' }}>Resolving <b className="mono" style={{ color: '#0F172A' }}>{t.ticketNum}</b>{t.machine ? ` on ${t.machine.name}` : ''}</div>
          <label className="field">
            <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Resolution note</span>
            <textarea className="textarea" placeholder="What did you do to fix it?" value={note} onChange={e => setNote(e.target.value)} />
          </label>
          {part && (
            <div>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Parts used</span>
              <button onClick={() => setUsePart(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 12, border: '1.5px solid ' + (usePart ? '#1B4FD8' : '#E2E8F0'), borderRadius: 10, background: usePart ? '#EEF2FF' : '#fff', textAlign: 'left' }}>
                <Photo src={part.photoUrl} kind="part" radius={6} style={{ width: 40, height: 40 }} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{part.name} × 1</div><div style={{ fontSize: 12, color: '#64748B' }}>In stock: {part.qty}</div></div>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid ' + (usePart ? '#1B4FD8' : '#CBD5E1'), background: usePart ? '#1B4FD8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{usePart && <Icons.check size={15} style={{ color: '#fff' }} />}</div>
              </button>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>Consuming a part updates stock automatically.</p>
            </div>
          )}
        </div>
        <div className="so-foot">
          <Btn variant="ghost" size="lg" onClick={onClose}>Cancel</Btn>
          <Btn size="lg" block icon="checkcircle" onClick={() => { S.resolveTicket(t.id, note, usePart && part ? part : null); onClose(); }}>Mark resolved</Btn>
        </div>
      </div>
    </>,
    document.body
  );
}
