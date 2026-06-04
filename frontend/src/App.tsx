import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from './store';
import { Icons } from './components/icons';
import { LogoFull, LogoMark, Avatar, Btn, EmptyState, ToastContainer } from './components/ui';

// Screens
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import { MachineList, MachineDetail } from './screens/Machines';
import { TicketList, TicketDetail, RaiseTicket } from './screens/Tickets';
import Parts from './screens/Parts';
import PM from './screens/PM';
import Reports from './screens/Reports';
import WorkOrders from './screens/WorkOrders';
import Settings from './screens/Settings';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'machines', label: 'Machines', icon: 'machine' },
  { key: 'tickets', label: 'Breakdowns', icon: 'ticket', badge: 'open' },
  { key: 'maintenance', label: 'Maintenance', icon: 'maintenance' },
  { key: 'parts', label: 'Spare Parts', icon: 'parts' },
  { key: 'workorders', label: 'Work Orders', icon: 'workorder' },
  { key: 'reports', label: 'Reports', icon: 'reports' },
  { key: '__div', divider: true },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const ACTIVE_FOR: Record<string, string> = {
  dashboard: 'dashboard', machines: 'machines', machineDetail: 'machines',
  tickets: 'tickets', ticketDetail: 'tickets', raise: 'tickets',
  maintenance: 'maintenance', parts: 'parts',
  workorders: 'workorders', reports: 'reports', settings: 'settings',
};

function Sidebar() {
  const { route, nav, tickets, logout, org, me } = useStore();
  const active = ACTIVE_FOR[route.screen];
  const openCount = tickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status)).length;
  const displayName = me?.name || 'Havish';
  const displayRole = me?.role || 'Shift Supervisor';
  const orgName = org?.name || 'Rajashree Match Works';
  const orgUnit = org?.unitCode || 'TVPM';

  return (
    <aside className="sidebar">
      <div className="sb-logo"><LogoFull reversed /></div>
      <div className="sb-org"><Icons.pin size={13} /> {orgName} · {orgUnit}</div>
      <div className="sb-divider" />
      <nav className="sb-nav">
        {NAV.map(n => n.divider
          ? <div key="d" className="sb-divider" style={{ margin: '10px 4px' }} />
          : (
            <button key={n.key} className={'sb-item ' + (active === n.key ? 'active' : '')} onClick={() => nav(n.key)}>
              {React.createElement(Icons[n.icon!], { size: 20, className: 'ic' })}
              <span>{n.label}</span>
              {n.badge === 'open' && openCount > 0 && <span className="count">{openCount}</span>}
            </button>
          ))}
      </nav>
      <div className="sb-foot">
        <Avatar name={displayName} size={32} />
        <div style={{ minWidth: 0 }}>
          <div className="nm">{displayName}</div>
          <div className="rl">{displayRole}</div>
        </div>
        <button className="lo" title="Log out" onClick={logout}><Icons.logout size={18} /></button>
      </div>
    </aside>
  );
}

function Topbar() {
  const { route, nav, tickets } = useStore();
  const openCount = tickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status)).length;
  const crumbs: Record<string, string[]> = {
    dashboard: ['Dashboard'], machines: ['Machines'], machineDetail: ['Machines', 'Detail'],
    tickets: ['Breakdowns'], ticketDetail: ['Breakdowns', 'Detail'], maintenance: ['Maintenance'],
    parts: ['Spare Parts'], workorders: ['Work Orders'], reports: ['Reports'], settings: ['Settings'],
  };
  const breadcrumbs = crumbs[route.screen] || ['Dashboard'];
  const cta: Record<string, { label: string; go: () => void }> = {};
  const ctaItem = cta[route.screen];

  return (
    <header className="topbar">
      <div className="crumb">
        {breadcrumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icons.chevright size={14} style={{ color: '#CBD5E1' }} />}
            {i === breadcrumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      <button style={{ position: 'relative', padding: 8, color: '#64748B', borderRadius: 8 }} onClick={() => nav('tickets')}>
        <Icons.bell size={20} />
        {openCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 99, background: '#DC2626' }} />}
      </button>
      {ctaItem && <Btn icon="plus" onClick={ctaItem.go}>{ctaItem.label}</Btn>}
    </header>
  );
}

function MobileTop() {
  const { route, nav, tickets } = useStore();
  const openCount = tickets.filter(t => ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'].includes(t.status)).length;
  const titles: Record<string, string> = {
    dashboard: 'Dashboard', machines: 'Machines', machineDetail: 'Machine',
    tickets: 'Breakdowns', ticketDetail: 'Breakdown', maintenance: 'Maintenance',
    parts: 'Spare Parts', workorders: 'Work Orders', reports: 'Reports', settings: 'Settings',
  };
  const title = titles[route.screen] || 'MachineOps';
  return (
    <div className="mtop">
      <LogoMark size={26} rounded={7} />
      <span className="t">{title}</span>
      <span className="spacer" />
      <button style={{ position: 'relative', padding: 6, color: '#64748B' }} onClick={() => nav('tickets')}>
        <Icons.bell size={20} />
        {openCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 99, background: '#DC2626' }} />}
      </button>
    </div>
  );
}

function MobileTab() {
  const { route, nav, logout } = useStore();
  const [sheet, setSheet] = useState(false);
  const active = ACTIVE_FOR[route.screen];
  const tabs = [
    { key: 'dashboard', label: 'Home', icon: 'home' },
    { key: 'machines', label: 'Machines', icon: 'machine' },
    { key: 'raise', label: 'Report', raise: true },
    { key: 'maintenance', label: 'Maint.', icon: 'maintenance' },
    { key: 'more', label: 'More', icon: 'more' },
  ];
  return (
    <>
      <nav className="mtab">
        {tabs.map(t => t.raise ? (
          <button key="raise" className="ti raise" onClick={() => nav('raise')}>
            <span className="fab"><Icons.plus size={26} /></span>
          </button>
        ) : (
          <button key={t.key} className={'ti ' + (active === t.key ? 'active' : '')} onClick={() => t.key === 'more' ? setSheet(true) : nav(t.key)}>
            {React.createElement(Icons[t.icon!], { size: 22 })}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      {sheet && createPortal(
        <>
          <div className="scrim" onClick={() => setSheet(false)} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 62, borderRadius: '16px 16px 0 0', padding: '10px 12px calc(20px + env(safe-area-inset-bottom))', boxShadow: 'var(--shadow-xl)', animation: 'slidein .22s ease' }}>
            <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 99, margin: '4px auto 12px' }} />
            {[{ k: 'parts', l: 'Spare Parts', i: 'parts' }, { k: 'workorders', l: 'Work Orders', i: 'workorder' }, { k: 'reports', l: 'Reports', i: 'reports' }, { k: 'settings', l: 'Settings', i: 'settings' }].map(it => (
              <button key={it.k} onClick={() => { nav(it.k); setSheet(false); }} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 12px', fontSize: 15, fontWeight: 500, color: '#0F172A', textAlign: 'left', borderRadius: 10 }}>
                {React.createElement(Icons[it.i], { size: 22, style: { color: '#64748B' } })}{it.l}
              </button>
            ))}
            <div className="divider" style={{ margin: '6px 0' }} />
            <button onClick={() => { logout(); setSheet(false); }} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 12px', fontSize: 15, fontWeight: 500, color: '#DC2626', textAlign: 'left', borderRadius: 10 }}>
              <Icons.logout size={22} /> Log out
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function Router() {
  const { route } = useStore();
  const { screen, params } = route;

  switch (screen) {
    case 'dashboard': return <Dashboard />;
    case 'machines': return <MachineList />;
    case 'machineDetail': return <MachineDetail id={params.id} />;
    case 'tickets': return <TicketList />;
    case 'ticketDetail': return <TicketDetail id={params.id} />;
    case 'parts': return <Parts />;
    case 'maintenance': return <PM />;
    case 'reports': return <Reports />;
    case 'workorders': return <WorkOrders />;
    case 'settings': return <Settings />;
    default: return (
      <div className="content-pad">
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="machine" heading="Coming soon" subtext="This section is under development." />
        </div>
      </div>
    );
  }
}

function AppShell() {
  const { route: { screen } } = useStore();

  if (screen === 'login') return <Login />;
  if (screen === 'raise') return <RaiseTicket />;

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <MobileTop />
        {screen === 'settings'
          ? <Settings />
          : <div className="content"><Router /></div>}
        <MobileTab />
      </main>
    </div>
  );
}

export default function App() {
  const { authed, loadAll, toasts } = useStore();

  useEffect(() => {
    if (authed) {
      loadAll();
    }
  }, [authed]);

  return (
    <>
      <AppShell />
      <ToastContainer toasts={toasts} />
    </>
  );
}
