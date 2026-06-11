import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { Part, CustomField, fmtINR } from '../types';
import { Badge, Btn, Photo, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle, BulkBar, ImportResultModal, downloadCSV, parseCSV } from '../components/shared';
import { api } from '../api';

export default function PartsInventory() {
  const S = useStore();
  const { parts, units } = S;
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [unitF, setUnitF] = useState('all');
  const [openPart, setOpenPart] = useState<Part | null>(null);
  const [stockPart, setStockPart] = useState<Part | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const isAdmin = S.me?.role === 'Super Admin';

  const counts = {
    total: parts.length,
    ok: parts.filter(p => p.status === 'OK').length,
    low: parts.filter(p => p.status === 'LOW_STOCK').length,
    out: parts.filter(p => p.status === 'OUT').length,
  };

  // Get machine IDs for the selected unit filter
  const unitMachineIds = unitF !== 'all'
    ? S.machines.filter(m => m.unitId === unitF).map(m => m.id)
    : null;

  const list = parts.filter(p => {
    const matchStatus = statusF === 'all' || p.status === statusF;
    const matchUnit = !unitMachineIds || p.machines?.some(m => unitMachineIds.includes(m.machineId));
    const matchQ = p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.machines?.some(m => m.machine?.name?.toLowerCase().includes(q.toLowerCase())) ||
      (p.partNumber ?? '').toLowerCase().includes(q.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchUnit && matchQ;
  });

  const handleEdit = (part: Part) => {
    setEditPart(part);
    setShowForm(true);
    setOpenPart(null);
  };

  const primaryMachine = (p: Part) => p.machines?.[0]?.machine;

  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = list.length > 0 && list.every(p => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map(p => p.id)));

  const handleBulkDelete = async () => {
    const selectedParts = parts.filter(p => selected.has(p.id));
    const shared = selectedParts.filter(p => (p.machines?.length ?? 0) > 1);
    const msg = shared.length > 0
      ? `${shared.length} of the selected part${shared.length !== 1 ? 's are' : ' is'} shared across multiple machines (${shared.map(p => p.name).join(', ')}).\n\nDeleting will remove them from all machines. Continue?`
      : `Delete ${selected.size} part${selected.size !== 1 ? 's' : ''}? This cannot be undone.`;
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try { await S.bulkDeleteParts(Array.from(selected)); setSelected(new Set()); }
    finally { setDeleting(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const rows = parseCSV(text);
    try { const result = await S.importParts(rows); setImportResult(result); }
    finally { setImporting(false); e.target.value = ''; }
  };

  const templateHeaders = ['part_number','name','spec','qty','min_qty','cost','category','criticality','supplier','vendor_name','vendor_phone','location','machine_codes'];
  const templateSample = ['','Bearing 6205','Deep groove ball bearing','10','2','350','Bearing','Medium','SKF India','SKF Store Chennai','+91 98765 43210','Unit A - Shelf 2','MCH-001:2|MCH-003:1'];

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Spare Parts" right={
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }} className="hide-mobile">
          {isAdmin && (
            <>
              <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
              <Btn variant="secondary" size="lg" icon="download" onClick={() => downloadCSV('parts_template.csv', templateHeaders, templateSample)}>Template</Btn>
              <Btn variant="secondary" size="lg" icon="upload" onClick={() => importRef.current?.click()} disabled={importing}>{importing ? 'Importing…' : 'Import CSV'}</Btn>
            </>
          )}
          <Btn size="lg" icon="plus" onClick={() => { setEditPart(null); setShowForm(true); }}>Add part</Btn>
        </div>
      } />

      {/* Stock status KPI row */}
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

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="searchbox" style={{ maxWidth: 260 }}>
          <Icons.search size={17} style={{ color: '#94A3B8' }} />
          <input placeholder="Search part, machine, category…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {/* Unit filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          <button className={'chip ' + (unitF === 'all' ? 'on' : '')} onClick={() => setUnitF('all')}>All units</button>
          {units.map(u => (
            <button key={u.id} className={'chip ' + (unitF === u.id ? 'on' : '')} onClick={() => setUnitF(u.id)}>{u.code}</button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="card hide-mobile" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr>
            {isAdmin && <th style={{ width: 44 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#1B4FD8', cursor: 'pointer' }} /></th>}
            <th style={{ width: 56 }}></th>
            <th>Part no.</th>
            <th>Part name</th>
            <th>Category</th>
            <th>Machines</th>
            <th>Criticality</th>
            <th>Qty</th>
            <th>Min</th>
            <th>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id} className={p.status === 'OUT' ? 'row-crit' : p.status === 'LOW_STOCK' ? 'row-warn' : ''} style={{ cursor: 'pointer' }} onClick={() => setOpenPart(p)}>
                {isAdmin && (
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} style={{ accentColor: '#1B4FD8', cursor: 'pointer' }} />
                  </td>
                )}
                <td><Photo src={p.photoUrl} kind="part" radius={6} style={{ width: 40, height: 40 }} /></td>
                <td><span className="mono" style={{ fontSize: 11.5, color: '#64748B' }}>{p.partNumber || '—'}</span></td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: '#64748B', fontSize: 13 }}>{p.category || '—'}</td>
                <td style={{ color: '#475569', fontSize: 13 }}>
                  {p.machines?.length > 0
                    ? p.machines.slice(0, 2).map(m => m.machine?.name).join(', ') + (p.machines.length > 2 ? ` +${p.machines.length - 2}` : '')
                    : '—'}
                </td>
                <td><Badge status={p.criticality.toUpperCase()} /></td>
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

      {/* Mobile cards */}
      <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(p => (
          <button key={p.id} onClick={() => setOpenPart(p)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, textAlign: 'left', borderLeft: p.status === 'OUT' ? '4px solid #DC2626' : p.status === 'LOW_STOCK' ? '4px solid #D97706' : '1px solid #E2E8F0', cursor: 'pointer' }}>
            <Photo src={p.photoUrl} kind="part" radius={8} style={{ width: 52, height: 52, flex: '0 0 52px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              {p.partNumber && <div className="mono" style={{ fontSize: 11, color: '#94A3B8' }}>{p.partNumber}</div>}
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {p.machines?.length > 0 ? p.machines[0].machine?.name : '—'}
                {p.category ? ` · ${p.category}` : ''}
              </div>
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
      {isAdmin && <BulkBar count={selected.size} onDelete={handleBulkDelete} onClear={() => setSelected(new Set())} deleting={deleting} />}
      <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />
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
  const { machines, customFields, units, partCategories } = S;

  const [name, setName] = useState(part?.name ?? '');
  const [spec, setSpec] = useState(part?.spec ?? '');
  const [qty, setQty] = useState(String(part?.qty ?? 0));
  const [minQty, setMinQty] = useState(String(part?.minQty ?? 1));
  const [supplier, setSupplier] = useState(part?.supplier ?? '');
  const [vendorName, setVendorName] = useState(part?.vendorName ?? '');
  const [vendorPhone, setVendorPhone] = useState(part?.vendorPhone ?? '');
  const [location, setLocation] = useState(part?.location ?? '');
  const [category, setCategory] = useState(part?.category ?? '');
  const [newCategory, setNewCategory] = useState('');
  const [cost, setCost] = useState(String(part?.cost ?? 0));
  const [criticality, setCriticality] = useState(part?.criticality ?? 'Medium');

  // Multi-machine selection: unit → machines, each with qty
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [machineAssociations, setMachineAssociations] = useState<{ machineId: string; qty: number }[]>(
    part?.machines?.map(m => ({ machineId: m.machineId, qty: m.qty ?? 1 })) ?? []
  );

  const [cfValues, setCfValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(part?.photoUrl ?? null);

  const partFields = customFields.filter(f => f.entityType === 'PART').sort((a, b) => a.sortOrder - b.sortOrder);
  const unitMachinesForPicker = selectedUnit ? machines.filter(m => m.unitId === selectedUnit) : [];

  useEffect(() => {
    if (part && partFields.length > 0) {
      api.customFields.getValues('PART', part.id).then(fields => {
        const map: Record<string, string> = {};
        fields.forEach(f => { if (f.value) map[f.id] = f.value; });
        setCfValues(map);
      });
    }
  }, [part?.id]);

  const toggleMachine = (id: string) => {
    setMachineAssociations(prev =>
      prev.some(a => a.machineId === id)
        ? prev.filter(a => a.machineId !== id)
        : [...prev, { machineId: id, qty: 1 }]
    );
  };

  const setMachineQty = (machineId: string, qty: number) => {
    setMachineAssociations(prev =>
      prev.map(a => a.machineId === machineId ? { ...a, qty: Math.max(1, qty) } : a)
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await S.createPartCategory(newCategory.trim());
      setCategory(newCategory.trim());
      setNewCategory('');
    } catch { /* duplicate — ignore */ }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Part name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        machineAssociations,
        spec: spec || null,
        qty: Number(qty) || 0,
        minQty: Number(minQty) || 1,
        supplier: supplier || null,
        vendorName: vendorName || null,
        vendorPhone: vendorPhone || null,
        location: location || null,
        category: category || null,
        cost: Number(cost) || 0,
        criticality,
        photoUrl: photoPreview || null,
      };
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
    <SlideOver title={part ? `Edit — ${part.name}` : 'Add part'} onClose={onClose} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>
        )}

        {/* Part number (display only for existing parts) */}
        {part?.partNumber && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>PART NO.</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: '#1B4FD8' }}>{part.partNumber}</span>
          </div>
        )}

        {/* Photo */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Photo</div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          {photoPreview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={photoPreview} alt="Part" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '1px solid #E2E8F0' }} />
              <button onClick={() => setPhotoPreview(null)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 99, background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.close size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #E2E8F0', borderRadius: 10, padding: '12px 20px', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#64748B' }}>
              <Icons.camera size={20} style={{ color: '#94A3B8' }} />
              Take photo or choose file
            </button>
          )}
        </div>

        {/* Core identity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Part name *</span>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. V-Belt A-42" />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Specification</span>
            <input className="input" value={spec} onChange={e => setSpec(e.target.value)} placeholder="e.g. A-section, 1320mm" />
          </label>

          {/* Category */}
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            <span>Category</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1 }}>
                <option value="">— none —</option>
                {partCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            {/* Inline add new category */}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input className="input" placeholder="Add new category…" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()} style={{ flex: 1, fontSize: 13 }} />
              <Btn size="sm" variant="secondary" onClick={handleAddCategory} disabled={!newCategory.trim()}>Add</Btn>
            </div>
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
              {['Critical', 'High', 'Medium', 'Low'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Location</span>
            <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. TVPM - Shelf A3" />
          </label>
          <label className="field">
            <span>Supplier</span>
            <input className="input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" />
          </label>
          <label className="field">
            <span>Vendor name</span>
            <input className="input" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="Vendor / distributor" />
          </label>
          <label className="field">
            <span>Vendor phone</span>
            <input className="input" type="tel" value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} placeholder="+91 …" />
          </label>
        </div>

        {/* Machine associations — unit-based picker */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Machines using this part</div>

          {/* Unit selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto' }}>
            {units.map(u => (
              <button key={u.id} className={'chip ' + (selectedUnit === u.id ? 'on' : '')} onClick={() => setSelectedUnit(selectedUnit === u.id ? '' : u.id)}>
                {u.code}
              </button>
            ))}
          </div>

          {selectedUnit && unitMachinesForPicker.length > 0 && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
              {unitMachinesForPicker.map((m, i) => {
                const assoc = machineAssociations.find(a => a.machineId === m.id);
                const selected = !!assoc;
                const photo = m.photos?.[0]?.url ?? null;
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: selected ? '#EEF2FF' : '#fff', borderBottom: i < unitMachinesForPicker.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <button onClick={() => toggleMachine(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, textAlign: 'left', cursor: 'pointer' }}>
                      <Photo src={photo} kind="machine" radius={6} style={{ width: 34, height: 34, flex: '0 0 34px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>{m.section}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid ' + (selected ? '#1B4FD8' : '#CBD5E1'), background: selected ? '#1B4FD8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selected && <Icons.check size={13} style={{ color: '#fff' }} />}
                      </div>
                    </button>
                    {selected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: '#64748B' }}>Qty</span>
                        <input
                          type="number" min="1" value={assoc.qty}
                          onChange={e => setMachineQty(m.id, Number(e.target.value))}
                          onClick={e => e.stopPropagation()}
                          style={{ width: 52, padding: '3px 6px', fontSize: 13, border: '1px solid #C7D2FE', borderRadius: 6, textAlign: 'center', background: '#fff' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show selected machines summary with qty */}
          {machineAssociations.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {machineAssociations.map(({ machineId, qty: mQty }) => {
                const m = machines.find(x => x.id === machineId);
                return m ? (
                  <span key={machineId} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: '#EEF2FF', border: '1px solid #C7D2FE', fontSize: 12, color: '#1B4FD8', fontWeight: 500 }}>
                    {m.name}
                    {mQty > 1 && <span style={{ background: '#1B4FD8', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 11 }}>×{mQty}</span>}
                    <button onClick={() => toggleMachine(machineId)} style={{ color: '#1B4FD8', padding: 0 }}><Icons.close size={12} /></button>
                  </span>
                ) : null;
              })}
            </div>
          )}
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
  const S = useStore();
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    api.parts.get(part.id).then(full => setTxns(full.transactions ?? []));
  }, [part.id]);

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

          {part.partNumber && (
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 13, color: '#1B4FD8', fontWeight: 600 }}>{part.partNumber}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {([
              ['Spec', part.spec],
              ['Category', part.category],
              ['Criticality', part.criticality],
              ['Supplier', part.supplier],
              ['Vendor', part.vendorName],
              ['Vendor phone', part.vendorPhone],
              ['Location', part.location],
              ['Unit cost', fmtINR(part.cost)],
            ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([k, v], i) => (
              <div key={i}>
                <div style={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{v ?? '—'}</div>
              </div>
            ))}
          </div>

          {/* Machines */}
          {part.machines?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Used on machines</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {part.machines.map(m => (
                  <span key={m.id} style={{ padding: '4px 10px', borderRadius: 99, background: '#F1F5F9', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                    {m.machine?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

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
          {txns.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8' }}>No transactions yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {txns.map((tx, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < txns.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, color: tx.type === 'ADD' ? '#16A34A' : '#DC2626', width: 36 }}>{tx.type === 'ADD' ? '+' : '-'}{tx.qty}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{tx.notes || tx.type}</div><div style={{ fontSize: 11.5, color: '#94A3B8' }}>{tx.user?.name}</div></div>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
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
  const [notes, setNotes] = useState('');

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
            <div>
              <div style={{ fontWeight: 600 }}>{part.name}</div>
              {part.partNumber && <div className="mono" style={{ fontSize: 11, color: '#94A3B8' }}>{part.partNumber}</div>}
              <div style={{ fontSize: 12.5, color: '#64748B' }}>In stock: {part.qty}</div>
            </div>
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
            <textarea className="textarea" style={{ minHeight: 72 }} placeholder="Reason, supplier, PO number…" value={notes} onChange={e => setNotes(e.target.value)} />
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
