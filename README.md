# MachineOps

Machine maintenance management SaaS for Indian manufacturing SMEs.

## Prerequisites

- Node.js 18+
- npm 9+

## Quick start

```bash
# Install all dependencies, run migrations, and seed demo data
npm run setup

# Start both backend and frontend dev servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Demo credentials

| Field    | Value                  |
|----------|------------------------|
| Email    | havish@tvpm.co.in      |
| Password | demo123                |
| Role     | Shift Supervisor       |
| Org      | Rajashree Match Works  |

## Scripts

| Command          | Description                                      |
|------------------|--------------------------------------------------|
| `npm run dev`    | Start both backend and frontend in watch mode    |
| `npm run build`  | Build frontend (Vite) and backend (tsc)          |
| `npm run db:migrate` | Run Prisma migrations                        |
| `npm run db:seed`    | Seed demo data (idempotent, safe to re-run)  |
| `npm run setup`  | Full first-time install: deps + migrate + seed   |

## Project structure

```
machineops/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Data model
│   │   └── seed.ts           # Demo seed data
│   ├── src/
│   │   ├── index.ts          # Express app entry
│   │   ├── lib/prisma.ts     # Prisma singleton
│   │   └── routes/
│   │       ├── auth.ts       # POST /api/auth/login
│   │       ├── tickets.ts    # CRUD + actions
│   │       ├── parts.ts      # Inventory + stock mutations
│   │       ├── machines.ts   # Machine list + detail
│   │       ├── pm.ts         # PM tasks + complete
│   │       ├── workorders.ts # Work orders + step toggle
│   │       └── settings.ts   # Org settings
│   ├── .env                  # DATABASE_URL, JWT_SECRET, PORT
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── public/
    │   └── assets/m/         # Machine photos (01-cap.jpg … 10-cap.jpg)
    ├── src/
    │   ├── assets/styles.css # Design system CSS
    │   ├── components/
    │   │   ├── icons.tsx     # SVG icon library
    │   │   ├── ui.tsx        # Logo, Badge, Btn, Photo, Avatar …
    │   │   └── shared.tsx    # MachineCard, PageTitle, SectionHead
    │   ├── screens/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Machines.tsx  # MachineList + MachineDetail
    │   │   ├── Tickets.tsx   # TicketList + TicketDetail + RaiseTicket
    │   │   ├── Parts.tsx
    │   │   ├── PM.tsx
    │   │   ├── WorkOrders.tsx
    │   │   ├── Reports.tsx
    │   │   └── Settings.tsx
    │   ├── api.ts            # Typed API client (fetch + Bearer auth)
    │   ├── store.ts          # Zustand global store
    │   ├── types.ts          # TypeScript interfaces + helpers
    │   └── App.tsx           # Shell: Sidebar, Topbar, Router
    ├── index.html
    ├── vite.config.ts        # Proxies /api → http://localhost:3001
    └── package.json
```

## Tech stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Express + TypeScript, Prisma, SQLite |
| Auth      | JWT (jsonwebtoken) + bcryptjs        |
| Frontend  | Vite + React + TypeScript            |
| State     | Zustand                              |
| Styles    | Plain CSS design system              |

## Database

SQLite database is stored at `backend/prisma/dev.db`. To inspect it visually:

```bash
cd backend && npx prisma studio
```

To reset and re-seed from scratch:

```bash
cd backend
rm prisma/dev.db
npm run db:migrate
npm run db:seed
```
