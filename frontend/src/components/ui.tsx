import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './icons';
import { STATUS_MAP } from '../types';

/* ---------- Logos ---------- */
export function LogoMark({ size = 36, rounded = 10 }: { size?: number; rounded?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx={rounded} fill="#1B4FD8"/>
      <path d="M20 13C16.134 13 13 16.134 13 20C13 23.866 16.134 27 20 27C23.866 27 27 23.866 27 20C27 16.134 23.866 13 20 13Z" fill="white"/>
      <circle cx="20" cy="20" r="4" fill="#1B4FD8"/>
      <rect x="18.5" y="3" width="3" height="5" rx="1.5" fill="white"/>
      <rect x="18.5" y="32" width="3" height="5" rx="1.5" fill="white"/>
      <rect x="3" y="18.5" width="5" height="3" rx="1.5" fill="white"/>
      <rect x="32" y="18.5" width="5" height="3" rx="1.5" fill="white"/>
      <rect x="5.636" y="7.05" width="3" height="5" rx="1.5" fill="white" transform="rotate(-45 5.636 7.05)"/>
      <rect x="30.314" y="7.05" width="3" height="5" rx="1.5" fill="white" transform="rotate(45 30.314 7.05)"/>
      <rect x="5.636" y="32.95" width="3" height="5" rx="1.5" fill="white" transform="rotate(45 5.636 32.95)"/>
      <rect x="30.314" y="32.95" width="3" height="5" rx="1.5" fill="white" transform="rotate(-45 30.314 32.95)"/>
      <path d="M14 22 L17 18 L20 21 L23 15 L26 17" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function LogoFull({ reversed = false, tagline = false }: { reversed?: boolean; tagline?: boolean }) {
  const wordA = reversed ? '#F8FAFC' : '#0F172A';
  const wordB = reversed ? '#60A5FA' : '#1B4FD8';
  const ringFill = reversed ? '#3B82F6' : '#1B4FD8';
  const centerFill = reversed ? '#0F172A' : 'white';
  const check = reversed ? '#0F172A' : 'white';
  return (
    <svg width={tagline ? 230 : 188} height={tagline ? 46 : 38} viewBox={tagline ? '0 0 260 50' : '0 0 200 40'} fill="none">
      <path d="M20 13C16.134 13 13 16.134 13 20C13 23.866 16.134 27 20 27C23.866 27 27 23.866 27 20C27 16.134 23.866 13 20 13Z" fill={ringFill}/>
      <circle cx="20" cy="20" r="4" fill={centerFill}/>
      <rect x="18.5" y="3" width="3" height="5" rx="1.5" fill={ringFill}/>
      <rect x="18.5" y="32" width="3" height="5" rx="1.5" fill={ringFill}/>
      <rect x="3" y="18.5" width="5" height="3" rx="1.5" fill={ringFill}/>
      <rect x="32" y="18.5" width="5" height="3" rx="1.5" fill={ringFill}/>
      <rect x="5.636" y="7.05" width="3" height="5" rx="1.5" fill={ringFill} transform="rotate(-45 5.636 7.05)"/>
      <rect x="30.314" y="7.05" width="3" height="5" rx="1.5" fill={ringFill} transform="rotate(45 30.314 7.05)"/>
      <rect x="5.636" y="32.95" width="3" height="5" rx="1.5" fill={ringFill} transform="rotate(45 5.636 32.95)"/>
      <rect x="30.314" y="32.95" width="3" height="5" rx="1.5" fill={ringFill} transform="rotate(-45 30.314 32.95)"/>
      <path d="M14 22 L17 18 L20 21 L23 15 L26 17" stroke={check} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {tagline ? (
        <>
          <text x="46" y="22" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" fontSize="18" letterSpacing="-0.4"><tspan fill={wordA}>Machine</tspan><tspan fill={wordB}>Ops</tspan></text>
          <text x="46" y="38" fontFamily="'Inter', sans-serif" fontWeight="400" fontSize="11" fill={reversed ? '#94A3B8' : '#64748B'} letterSpacing="0.02em">Maintenance. Simplified.</text>
        </>
      ) : (
        <text x="48" y="26" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="700" fontSize="17" letterSpacing="-0.3"><tspan fill={wordA}>Machine</tspan><tspan fill={wordB}>Ops</tspan></text>
      )}
    </svg>
  );
}

/* ---------- Photo with graceful fallback ---------- */
interface PhotoProps {
  src?: string | null;
  alt?: string;
  kind?: 'machine' | 'part';
  radius?: number | string;
  style?: React.CSSProperties;
  className?: string;
  overlay?: React.ReactNode;
}

export function Photo({ src, alt = '', kind = 'machine', radius = 0, style = {}, className = '', overlay }: PhotoProps) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => { setFailed(!src); }, [src]);
  const Ph = kind === 'part' ? Icons.box : Icons.gear;
  return (
    <div className={'photo ' + className} style={{ borderRadius: radius, ...style }}>
      {!failed && src && (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      )}
      {failed && <div className="ph"><Ph size={48} sw={1.4} /></div>}
      {overlay}
    </div>
  );
}

/* ---------- Status badge ---------- */
export function Badge({ status, label, dot = true }: { status: string; label?: string; dot?: boolean }) {
  const m = STATUS_MAP[status] || { cls: 'b-neut', label: label || status };
  return <span className={'badge ' + m.cls}>{dot && <span className="dot" />}{label || m.label}</span>;
}

/* ---------- Button ---------- */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  block?: boolean;
  icon?: string;
  iconRight?: string;
}

export function Btn({ variant = 'primary', size = 'md', block, icon, iconRight, children, ...p }: BtnProps) {
  const I = icon ? Icons[icon] : null;
  const IR = iconRight ? Icons[iconRight] : null;
  return (
    <button className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''}`} {...p}>
      {I && <I size={size === 'sm' ? 16 : 18} />}{children}{IR && <IR size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

/* ---------- Photo upload zone ---------- */
export function UploadZone({ note = 'JPEG, PNG or WebP · max 5MB each', compact }: { note?: string; compact?: boolean }) {
  const [drag, setDrag] = useState(false);
  return (
    <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); }}
      style={{ border: '2px dashed ' + (drag ? '#1B4FD8' : '#E2E8F0'), borderRadius: 12, padding: compact ? 16 : 24, background: drag ? '#EEF2FF' : '#F8FAFC',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all .12s', textAlign: 'center' }}>
      <Icons.camera size={24} style={{ color: '#94A3B8' }} />
      <div style={{ fontSize: 14, color: '#6B7280' }}>Tap to add photos</div>
      <div style={{ fontSize: 12, color: '#94A3B8' }}>{note}</div>
    </div>
  );
}

/* ---------- QR placeholder ---------- */
export function QRBox({ size = 80 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6 }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" shapeRendering="crispEdges">
        {(() => {
          const cells: React.ReactElement[] = []; let seed = 7;
          const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
          for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { if (rnd() > 0.5) cells.push(<rect key={x + '-' + y} x={x * 10} y={y * 10} width="10" height="10" fill="#0F172A" />); }
          return cells;
        })()}
        <rect x="0" y="0" width="30" height="30" fill="#fff"/><rect x="0" y="0" width="30" height="30" fill="none" stroke="#0F172A" strokeWidth="6"/><rect x="10" y="10" width="10" height="10" fill="#0F172A"/>
        <rect x="70" y="0" width="30" height="30" fill="#fff"/><rect x="70" y="0" width="30" height="30" fill="none" stroke="#0F172A" strokeWidth="6"/><rect x="80" y="10" width="10" height="10" fill="#0F172A"/>
        <rect x="0" y="70" width="30" height="30" fill="#fff"/><rect x="0" y="70" width="30" height="30" fill="none" stroke="#0F172A" strokeWidth="6"/><rect x="10" y="80" width="10" height="10" fill="#0F172A"/>
      </svg>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon = 'machine', heading, subtext, cta, onCta }: { icon?: string; heading: string; subtext?: string; cta?: string; onCta?: () => void }) {
  const I = Icons[icon] || Icons.machine;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', textAlign: 'center', gap: 6 }}>
      <div style={{ color: '#94A3B8', marginBottom: 8 }}><I size={84} sw={1.3} /></div>
      <h3 style={{ fontSize: 17 }}>{heading}</h3>
      {subtext && <p style={{ fontSize: 14, color: '#64748B', maxWidth: 300 }}>{subtext}</p>}
      {cta && <div style={{ marginTop: 12 }}><Btn icon="plus" onClick={onCta}>{cta}</Btn></div>}
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 32, color }: { name: string; size?: number; color?: string }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#1B4FD8', '#0EA5A4', '#D97706', '#7C3AED', '#DB2777', '#0891B2'];
  const c = color || colors[(name || '').length % colors.length];
  return <div style={{ width: size, height: size, borderRadius: 99, background: c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 600, flex: `0 0 ${size}px` }}>{initials}</div>;
}

/* ---------- SlideOver (right-panel) ---------- */
export function SlideOver({ title, onClose, children, width = 480 }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: Math.min(width, window.innerWidth),
        background: '#fff', zIndex: 61, boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', animation: 'slidein .22s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <h2 style={{ flex: 1, fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" style={{ padding: '0 8px' }} onClick={onClose}><Icons.close size={20} /></button>
        </div>
        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---------- Toasts ---------- */
export function ToastContainer({ toasts }: { toasts: Array<{ id: string; text: string; icon: string }> }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => {
        const I = Icons[t.icon] || Icons.check;
        return <div className="toast" key={t.id}><I size={17} />{t.text}</div>;
      })}
    </div>
  );
}
