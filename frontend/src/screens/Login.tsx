import React, { useState } from 'react';
import { useStore } from '../store';
import { LogoFull } from '../components/ui';
import { Btn } from '../components/ui';
import { Icons } from '../components/icons';

export default function Login() {
  const { login } = useStore();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('havish@tvpm.co.in');
  const [pw, setPw] = useState('demo123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) { setErr('Please enter your email and password.'); return; }
    setErr('');
    setLoading(true);
    try {
      await login(email, pw);
    } catch (ex: any) {
      setErr(ex.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ borderRadius: 16, padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <LogoFull tagline />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 28 }}>Sign in to your MachineOps account</p>

          {err && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>
              {err}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label className="field">
              <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.in" />
            </label>
            <label className="field">
              <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</span>
              <div style={{ position: 'relative' }}>
                <input className="input" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 8, top: 8, padding: 6, color: '#94A3B8' }}>
                  {show ? <Icons.eyeoff size={18} /> : <Icons.eye size={18} />}
                </button>
              </div>
            </label>
            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: '#1B4FD8' }}>Forgot password?</a>
            </div>
            <Btn size="lg" block type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Btn>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12.5, color: '#94A3B8', marginTop: 20 }}>
          Demo credentials are pre-filled — just tap Sign in.
        </p>
      </div>
    </div>
  );
}
