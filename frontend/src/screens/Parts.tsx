import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { Part, CustomField, fmtINR } from '../types';
import { Badge, Btn, Photo, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle } from '../components/shared';
import { api } from '../api';

export default function PartsInventory() {
  const S = useStore();
  const { parts } = S;
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [openPart, setOpenPart] = useState<Part | null>(null);
  const [stockPart, setStockPart] = useState<Part | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);

  const counts = {
    total: parts.length,
    ok: parts.filter(p => p.status === 'OK').length,
    low: parts.filter(p => p.status === 'LOW_STOCK').length,
    out: parts.filter(p => p.status === 'OUT').length,
  };
  const list = parts.filter(p =>
    (statusF === 'all' || p.status === statusF) &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.machine?.name?.toLowerCase().includes(q.toLowerCase()))
  );

  const handleEdit = (part: Part) => {
    setEditPart(part);
    setShowForm(true);
    setOpenPart(null);
  };

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Spare Parts" right={
        <div style={{ display: 'flex', gap: 10 }} className="hide-mobile">
          <Btn variant="secondary" size="lg" icon="download">Export</Btn>
          <Btn size="lg" icon="plus" onClick={() => { setEditPart(null); setShowForm(true); }}>Add part</Btn>
        </div>
      } />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { k: 'all', l: 'Total', n: counts.total, c: '#0F172A' },
          { k: 'OK', l: 'OK', n: counts.ok, c: '#16A34A' },
          { k: 'LOW_STOCK', l: 'Low', n: counts.low, c: '#D97706' },
          { k: 'OUT', l: 'Out', n: counts.out, c: '#DC2626' },
        ].map(s => (
          <button key={s.k} onClick={() => setStatusF(s.k)} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: statusF === s.k ? '1.5px solid #1B4FD8' : '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-head)', color: s.c }}>{s.n}</span>
            <span style={{ fontSize: 13, color: '#64748B' }}>{s.l}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="searchbox" style={{ maxWidth: 280 }}>
          <Icons.search size={17} style={{ color: '#94A3B8' }} />
          <input placeholder="Search part…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card hide-mobile" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 56 }}></th><th>Part name</th><th>Machine</th><th>Spec</th><th>Qty</th><th>Min</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id} className={p.status === 'OUT' ? 'row-crit' : p.status === 'LOW_STOCK' ? 'row-warn' : ''} style={{ cursor: 'pointer' }} onClick={() => setOpenPart(p)}>
                <td><Photo src={p.photoUrl} kind="part" radius={6} style={{ width: 40, height: 40 }} /></td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: '#475569' }}>{p.machine?.name}</td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{p.spec}</td>
                <td style={{ fontWeight: 600 }}>{p.qty}</td>
                <td style={{ color: '#64748B' }}>{p.minQty}</td>
                <td><Badge status={p.status} /></td>
                <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, padding: '8px 12px' }}>
                  <Btn size="sm" variant="secondary" onClick={() => setStockPart(p)}>Add stock</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => handleEdit(p)}>Edit</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(p => (
          <button key={p.id} onClick={() => setOpenPart(p)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, textAlign: 'left', borderLeft: p.status === 'OUT' ? '4px solid #DC2626' : p.status === 'LOW_STOCK' ? '4px solid #D97706' : '1px solid #E2E8F0', cursor: 'pointer' }}>
            <Photo src={p.photoUrl} kind="part" radius={8} style={{ width: 52, height: 52, flex: '0 0 52px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{p.machine?.name}</div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>Qty <b>{p.qty}</b> · min {p.minQty}</div>
            </div>
            <Badge status={p.status} />
          </button>
        ))}
      </div>

      {openPart && (
        <PartDetail
          part={S.parts.find(p => p.id === openPart.id) || openPart}
          onClose={() => setOpenPart(null)}
          onAddStock={() => { setStockPart(openPart); setOpenPart(null); }}
          onEdit={() => handleEdit(openPart)}
        />
      )}
      {stockPart && <StockSheet part={S.parts.find(p => p.id === stockPart.id) || stockPart} onClose={() => setStockPart(null)} />}
      {showForm && (
        <PartForm
          part={editPart}
          onClose={() => { setShowForm(false); setEditPart(null); }}
          onSaved={() => { setShowForm(false); setEditPart(null); }}
        />
      )}
    </div>
  );
}

/* ---------- Part Form (Add / Edit) ---------- */
function CustomFieldInput({ field, value, onChange }: { field: CustomField; value: string; onChange: (v: string) => void }) {
  if (field.fieldType === 'select' && field.options) {
    return (
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— select —</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input
      className="input"
      type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={field.required}
    />
  );
}

function PartForm({ part, onClose, onSaved }: { part: Part | null; onClose: () => void; onSaved: () => void }) {
  const S = useStore();
  const { machines, customFields } = S;

  const [name, setName] = useState(part?.name ?? '');
  const [machineId, setMachineId] = useState(part?.machineId ?? '');
  const [spec, setSpec] = useState(part?.spec ?? '');
  const [qty, setQty] = useState(String(part?.qty ?? 0));
  const [minQty, setMinQty] = useState(String(part?.minQty ?? 1));
  const [supplier, setSupplier] = useState(part?.supplier ?? '');
  const [cost, setCost] = useState(String(part?.cost ?? 0));
  const [criticality, setCriticality] = useState(part?.criticality ?? 'MEDIUM');
  const [cfValues, setCfValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const partFields = customFields.filter(f => f.entityType === 'PART').sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (part && partFields.length > 0) {
      api.customFields.getValues('PART', part.id).then(fields => {
        const map: Record<string, string> = {};
        fields.forEach(f => { if (f.value) map[f.id] = f.value; });
        setCfValues(map);
      });
    }
  }, [part?.id]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Part name is required.'); return; }
    if (!machineId) { setError('Please select a machine.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name: name.trim(), machineId, spec: spec || null, qty: Number(qty) || 0, minQty: Number(minQty) || 1, supplier: supplier || null, cost: Number(cost) || 0, criticality };
      let savedId: string;
      if (part) {
        await S.updatePart(part.id, payload);
        savedId = part.id;
      } else {
        const created = await S.createPart(payload);
        savedId = created.id;
      }
      // Save custom field values
      if (partFields.length > 0) {
        const values = partFields
          .filter(f => cfValues[f.id] !== undefined && cfValues[f.id] !== '')
          .map(f => ({ fieldId: f.id, value: cfValues[f.id] }));
        if (values.length > 0) await api.customFields.saveValues(savedId, values);
      }
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!part) return;
    if (!window.confirm(`Delete "${part.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await S.deletePart(part.id);
    onSaved();
  };

  return (
    <SlideOver title={part ? `Edit — ${part.name}` : 'Add part'} onClose={onClose} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>
        )}

        {/* Core fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Part name *</span>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. V-Belt A-42" />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Machine *</span>
            <select className="input" value={machineId} onChange={e => setMachineId(e.target.value)}>
              <option value="">— select machine —</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Specification / part number</span>
            <input className="input" value={spec} onChange={e => setSpec(e.target.value)} placeholder="e.g. OEM-VBT-A42" />
          </label>
          <label className="field">
            <span>Current qty</span>
            <input className="input" type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} />
          </label>
          <label className="field">
            <span>Min qty</span>
            <input className="input" type="number" min="1" value={minQty} onChange={e => setMinQty(e.target.value)} />
          </label>
          <label className="field">
            <span>Unit cost (₹)</span>
            <input className="input" type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} />
          </label>
          <label className="field">
            <span>Criticality</span>
            <select className="input" value={criticality} onChange={e => setCriticality(e.target.value)}>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(c => <option key={c} value={c}>{c[0] + c.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Supplier</span>
            <input className="input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" />
          </label>
        </div>

        {/* Dynamic custom fields */}
        {partFields.length > 0 && (
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Additional fields</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {partFields.map(f => (
                <label key={f.id} className="field" style={f.fieldType === 'text' && !f.options ? { gridColumn: '1 / -1' } : {}}>
                  <span>{f.label}{f.required && ' *'}</span>
                  <CustomFieldInput field={f} value={cfValues[f.id] ?? ''} onChange={v => setCfValues(prev => ({ ...prev, [f.id]: v }))} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {part && (
            <Btn variant="danger" onClick={handleDelete} disabled={deleting} style={{ marginRight: 'auto' }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Btn>
          )}
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : part ? 'Save changes' : 'Add part'}</Btn>
        </div>
      </div>
    </SlideOver>
  );
}

/* ---------- Part Detail Slide-over ---------- */
function PartDetail({ part, onClose, onAddStock, onEdit }: { part: Part; onClose: () => void; onAddStock: () => void; onEdit: () => void }) {
  const txns = [
    { d: '+5', who: 'Murugan', date: '12 Feb', note: 'Received from supplier' },
    { d: '-1', who: 'Rajan', date: '13 Feb', note: 'Used on TKT-2025-0038' },
    { d: '-2', who: 'Selvam', date: '13 Feb', note: 'Used on Halfline 1' },
  ];
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="slideover">
        <div className="so-head">
          <h3 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{part.name}</h3>
          <Badge status={part.status} />
          <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={onEdit}><Icons.edit size={18} /></button>
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><Icons.close size={20} /></button>
        </div>
        <div className="so-body">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Photo src={part.photoUrl} kind="part" radius={12} style={{ width: 180, height: 180 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {([['Spec', part.spec], ['Machine', part.machine?.name], ['Criticality', part.criticality], ['Supplier', part.supplier], ['Unit cost', fmtINR(part.cost)]] as [string, string | undefined][]).map(([k, v], i) => (
              <div key={i}><div style={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{v ?? '—'}</div></div>
            ))}
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 20, background: '#F8FAFC', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: 12, color: '#64748B' }}>Current stock</div><div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{part.qty} <span style={{ fontSize: 14, fontWeight: 400, color: '#94A3B8' }}>/ min {part.minQty}</span></div></div>
              <Badge status={part.status} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Btn block icon="plus" onClick={onAddStock}>Add stock</Btn>
              <Btn block variant="secondary" icon="arrowdown">Consume</Btn>
            </div>
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Recent transactions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {txns.map((tx, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < txns.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, color: tx.d.startsWith('+') ? '#16A34A' : '#DC2626', width: 36 }}>{tx.d}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{tx.note}</div><div style={{ fontSize: 11.5, color: '#94A3B8' }}>{tx.who}</div></div>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{tx.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---------- Stock update sheet ---------- */
function StockSheet({ part, onClose }: { part: Part; onClose: () => void }) {
  const S = useStore();
  const [mode, setMode] = useState('add');
  const [qty, setQty] = useState(5);

  const save = () => {
    if (mode === 'add') S.addStock(part.id, qty);
    else S.consumePart(part.id, qty);
    S.toast(`${mode === 'add' ? 'Added' : 'Consumed'} ${qty} × ${part.name}`, mode === 'add' ? 'plus' : 'arrowdown');
    onClose();
  };

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="slideover">
        <div className="so-head">
          <h3 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Update stock</h3>
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onClose}><Icons.close size={20} /></button>
        </div>
        <div className="so-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Photo src={part.photoUrl} kind="part" radius={8} style={{ width: 48, height: 48 }} />
            <div><div style={{ fontWeight: 600 }}>{part.name}</div><div style={{ fontSize: 12.5, color: '#64748B' }}>In stock: {part.qty}</div></div>
          </div>
          <div className="seg" style={{ width: '100%' }}>
            {([['add', 'Add stock'], ['consume', 'Consume'], ['adjust', 'Adjust']] as [string, string][]).map(([k, l]) => (
              <button key={k} className={mode === k ? 'on' : ''} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
          <label className="field">
            <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Quantity</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-secondary btn-md" style={{ width: 44, padding: 0 }} onClick={() => setQty(q => Math.max(1, q - 1))}>–</button>
              <input className="input" type="number" value={qty} onChange={e => setQty(Math.max(1, +e.target.value || 1))} style={{ textAlign: 'center', fontWeight: 600, fontSize: 16 }} />
              <button className="btn btn-secondary btn-md" style={{ width: 44, padding: 0 }} onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </label>
          <label className="field">
            <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Notes (optional)</span>
            <textarea className="textarea" style={{ minHeight: 72 }} placeholder="Reason, supplier, PO number…" />
          </label>
          <div style={{ fontSize: 13, color: '#64748B' }}>New stock will be <b style={{ color: '#0F172A' }}>{mode === 'add' ? part.qty + qty : mode === 'consume' ? Math.max(0, part.qty - qty) : qty}</b></div>
        </div>
        <div className="so-foot">
          <Btn variant="ghost" size="lg" onClick={onClose}>Cancel</Btn>
          <Btn size="lg" block onClick={save}>Save</Btn>
        </div>
      </div>
    </>,
    document.body
  );
}
