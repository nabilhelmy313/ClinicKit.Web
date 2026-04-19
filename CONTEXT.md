# Project Context — SaaS Clinic Management System (ClinicKit)

## Owner
- **Name:** Nabil
- **Stack:** ASP.NET Core (.NET 8) · Angular 16+ · PrimeNG · SQL Server · SignalR · EF Core · MediatR · Azure Pipelines
- **Machine:** ARM64 macOS
- **Experience:** ~5 years, enterprise-scale systems

---

## The Big Idea
Build a **repeatable SaaS template** (Starter Kit) and sell it to multiple clients — starting with clinics in Egypt — instead of building from scratch each time.

**Goal:** 10 clients × ~500 EGP/month = recurring income  
**Model:** Hybrid — one-time setup fee (1,500–3,000 EGP) + monthly subscription (300–700 EGP)

---

## Target Market
**Primary:** Egyptian private clinics (solo doctors, small polyclinics)  
**Why:** 9.9% annual growth, weak local competition, most clinics still use paper/Excel/WhatsApp manually, no solution covers all Egypt-specific requirements together.

**Egypt-specific requirements (non-negotiable):**
- Full Arabic RTL interface + English toggle
- WhatsApp integration for appointment reminders (most-requested feature)
- Egyptian Tax Authority **e-Receipt** integration (mandatory by law)
- Prices in EGP
- Ministry of Health compliance
- GAHAR accreditation reporting (v2)

---

## Starter Kit — What It Contains

### Backend (ASP.NET Core)
| Module | Details |
|---|---|
| Multi-Tenancy | `TenantId` on every entity, EF Core Global Query Filter, middleware reads from JWT |
| BaseEntity | `Id`, `TenantId`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `IsDeleted` |
| JWT Auth | Login / Refresh Token / Revoke |
| Roles & Permissions | Per-tenant roles, granular permissions, `[HasPermission]` attribute |
| Generic Repository | Unit of Work + EF Core, CRUD ready |
| Audit Trail | Auto-logs who changed what and when via EF Core interceptor |
| Notifications | SignalR real-time + DB persistence |
| File Storage | Upload/Serve/Delete — local or S3 |
| Global Error Handler | ProblemDetails + Serilog (file + console) |
| Localization | AR/EN resource files, auto-detect from header |
| WhatsApp Service | Business API wrapper, message templates |
| Tenant Config Table | Per-tenant: logo, theme, feature flags, subscription plan |

### Frontend (Angular 16+)
| Module | Details |
|---|---|
| App Shell | Sidebar, topbar, lazy-loaded feature modules |
| Auth Module | Login screen, JWT interceptor, AuthGuard, 401 auto-redirect |
| Facade Services | Centralized state + API calls per feature |
| GTable Component | Generic PrimeNG table with `ColumnDefinitionEx`, sort, filter, pagination, actions |
| Dialogs & Toasts | Shared ConfirmDialog, success/error toasts — unified |
| RTL/LTR Toggle | Dynamic dir switching, ngx-translate, PrimeNG RTL support |
| Permission Directive | `*hasPermission="'CanEditPatient'"` — hides or disables elements |
| SignalR Client | Service with auto-reconnect |

### Infrastructure / DB
| Item | Details |
|---|---|
| BaseEntity migration | All tables inherit TenantId + audit columns |
| Tenant Config | Feature flags table — enables/disables features per client |
| Data Seeder | Default roles, permissions, lookup data per new tenant |
| Subscription Model | Plan tiers, expiry date, feature flag evaluation |

---

## Clinic Module — MVP Features

### Must ship for Demo (Week 3–4)
- **Patient registration** — name, phone, DOB, gender, visit history, quick search
- **Appointment booking** — conflict check, statuses: Pending / Confirmed / Cancelled
- **Day schedule view** — waiting list, status update in one click
- **Medical record** — visit history, diagnoses, prescriptions, timeline view
- **WhatsApp reminders** — background job, 24h and 1h before appointment
- **Invoice + print** — services, total, payment status, PDF
- **e-Receipt stub** — interface ready, mock response for demo (real integration later)

### v2 (after first paying client)
- Insurance / discount management
- Ministry of Health compliance reports
- GAHAR reporting
- Revenue dashboard (daily/monthly)

### Pro / Upsell
- Online booking portal (patient self-books via link)
- Advanced analytics dashboard
- Multi-doctor support (each doctor has own schedule + records)
- WhatsApp/SMS marketing campaigns
- Stock/inventory for medical supplies
- Multi-branch management

---

## 4-Week Execution Plan

| Week | Focus | Deliverable |
|---|---|---|
| 1 | Starter Kit — Backend | API running: Login → JWT, Multi-Tenancy working |
| 2 | Starter Kit — Frontend | Full Kit cloneable for any future project |
| 3 | Clinic — Patients & Appointments | Register patient, book appointment, view day schedule |
| 4 | Clinic — Billing + WhatsApp + Demo polish | MVP ready to demo to first client |

**Effort:** 2–3 hours/day  
**Week 1–2 warning:** No visible UI yet — stay focused, the Kit saves 3 weeks on every future project.

---

## Build Order (Checklist)

### Week 1 — Backend Kit
- [ ] Solution structure: `API / Application / Domain / Infrastructure`
- [ ] `BaseEntity` with `TenantId`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `IsDeleted`
- [ ] Multi-Tenancy middleware + EF Core Global Query Filter
- [ ] JWT Auth — Login / Refresh Token / Revoke
- [ ] Roles & Permissions + default seeder (Admin, Doctor, Receptionist)
- [ ] Global Exception Handler + Serilog

### Week 2 — Frontend Kit
- [ ] App Shell — Sidebar, layout, lazy routing, AuthGuard
- [ ] Auth module — login screen, HTTP interceptor, 401 handling
- [ ] `GTable` component + `ColumnDefinitionEx`
- [ ] RTL/LTR + ngx-translate (`ar.json` / `en.json`)
- [ ] Shared: ConfirmDialog, Toast service, `*hasPermission` directive

### Week 3 — Clinic Domain
- [ ] `Patient` entity + CRUD API
- [ ] `Appointment` entity + conflict check API
- [ ] Patients screen — GTable + Add/Edit dialog
- [ ] Appointments screen — PrimeNG Calendar + day list
- [ ] Medical record screen — timeline view

### Week 4 — Billing + Egypt + Demo
- [ ] `Invoice` entity + Billing API
- [ ] Invoice screen + print/PDF
- [ ] WhatsApp reminder background job (24h + 1h)
- [ ] e-Receipt service stub (interface + mock)
- [ ] Demo seed data + bug fixes + deploy

---

## Key Architecture Decisions

### Multi-Tenancy Strategy
**Shared DB, TenantId per row** (not separate databases per client).  
Use EF Core Global Query Filter — every `DbContext` query auto-filters by `TenantId` from the current request scope. Never expose raw DbSets without the filter.

### Feature Flags
Store in `TenantConfig` table. Example:
```
WhatsAppEnabled = true
MultiDoctorEnabled = false
OnlineBookingEnabled = false
```
No code branches per client — just flag checks.

### Pricing Tiers (reference)
| Tier | Price | Features |
|---|---|---|
| Starter | 300 EGP/mo | Core: patients, appointments, schedule, invoice |
| Plus | 500 EGP/mo | + WhatsApp, insurance, reports |
| Pro | 700 EGP/mo | + online booking, multi-doctor, analytics |
| Setup fee | 1,500–3,000 EGP once | Installation, training, data migration |

---

## Conventions & Preferences
- MediatR pipeline behaviours: `LoggingBehaviour` → `ValidationBehaviour` → handler
- AutoMapper for DTO mapping
- `DateOnly` / `TimeOnly` for date/time fields in backend; strip Unicode characters from API date strings on frontend
- Angular: standalone components where possible, NgModule wrapper when needed for routing
- Reactive Forms for all forms
- `@Output` EventEmitter pattern for parent-child communication
- `ngOnChanges` for `@Input` reactivity in child components
- Arabic text is RTL, English is LTR — both must work simultaneously in the same UI

---

## What to Always Remember When Helping
1. Stack is **.NET 8 + Angular 16 + PrimeNG + SQL Server**
2. Every entity **must** have `TenantId` — never create a table without it
3. All features need **Arabic + English** support from day one
4. **WhatsApp** is a first-class feature in Egypt, not an afterthought
5. The goal is **reusable template** — avoid hardcoding anything clinic-specific in the Kit layers
6. Pricing is in **EGP**, not USD
7. Keep MVP scope **minimal** — resist feature creep until first client pays
