import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { fmtINR } from '../types';
import { Btn, Photo } from '../components/ui';
import { Icons } from '../components/icons';
import { SectionHead, PageTitle } from '../components/shared';

function Donut({ segments, size = 150, thickness = 22, center }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} strokeLinecap="butt" />;
          off += len; return el;
        })}
      </svg>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{center}</div>}
    </div>
  );
}

function HBar({ rows, unit = '' }: { rows: { label: string; value: number; display?: string; color?: string }[]; unit?: string }) {
  const m = Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 128, fontSize: 13, color: '#475569', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
          <div style={{ flex: 1, height: 22, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(r.value / m) * 100}%`, height: '100%', background: r.color || '#1B4FD8', borderRadius: 6, transition: 'width .5s ease' }} />
          </div>
          <div style={{ width: 64, fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{r.display ?? (r.value + unit)}</div>
        </div>
      ))}
    </div>
  );
}

function StackBars({ days }: { days: { label: string; crit: number; high: number; med: number; low: number }[] }) {
  const max = Math.max(...days.map(d => d.crit + d.high + d.med + d.low), 1);
  const seg: [string, string][] = [['crit', '#DC2626'], ['high', '#C2410C'], ['med', '#D97706'], ['low', '#94A3B8']];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 170, paddingTop: 10 }}>
      {days.map((d, i) => {
        const tot = d.crit + d.high + d.med + d.low;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
            <div style={{ flex: 1, width: '100%', maxWidth: 38, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
              {seg.map(([k, c]) => (d as any)[k] > 0 && <div key={k} style={{ height: `${((d as any)[k] / max) * 100}%`, background: c, borderRadius: k === 'crit' ? '4px 4px 0 0' : 0 }} />)}
              {tot === 0 && <div style={{ height: 3, background: '#E2E8F0', borderRadius: 2 }} />}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function rangeCutoff(range: string): Date {
  const now = new Date();
  if (range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
  if (range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
  // quarter: beginning of current quarter
  const q = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), q * 3, 1);
}

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { tickets, parts, pmTasks, machines, workOrders } = useStore();
  const [range, setRange] = useState('7d');

  const cutoff = useMemo(() => rangeCutoff(range), [range]);
  const rangeLabel = range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'This quarter';

  // ── Filter all time-sensitive data by selected range ──────────────────────
  const filteredTickets = useMemo(
    () => tickets.filter(t => new Date(t.raisedAt) >= cutoff),
    [tickets, cutoff]
  );
  const filteredWOs = useMemo(
    () => workOrders.filter(w => new Date(w.createdAt ?? w.updatedAt ?? 0) >= cutoff),
    [workOrders, cutoff]
  );

  // PM compliance is snapshot-based (overdue/due state), not time-filtered
  const pmOverdue = pmTasks.filter(p => p.state === 'OVERDUE').length;
  const pmDueToday = pmTasks.filter(p => p.state === 'DUE').length;
  const pmCompliance = Math.round(((pmTasks.length - pmOverdue) / (pmTasks.length || 1)) * 100);

  const spareSpend = parts.reduce((s, p) => s + (p.cost ?? 0) * Math.max(0, (p.qty ?? 0)), 0);

  // ── Tickets per day (bucketed into range) ─────────────────────────────────
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const barDays = range === '7d' ? 7 : range === '30d' ? 30 : Math.round((Date.now() - cutoff.getTime()) / 86400000);
  // Show at most 12 bars; group days if range > 12 days
  const barCount = Math.min(barDays, 12);
  const daysPerBar = Math.ceil(barDays / barCount);

  const days = Array.from({ length: barCount }, (_, i) => {
    const from = new Date(cutoff);
    from.setDate(from.getDate() + i * daysPerBar);
    const to = new Date(from);
    to.setDate(to.getDate() + daysPerBar);
    const dayTickets = filteredTickets.filter(t => {
      const ts = new Date(t.raisedAt).getTime();
      return ts >= from.getTime() && ts < to.getTime();
    });
    const label = daysPerBar === 1
      ? DAY_LABELS[from.getDay()]
      : `${from.getDate()}/${from.getMonth() + 1}`;
    return {
      label,
      crit: dayTickets.filter(t => t.severity === 'CRITICAL').length,
      high: dayTickets.filter(t => t.severity === 'HIGH').length,
      med: dayTickets.filter(t => t.severity === 'MEDIUM').length,
      low: dayTickets.filter(t => t.severity === 'LOW').length,
    };
  });

  // ── Ticket status donut ──────────────────────────────────────────────────
  const statusSeg = [
    { label: 'Open', value: filteredTickets.filter(t => t.status === 'OPEN').length, color: '#1D4ED8' },
    { label: 'In progress', value: filteredTickets.filter(t => ['ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status)).length, color: '#D97706' },
    { label: 'Resolved', value: filteredTickets.filter(t => t.status === 'RESOLVED').length, color: '#16A34A' },
    { label: 'Closed', value: filteredTickets.filter(t => t.status === 'CLOSED').length, color: '#94A3B8' },
  ];
  const totalT = statusSeg.reduce((s, x) => s + x.value, 0);

  // ── Top problem machines: most tickets ───────────────────────────────────
  const ticketsByMachine: Record<string, number> = {};
  filteredTickets.forEach(t => { ticketsByMachine[t.machineId] = (ticketsByMachine[t.machineId] ?? 0) + 1; });
  const topMachineIds = Object.entries(ticketsByMachine)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const machineMap = Object.fromEntries(machines.map(m => [m.id, m]));

  const downtimeByMachine = topMachineIds.map(id => {
    const count = ticketsByMachine[id];
    const m = machineMap[id];
    return {
      label: m?.name ?? id,
      value: count,
      display: `${count} ticket${count !== 1 ? 's' : ''}`,
      color: count >= 4 ? '#DC2626' : count >= 2 ? '#C2410C' : '#D97706',
    };
  });

  const problemMachines = topMachineIds.map(id => {
    const m = machineMap[id];
    const woForMachine = filteredWOs.filter(w => w.machineId === id && w.status === 'COMPLETED');
    return { id, machine: m, tickets: ticketsByMachine[id], workOrders: woForMachine.length };
  });

  // ── KPI cards ────────────────────────────────────────────────────────────
  const openCount = filteredTickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status)).length;
  const resolvedCount = filteredTickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  const kpis = [
    { lbl: 'Total tickets', val: String(totalT), delta: `${openCount} open · ${resolvedCount} resolved`, good: null },
    { lbl: 'Open right now', val: String(openCount), delta: filteredTickets.filter(t => t.severity === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length + ' critical', good: openCount === 0 },
    { lbl: 'PM compliance', val: `${pmCompliance}%`, delta: `${pmOverdue} overdue · ${pmDueToday} due today`, good: pmCompliance >= 90 },
    { lbl: 'Work orders done', val: String(filteredWOs.filter(w => w.status === 'COMPLETED').length), delta: `${filteredWOs.filter(w => w.status === 'IN_PROGRESS').length} in progress`, good: null },
    { lbl: 'Spare-parts value', val: fmtINR(spareSpend), delta: `${parts.length} parts tracked`, good: null },
  ];

  function handleExport() {
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows: string[][] = [
      ['Ticket #', 'Machine', 'Severity', 'Status', 'Type', 'Title', 'Raised At'],
      ...filteredTickets.map(t => [
        t.ticketNum ?? '',
        machineMap[t.machineId]?.name ?? t.machineId,
        t.severity,
        t.status,
        t.type ?? '',
        t.title ?? '',
        new Date(t.raisedAt).toLocaleString('en-IN'),
      ]),
    ];
    exportCSV(rows, `machineops-tickets-${range}-${dateStr}.csv`);
  }

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Reports" right={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="seg hide-mobile">
            {([['7d', '7 days'], ['30d', '30 days'], ['qtr', 'Quarter']] as [string, string][]).map(([k, l]) => (
              <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>
            ))}
          </div>
          <Btn variant="secondary" size="lg" icon="download" onClick={handleExport}>Export</Btn>
        </div>
      } />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            <div className="lbl">{k.lbl}</div>
            <div className="num" style={{ fontSize: 26 }}>{k.val}</div>
            <div className="delta" style={{ color: k.good === true ? '#16A34A' : k.good === false ? '#DC2626' : '#64748B' }}>
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }} className="rep-row">
        <div className="card card-pad">
          <SectionHead title="Tickets raised" sub={rangeLabel + ', by severity'} />
          <StackBars days={days} />
          <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
            {([['Critical', '#DC2626'], ['High', '#C2410C'], ['Medium', '#D97706'], ['Low', '#94A3B8']] as [string, string][]).map(([l, c]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}</span>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <SectionHead title="By status" sub={`${totalT} tickets · ${rangeLabel.toLowerCase()}`} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut segments={statusSeg} center={<><div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{totalT}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>tickets</div></>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {statusSeg.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                  <span style={{ flex: 1, color: '#475569' }}>{s.label}</span>
                  <b>{s.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }} className="rep-row">
        <div className="card card-pad">
          <SectionHead title="Most tickets by machine" sub={`Top 5 · ${rangeLabel.toLowerCase()}`} />
          {downtimeByMachine.length > 0
            ? <HBar rows={downtimeByMachine} />
            : <p style={{ fontSize: 13, color: '#94A3B8' }}>No tickets in this period.</p>}
        </div>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHead title="PM compliance" sub="Completed vs scheduled" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Donut size={150} thickness={20}
              segments={[
                { label: 'On time', value: pmCompliance, color: '#16A34A' },
                { label: 'Overdue', value: 100 - pmCompliance, color: '#FEE2E2' },
              ]}
              center={<><div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{pmCompliance}%</div><div style={{ fontSize: 11, color: '#94A3B8' }}>on time</div></>}
            />
            <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>{pmOverdue} overdue · {pmDueToday} due today</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px' }}><SectionHead title="Top problem machines" sub={`Most tickets · ${rangeLabel.toLowerCase()}`} /></div>
        {problemMachines.length > 0 ? (
          <table className="tbl">
            <thead><tr><th style={{ width: 56 }}></th><th>Machine</th><th>Tickets</th><th>WOs done</th><th></th></tr></thead>
            <tbody>
              {problemMachines.map(p => {
                const m = p.machine;
                const photo = m?.photos?.[0]?.url ?? null;
                return (
                  <tr key={p.id}>
                    <td><Photo src={photo} kind="machine" radius={6} style={{ width: 40, height: 40 }} /></td>
                    <td style={{ fontWeight: 600 }}>{m?.name ?? p.id}<div className="mono" style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 400 }}>{m?.code}</div></td>
                    <td style={{ color: p.tickets >= 4 ? '#DC2626' : '#0F172A', fontWeight: 600 }}>{p.tickets}</td>
                    <td style={{ color: '#475569' }}>{p.workOrders}</td>
                    <td><span className="badge b-neut">{m?.unitId?.toUpperCase()}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '24px 20px', fontSize: 13, color: '#94A3B8' }}>No ticket data in this period.</div>
        )}
      </div>
    </div>
  );
}
