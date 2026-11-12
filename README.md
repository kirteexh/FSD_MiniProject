# PharmaCare — Full-Stack Pharmacy Management System

A full-stack pharmacy management web application designed for retail and clinical pharmacies. Built with Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit, Framer Motion, Recharts, Express.js, MongoDB/Mongoose, and Socket.IO.

---

## 🌟 Highlights & Capabilities

- **Intelligent FEFO POS Billing**: Point of Sale interface with barcode scanning, auto-deduction using First-Expiry, First-Out (FEFO) logic to prevent dispensing aged inventory, Schedule-H prescription tracking, locally persisted held bills, and printable receipts.
- **Batch-Level Inventory Control**: Pharmaceutical catalog management, multi-batch tracking, audited stock adjustments with before/after balance tracking, and status badges (*In Stock, Low Stock, Out of Stock, Expiring Soon, Expired*).
- **Shelf-Life & Expiry Management**: Categorized expiry monitoring (<7d, <30d, <90d, expired) with clinical disposal/write-off logging.
- **Real-Time WebSockets (`Socket.IO`)**: Authenticated live stock notifications and alerts triggered when medicines drop below configured reorder levels.
- **Suppliers & Purchase Orders**: Complete PO cycle from ordering to consignment receipt, automatically provisioning inventory batches upon delivery.
- **Role-Based Access Control (RBAC)**: Enforced backend security distinguishing Administrator (store owners/managers) and Cashier (dispensary staff) with JWT authentication and bcrypt password hashing.
- **Financial Analytics & Reporting**: Real-time sales calculations, category breakdowns, inventory valuations, cashier leaderboards, and CSV export.
- **Dual-Mode Persistence Architecture**: Out-of-the-box in-memory store pre-seeded with realistic Indian clinical data for instant evaluation, plus full Mongoose schemas ready for MongoDB Atlas.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Recharts, Redux Toolkit |
| **Backend** | Node.js, Express.js REST API, JWT Authentication, bcryptjs, Helmet, Express-Rate-Limit, Socket.IO |
| **Database** | MongoDB Atlas / Local MongoDB with Mongoose ODM (with in-memory fallback store) |
| **Testing** | Jest, ts-jest, Supertest |
| **Tooling** | Concurrently, TypeScript (`tsc`), tsx |

---

## 🔐 Demo Credentials

Quick-fill demo buttons are provided on the login page when running with `NEXT_PUBLIC_DEMO=true`:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@pharmacare.io` | `admin123` | Full administrative access (Inventory, POS, Staff, Reports, Settings, Purchases) |
| **Cashier / Staff** | `cashier@pharmacare.io` | `cashier123` | POS Billing, Inventory Search, Stock View |

> ⚠️ **Production Security Notice**: Change default demo credentials immediately upon deploying to production, generate a cryptographically strong `JWT_SECRET`, and set `NEXT_PUBLIC_DEMO=false` in client configuration.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v18, v20, and v24)
- **npm**: v9+
- **Git**

### 2. Installation
Clone the repository and install all dependencies across root, server, and client with a single command:

```bash
git clone https://github.com/kirteexh/FSD_MiniProject.git
cd FSD_MiniProject

# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Environment Configuration

Copy the example environment configuration files:

```bash
# Server configuration (default port: 5001)
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env.local
```

> **Why Port 5001?** Default port 5000 often conflicts with macOS AirPlay Receiver. PharmaCare defaults to port `5001` for the backend API and Socket.IO server.

### 4. Running Development Mode

Start both the backend API (port 5001) and Next.js frontend (port 3000) concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

### 5. Running Production Build

```bash
# Build both frontend and backend
npm run build

# Start production servers concurrently
npm run start
```

### 6. Running Automated Tests

Run unit and integration tests covering the FEFO algorithm, checkout flow, and auth/RBAC middleware:

```bash
npm test
```

---

## 📁 System Architecture & Directory Tree

```text
FSD_MiniProject/
├── package.json                   # Monorepo runner, install:all, build, start & test scripts
├── package-lock.json
├── LICENSE                        # MIT License
├── README.md                      # System documentation
│
├── server/                        # Express.js REST API & Socket.IO server
│   ├── .env.example               # Backend environment template (PORT=5001, JWT_SECRET, MONGODB_URI)
│   ├── package.json               # Backend dependencies & test scripts
│   ├── package-lock.json
│   ├── tsconfig.json              # TypeScript server configuration
│   ├── jest.config.cjs            # Jest test configuration
│   └── src/
│       ├── index.ts               # Server bootstrap, security headers (Helmet), rate limiting, routes
│       ├── config/
│       │   └── db.ts              # Mongoose connection & in-memory fallback detection
│       ├── models/                # Mongoose Schemas (User, Medication, Batch, Sale, Return, etc.)
│       ├── controllers/           # Controllers for auth, billing, inventory, staff, reports, etc.
│       ├── routes/                # RESTful route definitions
│       ├── middleware/            # JWT authentication, role-based authorization (requireAdmin), error handler
│       ├── socket/                # Socket.IO connection handler & event dispatcher
│       ├── services/
│       │   └── dbStore.ts         # Hybrid persistence layer, FEFO algorithm, and concurrency mutex
│       ├── seed/                  # Medical catalog seed dataset (Indian brands, GSTINs, distributors)
│       └── __tests__/             # Automated test suites (FEFO logic, RBAC, authentication)
│
└── client/                        # Next.js 14 App Router frontend
    ├── .env.example               # Frontend environment template (NEXT_PUBLIC_API_URL, SOCKET_URL)
    ├── package.json               # Client dependencies (Tailwind, Lucide, Recharts, Redux)
    ├── package-lock.json
    ├── next.config.mjs            # Next.js configuration & port mappings
    ├── tailwind.config.ts         # Tailwind design tokens & clinical color palette
    ├── tsconfig.json              # TypeScript client configuration
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout with Redux store & Toast container
        │   ├── page.tsx           # Session redirection handler
        │   ├── login/page.tsx     # Split-screen branded login & password recovery
        │   ├── dashboard/page.tsx # KPI summary cards, Recharts analytics, alert feed
        │   ├── inventory/page.tsx # Medicine catalog, batch tracking, stock adjustments
        │   ├── billing/page.tsx   # POS 2-panel interface, FEFO auto-deduction, printable receipt
        │   ├── sales/page.tsx     # Invoices history, partial return & refund workflow
        │   ├── suppliers/page.tsx # Vendor directory & purchase order records
        │   ├── purchases/page.tsx # Purchase orders creation & stock intake
        │   ├── expiry/page.tsx    # Shelf-life interval tabs & disposal workflows
        │   ├── notifications/page.tsx # Live WebSocket alert feed
        │   ├── staff/page.tsx     # RBAC user management & password resets (Admin only)
        │   ├── reports/page.tsx   # Executive financial metrics & CSV export (Admin only)
        │   └── settings/page.tsx  # Pharmacy profile, GST rates, inventory thresholds
        ├── components/
        │   ├── layout/            # Sidebar, Navbar, Global Search Modal, AppLayout
        │   ├── providers/         # Redux provider & session initializer
        │   └── ui/                # Modal, Toast, Badge components
        ├── lib/
        │   ├── api.ts             # Typed REST API client with global 401 interceptor
        │   ├── socket.ts          # Authenticated Socket.IO client
        │   └── utils.ts           # Currency (₹ INR), date, and badge formatting helpers
        ├── store/                 # Redux Toolkit slices (auth, cart, notifications, settings)
        └── types/                 # Shared TypeScript interfaces
```

---

## 📡 REST API Endpoint Reference

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Sign in and receive JWT token (rate-limited)
- `GET /api/auth/me` — Retrieve profile of currently authenticated user
- `POST /api/auth/forgot-password` — Request password reset instructions
- `POST /api/auth/reset-password` — Reset account password with token
- `POST /api/auth/change-password` — Change password for authenticated session
- `POST /api/auth/logout` — Terminate session

### Inventory & Batches (`/api/inventory`)
- `GET /api/inventory` — List medicines with stock totals and filters
- `GET /api/inventory/:id` — Detail view with batch history and movements
- `GET /api/inventory/barcode/:code` — Quick barcode lookup for POS scanning
- `POST /api/inventory` — Add medication (*Admin only*)
- `PUT /api/inventory/:id` — Edit medication (*Admin only*)
- `DELETE /api/inventory/:id` — Archive medication (*Admin only*)
- `POST /api/inventory/:id/batches` — Add inventory batch (*Admin only*)
- `POST /api/inventory/:id/adjust` — Adjust stock with before/after audit tracking (*Admin only*)

### Point of Sale & Billing (`/api/billing`)
- `POST /api/billing/checkout` — Atomic FEFO sale processing, stock deduction, and invoice generation

### Sales & Invoices (`/api/sales`)
- `GET /api/sales` — Search and filter transaction invoices
- `GET /api/sales/:id` — Invoice detail view
- `POST /api/sales/:id/return` — Process return/refund and restore non-expired stock (*Admin only*)

### Expiry Management (`/api/expiry`)
- `GET /api/expiry?range={7|30|90|expired|all}` — Filter batches by shelf-life window
- `POST /api/expiry/:batchId/dispose` — Write off expired batch with audit reason (*Admin only*)

### Suppliers (`/api/suppliers`)
- `GET /api/suppliers` — List suppliers
- `GET /api/suppliers/:id` — Supplier details with purchase history
- `POST /api/suppliers` — Add new supplier (*Admin only*)
- `PUT /api/suppliers/:id` — Update supplier details (*Admin only*)
- `DELETE /api/suppliers/:id` — Remove supplier (*Admin only*)

### Purchases (`/api/purchases`)
- `GET /api/purchases` — List purchase orders
- `POST /api/purchases` — Create draft purchase order (*Admin only*)
- `PUT /api/purchases/:id` — Update draft purchase order (*Admin only*)
- `DELETE /api/purchases/:id` — Cancel draft purchase order (*Admin only*)
- `POST /api/purchases/:id/receive` — Receive consignment into active batches (*Admin only*)

### Staff & Settings (`/api/staff`, `/api/settings`, `/api/reports`)
- `GET /api/staff` & `POST /api/staff` — List and create staff accounts (*Admin only*)
- `PUT /api/staff/:id` — Update staff role/status (*Admin only*)
- `DELETE /api/staff/:id` — Delete staff account (*Admin only*)
- `POST /api/staff/:id/reset-password` — Administrative password override (*Admin only*)
- `GET /api/settings` & `PUT /api/settings` — Get and update pharmacy configuration (*Admin only*)
- `GET /api/reports?period={today|week|month|year|all}` — Audited executive financial report (*Admin only*)
- `GET /api/alerts` & `PUT /api/alerts/mark-all/read` — Notification center
- `GET /api/health` — Service health, database status, and uptime

---

## ⚠️ Known Limitations

1. **In-Memory Store Resets on Restart**: In default evaluation mode (without MongoDB Atlas connected), all changes to inventory, sales, and accounts reside in server memory and will reset to seed data when the server restarts. To persist changes permanently, configure `MONGODB_URI` in `server/.env`.
2. **Payment Gateway Simulation**: Payment modes (Cash, Card, UPI) are recorded for retail bookkeeping and invoice generation; actual card network / UPI payment gateway redirection is simulated for academic evaluation.
3. **POS Held Bills**: Held bills are stored in browser `localStorage` to survive page refreshes on the local workstation. Clearing browser cache will remove local held bills.

---

## 🏷️ GitHub Repository Metadata (Recommended)

- **Description**: Full-stack pharmacy management system featuring FEFO POS billing, batch-level expiry control, real-time WebSocket alerts, and role-based access control.
- **Topics**: `nextjs`, `react`, `typescript`, `express`, `mongodb`, `mongoose`, `socket-io`, `pos-billing`, `fefo`, `pharmacy-management`, `redux-toolkit`, `tailwind-css`
