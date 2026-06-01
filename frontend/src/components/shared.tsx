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
