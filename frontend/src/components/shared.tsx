import React from 'react';
import { useStore } from '../store';
import { Machine } from '../types';
import { Photo, Badge } from './ui';
import { Icons } from './icons';

/* Machine grid card (image-first) */
export function MachineCard({ m }: { m: Machine }) {
  const { nav, units } = useStore();
  const unit = units.find(u => u.id === m.unitId);
  const photo = m.photos?.[0]?.url ?? null;
  return (
    <button onClick={() => nav('machineDetail', { id: m.id })} className="card fade-in" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow .15s, transform .12s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(15,23,42,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}>
      <Photo src={photo} kind="machine" radius="12px 12px 0 0" style={{ height: 160 }}
        overlay={<>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.35), transparent 45%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 12, left: 12 }}><Badge status={m.status} /></div>
          <div style={{ position: 'absolute', top: 12, right: 12 }}><span className="badge b-neut" style={{ background: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>{unit?.code}</span></div>
        </>} />
      <div style={{ padding: '13px 16px' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14.5 }}>{m.name}</div>
        <div className="mono" style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{m.code}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12, color: '#64748B' }}>
          <span>{m.section}</span>
          <span>Last PM: {m.lastPM}</span>
        </div>
      </div>
    </button>
  );
}

/* Machine inline row */
export function MachineMini({ m, size = 40, code = true }: { m: Machine; size?: number; code?: boolean }) {
  const { units } = useStore();
  const unit = units.find(u => u.id === m.unitId);
  const photo = m.photos?.[0]?.url ?? null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <Photo src={photo} kind="machine" radius={8} style={{ width: size, height: size, flex: `0 0 ${size}px` }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
        <div style={{ fontSize: 12, color: '#6B7280' }} className={code ? 'mono' : ''}>{code ? m.code : `${unit?.code} / ${m.section}`}</div>
      </div>
    </div>
  );
}

/* Section header with optional action */
export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* Page title row */
export function PageTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h1>
      {right}
    </div>
  );
}

/* Filter bar */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>{children}</div>;
}

/* Dropdown button */
export function Drop({ label }: { label: string }) {
  return <button className="fdrop">{label}<Icons.chevdown size={15} style={{ color: '#94A3B8' }} /></button>;
}

/* ─── CSV utilities ─────────────────────────────────────────────────────── */
export function downloadCSV(filename: string, headers: string[], sampleRow: string[]) {
  const rows = [headers.join(','), sampleRow.map(v => v.includes(',') ? `"${v}"` : v).join(',')];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

/* ─── Floating bulk action bar ──────────────────────────────────────────── */
export function BulkBar({ count, onDelete, onClear, deleting }: {
  count: number; onDelete: () => void; onClear: () => void; deleting?: boolean;
}) {
  if (count === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#0F172A', color: '#fff', borderRadius: 14, padding: '12px 20px',
      display: 'flex', alignItems: 'center', gap: 16, zIndex: 200,
      boxShadow: '0 8px 32px rgba(15,23,42,0.35)', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{count} selected</span>
      <button onClick={onClear} style={{ fontSize: 13, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear</button>
      <button onClick={onDelete} disabled={deleting} style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
        {deleting ? 'Deleting…' : 'Delete selected'}
      </button>
    </div>
  );
}

/* ─── Import result modal ───────────────────────────────────────────────── */
export function ImportResultModal({ result, onClose }: {
  result: { created: number; errors: string[] } | null; onClose: () => void;
}) {
  if (!result) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>Import complete</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#16A34A' }}>{result.created}</div>
            <div style={{ fontSize: 12, color: '#16A34A' }}>Created</div>
          </div>
          {result.errors.length > 0 && (
            <div style={{ flex: 1, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#DC2626' }}>{result.errors.length}</div>
              <div style={{ fontSize: 12, color: '#DC2626' }}>Errors</div>
            </div>
          )}
        </div>
        {result.errors.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>Row errors:</div>
            {result.errors.map((e, i) => (
              <div key={i} style={{ fontSize: 12.5, color: '#7F1D1D', marginBottom: 4 }}>• {e}</div>
            ))}
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '10px', background: '#1B4FD8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}
