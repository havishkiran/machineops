import React, { useState } from 'react';
import { useStore } from '../store';
import { CustomField, Unit, User, ROLES } from '../types';
import { Badge, Btn, Avatar, LogoMark, SlideOver } from '../components/ui';
import { Icons } from '../components/icons';
import { PageTitle } from '../components/shared';

/* ─── Super Admin gate ───────────────────────────────────────────────────── */
function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const { me } = useStore();
  if (me?.role !== 'Super Admin') {
    return (
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 560 }}>
        <div style={{ color: '#94A3B8' }}><Icons.lock size={40} sw={1.2} /></div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Super Admin access required</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Only Super Admins can manage this section. Contact your Super Admin to make changes.</div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function Settings() {
  const { toast, org, setOrg, saveSettings, me } = useStore();
  const [tab, setTab] = useState('company');
  const tabs: [string, string][] = [
    ['company', 'Company'],
    ['units', 'Units'],
    ['team', 'Team'],
    ['whatsapp', 'WhatsApp Routing'],
    ['pm', 'PM Defaults'],
    ['customfields', 'Custom Fields'],
  ];

  return (
    <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <div style={{ flexShrink: 0, padding: '24px 24px 0', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
        <PageTitle title="Settings" />
        <div className="tabs" style={{ overflowX: 'auto' }}>
          {tabs.map(([k, l]) => <button key={k} className={'tab ' + (tab === k ? 'active' : '')} onClick={() => setTab(k)}>{l}</button>)}
        </div>
      </div>
      <div style={{ flex: '1 1 0%', overflowY: 'auto', padding: 24, paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>

      {tab === 'company' && (
        <div className="card card-pad fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoMark size={30} rounded={8} /></div>
            <div><div style={{ fontWeight: 600, fontSize: 15 }}>Organisation profile</div><div style={{ fontSize: 13, color: '#64748B' }}>Shown across the app and on WhatsApp alerts</div></div>
          </div>
          <div className="divider" />
          <label className="field">
            <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Company name</span>
            <input className="input" value={org?.name || ''} onChange={e => setOrg(o => ({ ...o, name: e.target.value }))} placeholder="Your company name" />
          </label>
          <label className="field">
            <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Primary unit code</span>
            <input className="input" value={org?.unitCode || ''} onChange={e => setOrg(o => ({ ...o, unitCode: e.target.value }))} style={{ maxWidth: 180 }} placeholder="e.g. TVPM" />
          </label>
          <label className="field">
            <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>WhatsApp Business number</span>
            <input className="input" value={org?.whatsapp || ''} onChange={e => setOrg(o => ({ ...o, whatsapp: e.target.value }))} style={{ maxWidth: 260 }} placeholder="+91 ..." />
          </label>
          <p style={{ fontSize: 12.5, color: '#94A3B8' }}>Changes apply live — the company name updates in the sidebar instantly.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={saveSettings} disabled={me?.role !== 'Super Admin'} title={me?.role !== 'Super Admin' ? 'Super Admin access required' : undefined}>Save changes</Btn>
          </div>
        </div>
      )}

      {tab === 'units' && <UnitsTab />}
      {tab === 'team' && <TeamTab />}

      {tab === 'whatsapp' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.whatsapp size={26} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>WhatsApp Business connected</div><div style={{ fontSize: 13, color: '#64748B' }}>{org?.whatsapp} · {org?.name}</div></div>
            <Badge status="WORKING" label="Active" />
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Routing rules</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Who gets notified when a ticket is raised.</p>
            {([['Critical', 'Supervisor + all technicians + plant head', 'CRITICAL'], ['High', 'Supervisor + assigned technician', 'HIGH'], ['Medium / Low', 'Supervisor only', 'LOW']] as [string, string, string][]).map(([sev, who, c], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                <Badge status={c} label={sev} />
                <span style={{ flex: 1, fontSize: 13.5, color: '#475569' }}>{who}</span>
                <Toggle on={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pm' && (
        <div className="card card-pad fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 560 }}>
          <Setting label="Default PM reminder lead time" hint="Notify assignee before a PM is due">
            <select className="select" defaultValue="2" style={{ width: 160 }}><option value="1">1 day before</option><option value="2">2 days before</option><option value="3">3 days before</option></select>
          </Setting>
          <div className="divider" />
          <Setting label="Auto-create work order on PM due" hint="Generate a work order when a PM task hits its due date"><Toggle on={true} /></Setting>
          <div className="divider" />
          <Setting label="Escalate overdue PM" hint="Notify supervisor if a PM is overdue by"><select className="select" defaultValue="1" style={{ width: 140 }}><option>12 hours</option><option>1 day</option><option>2 days</option></select></Setting>
          <div className="divider" />
          <Setting label="Require photo on PM completion" hint="Technician must attach a photo to close a PM"><Toggle on={false} /></Setting>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}><Btn onClick={() => toast('Settings saved')}>Save changes</Btn></div>
        </div>
      )}

      {tab === 'customfields' && (
        <SuperAdminGate>
          <CustomFieldsTab />
        </SuperAdminGate>
      )}
      </div>
    </div>
  );
}

/* ─── Units tab ──────────────────────────────────────────────────────────── */
function UnitsTab() {
  const { units, me, createUnit, updateUnit, deleteUnit, toast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {units.map(u => (
        <div key={u.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#EEF2FF', color: '#1B4FD8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 15 }}>{u.code}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>{u.code}{u.unitNo ? ` (${u.unitNo})` : ''} · {u._count?.machines ?? 0} machines</div>
          </div>
          {me?.role === 'Super Admin' && (
            <Btn variant="secondary" size="sm" icon="edit" onClick={() => { setEditing(u); setShowForm(true); }}>Edit</Btn>
          )}
        </div>
      ))}
      {units.length === 0 && (
        <div className="card card-pad" style={{ color: '#94A3B8', textAlign: 'center', fontSize: 14 }}>No units yet.</div>
      )}
      {me?.role === 'Super Admin' && (
        <button className="card" style={{ padding: 16, border: '1.5px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#1B4FD8', fontWeight: 500, cursor: 'pointer' }}
          onClick={() => { setEditing(null); setShowForm(true); }}>
          <Icons.plus size={18} /> Add unit
        </button>
      )}
      {showForm && (
        <UnitForm
          unit={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async (data) => {
            if (editing) {
              await updateUnit(editing.id, data);
            } else {
              await createUnit(data);
            }
            setShowForm(false);
            setEditing(null);
          }}
          onDelete={editing ? async () => {
            if (!confirm(`Delete unit "${editing.name}"? This cannot be undone.`)) return;
            try {
              await deleteUnit(editing.id);
              setShowForm(false);
              setEditing(null);
            } catch (e: any) {
              toast(e.message || 'Cannot delete unit', 'alert');
            }
          } : undefined}
        />
      )}
    </div>
  );
}

interface UnitFormProps {
  unit: Unit | null;
  onClose: () => void;
  onSaved: (data: Partial<Unit>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function UnitForm({ unit, onClose, onSaved, onDelete }: UnitFormProps) {
  const [name, setName] = useState(unit?.name ?? '');
  const [code, setCode] = useState(unit?.code ?? '');
  const [unitNo, setUnitNo] = useState(unit?.unitNo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) { setError('Name and code are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSaved({ name: name.trim(), code: code.trim().toUpperCase(), unitNo: unitNo.trim() || undefined });
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <SlideOver title={unit ? `Edit unit — ${unit.name}` : 'Add unit'} onClose={onClose} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Unit name *</div>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tiruppur Works" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Unit code *</div>
          <input className="input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. TVPM" style={{ maxWidth: 180 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Unit number</div>
          <input className="input" value={unitNo} onChange={e => setUnitNo(e.target.value)} placeholder="e.g. U1" style={{ maxWidth: 120 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        {onDelete && (
          <Btn variant="danger" size="lg" onClick={onDelete} style={{ marginRight: 'auto' }}>Delete</Btn>
        )}
        <Btn variant="secondary" size="lg" block onClick={onClose}>Cancel</Btn>
        <Btn size="lg" block onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : unit ? 'Save changes' : 'Add unit'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* ─── Team tab ───────────────────────────────────────────────────────────── */
function roleBadgeCls(role: string): string {
  switch (role) {
    case 'Super Admin': return 'b-crit';
    case 'Floor Supervisor': return 'b-info';
    case 'Shift Supervisor': return 'b-info';
    case 'Senior Technician': return 'b-warn';
    default: return 'b-neut';
  }
}

function TeamTab() {
  const { users, me, createUser, updateUser } = useStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Icons.search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 200 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {me?.role === 'Super Admin' && (
          <Btn icon="plus" size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>Invite member</Btn>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              {me?.role === 'Super Admin' && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No members found</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={u.name} size={32} />
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {u.name}
                        {u.id === me?.id && <span className="badge b-info" style={{ marginLeft: 8 }}>You</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${roleBadgeCls(u.role)}`}><span className="dot" />{u.role}</span>
                </td>
                <td style={{ color: '#475569', fontSize: 13 }}>{u.phone || '—'}</td>
                <td>
                  {u.active
                    ? <span className="badge b-ok"><span className="dot" />Active</span>
                    : <span className="badge b-neut"><span className="dot" />Inactive</span>}
                </td>
                {me?.role === 'Super Admin' && (
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0 6px' }} title="Edit" onClick={() => { setEditing(u); setShowForm(true); }}>
                        <Icons.edit size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0 6px', color: u.active ? '#D97706' : '#16A34A' }}
                        title={u.active ? 'Deactivate' : 'Activate'}
                        onClick={async () => {
                          await updateUser(u.id, { active: !u.active });
                        }}
                      >
                        {u.active ? <Icons.eyeoff size={15} /> : <Icons.eye size={15} />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <UserForm
          user={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async (data) => {
            if (editing) {
              await updateUser(editing.id, data);
            } else {
              await createUser(data);
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface UserFormProps {
  user: User | null;
  onClose: () => void;
  onSaved: (data: any) => Promise<void>;
}

function UserForm({ user, onClose, onSaved }: UserFormProps) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'Technician');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
    if (!user && !password) { setError('Password is required for new users.'); return; }
    setSaving(true);
    setError('');
    try {
      const data: any = { name: name.trim(), email: email.trim(), role, phone: phone.trim() || undefined };
      if (password) data.password = password;
      await onSaved(data);
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <SlideOver title={user ? `Edit — ${user.name}` : 'Invite team member'} onClose={onClose} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Full name *</div>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rajan Kumar" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Email *</div>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rajan@tvpm.co.in" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{user ? 'New password (leave blank to keep)' : 'Password *'}</div>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? '••••••••' : 'Set password'} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Role</div>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Phone</div>
          <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        <Btn variant="secondary" size="lg" block onClick={onClose}>Cancel</Btn>
        <Btn size="lg" block onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : user ? 'Save changes' : 'Add member'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* ─── Custom Fields tab ────────────────────────────────────────────────────── */
function CustomFieldsTab() {
  const { customFields, createCustomField, updateCustomField, deleteCustomField } = useStore();
  const [entityFilter, setEntityFilter] = useState<'MACHINE' | 'PART'>('MACHINE');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);

  const filtered = customFields.filter(f => f.entityType === entityFilter);

  return (
    <div className="fade-in" style={{ maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="seg">
          <button className={entityFilter === 'MACHINE' ? 'on' : ''} onClick={() => setEntityFilter('MACHINE')}>Machine fields</button>
          <button className={entityFilter === 'PART' ? 'on' : ''} onClick={() => setEntityFilter('PART')}>Part fields</button>
        </div>
        <div style={{ flex: 1 }} />
        <Btn icon="plus" size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>Add field</Btn>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8' }}>
            <Icons.list size={48} sw={1.2} />
            <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: '#475569' }}>No custom fields yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Add extra fields to the {entityFilter === 'MACHINE' ? 'machine' : 'part'} form — e.g. Serial Number, Location, Capacity.
            </div>
            <Btn icon="plus" size="sm" style={{ marginTop: 16 }} onClick={() => { setEditing(null); setShowForm(true); }}>Add first field</Btn>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 60px', gap: 8, fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Field label</span><span>Type</span><span>Required</span><span>Order</span><span></span>
          </div>
          {filtered.map((f, i) => (
            <div key={f.id} style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 60px', gap: 8, alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
                <div className="mono" style={{ fontSize: 11.5, color: '#94A3B8' }}>{f.name}</div>
                {f.fieldType === 'select' && f.options && (
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                    Options: {f.options.join(' · ')}
                  </div>
                )}
              </div>
              <span>
                <span className="badge b-neut" style={{ textTransform: 'capitalize' }}>{f.fieldType}</span>
              </span>
              <span>
                {f.required ? <span className="badge b-info">Required</span> : <span style={{ color: '#94A3B8', fontSize: 13 }}>Optional</span>}
              </span>
              <span style={{ color: '#64748B', fontSize: 13 }}>{f.sortOrder}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0 6px' }} title="Edit" onClick={() => { setEditing(f); setShowForm(true); }}>
                  <Icons.edit size={15} />
                </button>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0 6px', color: '#DC2626' }} title="Delete"
                  onClick={async () => {
                    if (confirm(`Delete "${f.label}"? Values saved for existing records will be lost.`)) {
                      await deleteCustomField(f.id);
                    }
                  }}>
                  <Icons.close size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CustomFieldForm
          entityType={entityFilter}
          field={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={async (data) => {
            if (editing) {
              await updateCustomField(editing.id, data);
            } else {
              await createCustomField({ ...data, entityType: entityFilter });
            }
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface CFFormProps {
  entityType: 'MACHINE' | 'PART';
  field: CustomField | null;
  onClose: () => void;
  onSaved: (data: Partial<CustomField>) => Promise<void>;
}

function CustomFieldForm({ entityType, field, onClose, onSaved }: CFFormProps) {
  const [label, setLabel] = useState(field?.label ?? '');
  const [fieldType, setFieldType] = useState<string>(field?.fieldType ?? 'text');
  const [optionsStr, setOptionsStr] = useState(field?.options ? field.options.join('\n') : '');
  const [required, setRequired] = useState(field?.required ?? false);
  const [sortOrder, setSortOrder] = useState(field?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!label.trim()) { setError('Label is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const options = fieldType === 'select'
        ? optionsStr.split('\n').map(o => o.trim()).filter(Boolean)
        : null;
      await onSaved({ label: label.trim(), fieldType: fieldType as CustomField['fieldType'], options: options as any, required, sortOrder });
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <SlideOver title={field ? `Edit field — ${field.label}` : `Add ${entityType === 'MACHINE' ? 'machine' : 'part'} field`} onClose={onClose} width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13 }}>{error}</div>}

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Field label *</div>
          <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Serial Number, Capacity, Location" />
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>The label shown in the form. A slug is auto-generated from this.</div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Field type</div>
          <select className="input" value={fieldType} onChange={e => setFieldType(e.target.value)}>
            <option value="text">Text — short text input</option>
            <option value="number">Number — numeric value</option>
            <option value="select">Select — dropdown with options</option>
            <option value="date">Date — date picker</option>
          </select>
        </div>

        {fieldType === 'select' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Options (one per line)</div>
            <textarea className="textarea" rows={5} value={optionsStr} onChange={e => setOptionsStr(e.target.value)}
              placeholder={"Option A\nOption B\nOption C"} style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13 }} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Sort order</div>
            <input className="input" type="number" min={0} value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Lower = appears first</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Required</div>
            <button
              onClick={() => setRequired(r => !r)}
              style={{ width: 44, height: 26, borderRadius: 99, background: required ? '#1B4FD8' : '#CBD5E1', position: 'relative', transition: 'background .15s', display: 'block', marginTop: 7 }}>
              <span style={{ position: 'absolute', top: 3, left: required ? 21 : 3, width: 20, height: 20, borderRadius: 99, background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        <Btn variant="secondary" size="lg" block onClick={onClose}>Cancel</Btn>
        <Btn size="lg" block onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : field ? 'Save changes' : 'Add field'}
        </Btn>
      </div>
    </SlideOver>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function Setting({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>{hint && <div style={{ fontSize: 12.5, color: '#94A3B8', marginTop: 2 }}>{hint}</div>}</div>
      {children}
    </div>
  );
}

function Toggle({ on: initial }: { on: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button onClick={() => setOn(o => !o)} style={{ width: 44, height: 26, borderRadius: 99, background: on ? '#1B4FD8' : '#CBD5E1', position: 'relative', transition: 'background .15s', flex: '0 0 44px' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 99, background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}
