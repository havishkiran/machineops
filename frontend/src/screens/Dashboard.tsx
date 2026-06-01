import React, { useState } from 'react';
import { useStore } from '../store';
import { Badge, Btn, Photo } from '../components/ui';
import { Icons } from '../components/icons';
import { MachineCard, SectionHead, PageTitle } from '../components/shared';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { nav, tickets, parts, machines, pmTasks, units, org } = useStore();
  const [unit, setUnit] = useState('all');

  const openTickets = tickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status));
  const critOpen = openTickets.filter(t => t.severity === 'CRITICAL').length;
  const pmOverdue = pmTasks.filter(p => p.state === 'OVERDUE').length;
  const pmDueToday = pmTasks.filter(p => p.state === 'DUE').length;
  const pmDue = pmOverdue + pmDueToday;
  const online = machines.filter(m => m.status === 'WORKING').length;
  const down = machines.filter(m => m.status === 'CRITICAL' || m.status === 'WARNING').length;
  const idle = machines.filter(m => m.status === 'IDLE').length;
  const outOfStock = parts.filter(p => p.status === 'OUT').length;
  const lowStock = parts.filter(p => p.status === 'LOW_STOCK').length;
  const lowParts = outOfStock + lowStock;

  // Tickets created today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const newToday = tickets.filter(t => new Date(t.raisedAt) >= todayStart).length;
  const newCritToday = tickets.filter(t => new Date(t.raisedAt) >= todayStart && t.severity === 'CRITICAL').length;

  const shown = unit === 'all' ? machines : machines.filter(m => m.unitId === unit);
  const needsAttention = openTickets.filter(t => ['CRITICAL', 'HIGH'].includes(t.severity)).slice(0, 4);
  const overduePM = pmTasks.filter(p => p.state === 'OVERDUE');

  const kpis = [
    {
      badge: 'CRITICAL', num: critOpen, lbl: 'Open critical tickets',
      delta: newCritToday > 0 ? `↑ ${newCritToday} new today` : 'None new today',
      deltaColor: newCritToday > 0 ? '#DC2626' : '#16A34A',
      go: () => nav('tickets'),
    },
    {
      badge: 'WARNING', num: pmDue, lbl: 'PM due / overdue',
      delta: `${pmOverdue} overdue · ${pmDueToday} due today`,
      deltaColor: pmOverdue > 0 ? '#D97706' : '#6B7280',
      go: () => nav('maintenance'),
    },
    {
      badge: 'WORKING', num: `${online}/${machines.length}`, lbl: 'Machines online',
      delta: down > 0 || idle > 0 ? `${down} down${idle > 0 ? ` · ${idle} idle` : ''}` : 'All operational',
      deltaColor: down > 0 ? '#DC2626' : idle > 0 ? '#D97706' : '#16A34A',
      go: () => nav('machines'),
    },
    {
      badge: 'LOW_STOCK', num: lowParts, lbl: 'Parts low / out',
      delta: outOfStock > 0 ? `${outOfStock} out of stock` : lowStock > 0 ? `${lowStock} low stock` : 'All stocked',
      deltaColor: outOfStock > 0 ? '#DC2626' : lowStock > 0 ? '#D97706' : '#16A34A',
      go: () => nav('parts'),
    },
  ];

  // Build activity feed from real data
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime())
    .slice(0, 4);
  const lowPartsList = parts.filter(p => p.status === 'LOW_STOCK' || p.status === 'OUT').slice(0, 2);

  type ActivityItem = { kind: string; icon: string; text: string; who: string; time: string };
  const activity: ActivityItem[] = [
    ...recentTickets.map(t => ({
      kind: t.severity === 'CRITICAL' ? 'crit' : t.severity === 'HIGH' ? 'high' : t.status === 'RESOLVED' ? 'ok' : 'info',
      icon: t.status === 'RESOLVED' ? 'checkcircle' : t.severity === 'CRITICAL' ? 'alert' : 'ticket',
      text: `${t.status === 'RESOLVED' ? 'Resolved' : 'Ticket raised'}: ${t.machine?.name} — ${t.title}`,
      who: t.raisedBy?.name ?? 'Unknown',
      time: timeAgo(t.raisedAt),
    })),
    ...lowPartsList.map(p => ({
      kind: p.status === 'OUT' ? 'crit' : 'warn',
      icon: 'box',
      text: `${p.status === 'OUT' ? 'Out of stock' : 'Low stock'}: ${p.name} (${p.qty} remaining)`,
      who: 'System',
      time: 'Now',
    })),
  ].slice(0, 6);

  const tlColor: Record<string, string> = { crit: '#DC2626', high: '#C2410C', warn: '#D97706', ok: '#16A34A', info: '#1D4ED8', neut: '#6B7280' };

  return (
    <div className="content-pad fade-in">
      <PageTitle title="Dashboard" right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hide-mobile">
          <span style={{ fontSize: 13, color: '#64748B' }}>{fmtDate(new Date())} · {org?.unitCode ?? ''}</span>
          <Btn icon="plus" onClick={() => nav('raise')}>Raise ticket</Btn>
        </div>
      } />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <button key={i} className="kpi" onClick={k.go} style={{ textAlign: 'left', cursor: 'pointer' }}>
            <Badge status={k.badge} />
            <div className="num">{k.num}</div>
            <div className="lbl">{k.lbl}</div>
            <div className="delta" style={{ color: k.deltaColor }}>{k.delta}</div>
          </button>
        ))}
      </div>

      {/* Machine grid */}
      <SectionHead title="All machines" right={
        <div className="seg">
          {[{ id: 'all', code: 'All' }, ...units].map(u => (
            <button key={u.id} className={unit === u.id ? 'on' : ''} onClick={() => setUnit(u.id)}>{u.code}</button>
          ))}
        </div>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginBottom: 28 }}>
        {shown.map(m => <MachineCard key={m.id} m={m} />)}
      </div>

      {/* Two-column */}
      <div className="dash-2col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Needs attention */}
        <div className="card card-pad">
          <SectionHead title="Needs attention" sub={`${needsAttention.length} critical & high tickets open`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {needsAttention.map(t => {
              const m = t.machine;
              const col = t.severity === 'CRITICAL' ? { b: '#DC2626', bg: '#FEF2F2' } : { b: '#C2410C', bg: '#FFF7ED' };
              const photo = m?.photos?.[0]?.url ?? null;
              return (
                <button key={t.id} onClick={() => nav('ticketDetail', { id: t.ticketNum })} style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: '12px 14px', borderRadius: '0 12px 12px 0', borderLeft: `4px solid ${col.b}`, background: col.bg, cursor: 'pointer' }}>
                  <Photo src={photo} kind="machine" radius={8} style={{ width: 48, height: 48, flex: '0 0 48px' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge status={t.severity} />
                      <span className="mono" style={{ fontSize: 11.5, color: '#64748B' }}>{t.ticketNum}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{m?.name}</div>
                  </div>
                  <Icons.chevright size={18} style={{ color: '#94A3B8', flex: '0 0 18px' }} />
                </button>
              );
            })}
            {needsAttention.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8' }}>No critical tickets open.</p>}
          </div>
        </div>

        {/* Overdue PM */}
        <div className="card card-pad">
          <SectionHead title="Overdue PM" sub={`${overduePM.length} tasks past due`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {overduePM.map(p => {
              const m = p.machine;
              const photo = m?.photos?.[0]?.url ?? null;
              return (
                <button key={p.id} onClick={() => nav('maintenance')} style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: '10px 8px', borderRadius: 8, cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <Photo src={photo} kind="machine" radius={8} style={{ width: 40, height: 40, flex: '0 0 40px' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.task}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{m?.name}</div>
                  </div>
                  <span style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 600, flex: '0 0 auto' }}>{p.overdueBy}</span>
                </button>
              );
            })}
            {overduePM.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8' }}>No overdue PM tasks.</p>}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="card card-pad">
        <SectionHead title="Recent activity" sub={newToday > 0 ? `${newToday} ticket${newToday > 1 ? 's' : ''} raised today` : undefined} />
        {activity.length === 0
          ? <p style={{ fontSize: 13, color: '#94A3B8' }}>No recent activity.</p>
          : (
            <div className="tl">
              {activity.map((a, i) => {
                const I = Icons[a.icon as keyof typeof Icons] || Icons.bell;
                return (
                  <div className="tl-item" key={i}>
                    <div className="tl-dot" style={{ borderColor: tlColor[a.kind] ?? '#6B7280', color: tlColor[a.kind] ?? '#6B7280' }}><I size={11} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13.5 }}>{a.text}</span>
                      <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{a.who}</div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
