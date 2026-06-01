# MachineOps — Claude Context

## Project
Full-stack maintenance management SaaS for Indian manufacturing SMEs.
**Org:** Rajashree Match Works · TVPM · +91 81220 57147
**Demo login:** havish@tvpm.co.in / demo123 (Shift Supervisor)

## Stack
- **Frontend:** `frontend/` — Vite + React 18 + TypeScript + Zustand
- **Backend:** `backend/` — Express + TypeScript + Prisma ORM
- **DB:** SQLite (`backend/prisma/dev.db`) — switch to PostgreSQL by changing `provider` in `schema.prisma`
- **Ports:** Frontend :5173 (or :5174), Backend :3001

## Run
```bash
npm run dev        # start both servers (from project root)
npm run db:migrate # run pending migrations
npm run db:seed    # re-seed demo data
npm run db:studio  # open Prisma Studio
```

## Key files
| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Full DB schema — all 16 models |
| `backend/prisma/seed.ts` | Demo data (12 machines, 10 parts, 6 tickets, 5 WOs) |
| `backend/src/index.ts` | Express app + JWT middleware |
| `backend/src/routes/` | machines, tickets, parts, pm-tasks, work-orders, reports, settings, custom-fields |
| `frontend/src/store.ts` | Zustand store — all state + API actions |
| `frontend/src/api.ts` | Typed fetch client (all endpoints) |
| `frontend/src/types.ts` | TS interfaces + STATUS_MAP + UNITS |
| `frontend/src/App.tsx` | App shell — Sidebar, Topbar, MobileTab, Router |
| `frontend/src/screens/` | Login, Dashboard, Machines, Tickets, Parts, PM, Reports, WorkOrders, Settings |
| `frontend/src/components/ui.tsx` | Badge, Btn, Photo, Avatar, Logo, SlideOver, EmptyState |
| `frontend/src/components/icons.tsx` | All SVG icons |
| `frontend/src/assets/styles.css` | Design system CSS |

## DB schema notes
- SQLite does NOT support Prisma enums → all enum-like fields are `String` with allowed values commented in schema
- Valid values documented in `schema.prisma` header comments
- Custom fields: `CustomField` (field definition) + `CustomFieldValue` (per-entity values)
- To add a new migration: `npm run db:migrate --prefix backend`

## Design system
- Brand blue: `#1B4FD8` (hover `#1340B0`)
- Fonts: Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (machine codes)
- Status colors: Critical `#DC2626`, Warning `#D97706`, Success `#16A34A`, Info `#1D4ED8`, Neutral `#6B7280`
- CSS classes: `.card`, `.card-pad`, `.tbl`, `.badge`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- Layout: dark sidebar 240px ≥1024px; bottom tab bar <1024px
- SlideOver: right-side panel, 480px wide on desktop (see `ui.tsx SlideOver`)

## Locale
- Currency: ₹ (use `fmtINR(n)` from types.ts)
- Dates: DD MMM YYYY · 12-hour AM/PM
- Phone: +91 format
- No dark mode in v1

## Custom fields
- Admin manages via Settings → Custom Fields tab
- `CustomField.entityType`: `MACHINE` or `PART`
- `CustomField.fieldType`: `text` | `number` | `select` | `date`
- Values stored in `CustomFieldValue` keyed by `[fieldId, entityId]`
- Appear in Add/Edit Machine and Add/Edit Part forms automatically

## Auth
- JWT in localStorage key `mo_token`
- All `/api/*` except `/api/auth` requires `Authorization: Bearer <token>`
- `req.user` available in routes after middleware validates token
