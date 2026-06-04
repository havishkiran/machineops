import React from 'react';

interface IcProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  sw?: number;
  fill?: string;
  d?: string;
}

export const Ic: React.FC<IcProps> = ({ d, size = 20, sw = 1.75, fill = 'none', children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
);

type IconProps = Omit<IcProps, 'd' | 'children'>;

export const Icons: Record<string, React.FC<IconProps>> = {
  dashboard: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Ic>,
  machine: (p) => <Ic {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></Ic>,
  ticket: (p) => <Ic {...p}><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 5v14" strokeDasharray="2 2"/></Ic>,
  maintenance: (p) => <Ic {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M9 14l2 2 4-4"/></Ic>,
  parts: (p) => <Ic {...p}><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9z"/><path d="m4 6.5 8 4.5 8-4.5M12 11v9"/></Ic>,
  workorder: (p) => <Ic {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2.5h6V3M8.5 11l1.5 1.5L13 9M8.5 16h6"/></Ic>,
  reports: (p) => <Ic {...p}><path d="M3 3v18h18"/><path d="M7 14l3-4 3 2 4-6"/></Ic>,
  settings: (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>,
  home: (p) => <Ic {...p}><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/></Ic>,
  more: (p) => <Ic {...p}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></Ic>,
  plus: (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  search: (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Ic>,
  chevdown: (p) => <Ic {...p}><path d="m6 9 6 6 6-6"/></Ic>,
  chevright: (p) => <Ic {...p}><path d="m9 6 6 6-6 6"/></Ic>,
  arrowleft: (p) => <Ic {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Ic>,
  close: (p) => <Ic {...p}><path d="M18 6 6 18M6 6l12 12"/></Ic>,
  check: (p) => <Ic {...p}><path d="M20 6 9 17l-5-5"/></Ic>,
  checkcircle: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></Ic>,
  grid: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Ic>,
  list: (p) => <Ic {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Ic>,
  calendar: (p) => <Ic {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></Ic>,
  camera: (p) => <Ic {...p}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/></Ic>,
  gear: (p) => <Ic {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></Ic>,
  box: (p) => <Ic {...p}><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9z"/><path d="m4 6.5 8 4.5 8-4.5M12 11v9"/></Ic>,
  qr: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M21 21v-4M14 21h3"/></Ic>,
  download: (p) => <Ic {...p}><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></Ic>,
  edit: (p) => <Ic {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></Ic>,
  dots: (p) => <Ic {...p}><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></Ic>,
  bell: (p) => <Ic {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></Ic>,
  wrench: (p) => <Ic {...p}><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2l-6 6a1.4 1.4 0 0 0 2 2l6-6a4 4 0 0 0 5.2-5.2l-2.5 2.5-2-2z"/></Ic>,
  play: (p) => <Ic {...p} fill="currentColor" sw={0}><path d="M6 4l14 8-14 8z"/></Ic>,
  clock: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>,
  user: (p) => <Ic {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Ic>,
  logout: (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Ic>,
  whatsapp: (p) => <Ic {...p}><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 9c0 4 2.5 6.5 6.5 6.5M8.5 9c0-.6.4-1 1-1s1.5 1.5 1.5 2-1 1-1 1M15 15.5c.6 0 1-.4 1-1s-1.5-1.5-2-1.5-1 1-1 1" strokeWidth="1.3"/></Ic>,
  arrowup: (p) => <Ic {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Ic>,
  arrowdown: (p) => <Ic {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Ic>,
  filter: (p) => <Ic {...p}><path d="M3 5h18l-7 8v6l-4 2v-8z"/></Ic>,
  eye: (p) => <Ic {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></Ic>,
  eyeoff: (p) => <Ic {...p}><path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 7 10 7a16 16 0 0 1-3 4M6 6a16 16 0 0 0-4 6s3.5 7 10 7a10 10 0 0 0 3.5-.6M3 3l18 18M9.5 9.5a3 3 0 0 0 4.2 4.2"/></Ic>,
  pin: (p) => <Ic {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></Ic>,
  star: (p) => <Ic {...p}><path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.6l1-6L3.3 9.4l6-.9z"/></Ic>,
  trend: (p) => <Ic {...p}><path d="M3 17l6-6 4 4 8-8M21 7h-4M21 7v4"/></Ic>,
  alert: (p) => <Ic {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></Ic>,
  history: (p) => <Ic {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/></Ic>,
  send: (p) => <Ic {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></Ic>,
  upload: (p) => <Ic {...p}><path d="M12 15V3M7 8l5-5 5 5M4 21h16"/></Ic>,
  link: (p) => <Ic {...p}><path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1"/></Ic>,
  lock: (p) => <Ic {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ic>,
  refresh: (p) => <Ic {...p}><path d="M21 12a9 9 0 0 1-15.5 6.2L3 21M3 12a9 9 0 0 1 15.5-6.2L21 3M21 3v6h-6M3 21v-6h6"/></Ic>,
};
