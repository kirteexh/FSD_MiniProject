# PharmaCare — Full-Stack Pharmacy Management System

> **Production-Quality Clinical & Retail Pharmacy Web Application**  
> Built according to enterprise SaaS standards with Next.js, TypeScript, Tailwind CSS, Redux Toolkit, Framer Motion, Recharts, Express.js, MongoDB/Mongoose, and Socket.IO.

---

## 🌟 Highlights & Key Capabilities

- **Intelligent FEFO POS Billing**: Point of Sale interface with barcode scanning, auto-deduction using First-Expiry, First-Out (FEFO) logic to prevent dispensing aged inventory, prescription-required flags, held bills management, and printable tax receipts.
- **Batch-Level Inventory Control**: Full CRUD management of pharmaceuticals, multi-batch tracking, stock adjustments with audit reasons, and visual status badges (*In Stock, Low Stock, Out of Stock, Expiring Soon, Expired*).
- **Proactive Expiry Management**: Dedicated shelf-life tracking categorized into 7-day, 30-day, 90-day, and expired intervals with automated clinical write-off workflows.
- **Real-Time WebSockets (`Socket.IO`)**: Live stock notifications triggered when items drop below reorder thresholds or sales complete.
- **Supplier & Purchase Management**: End-to-end purchasing workflow from PO draft to consignment intake, auto-generating batches and stock movements upon receipt.
- **Enterprise RBAC Security**: Strict Role-Based Access Control distinguishing Administrator (owners/managers) and Cashier (dispensary staff) with JWT tokens and `bcrypt` hashing.
- **Financial Analytics & Reporting**: Real-time sales calculations, category breakdowns, inventory valuations (cost vs. retail), cashier leaderboards, and CSV/print exports.
- **Dual-Mode Persistence Architecture**: Out-of-the-box seamless hybrid in-memory store initialized with realistic clinical seed data for instant evaluation, plus full Mongoose schema models ready for MongoDB Atlas.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Motion (Framer Motion), Lucide React, Recharts, Redux Toolkit |
| **Backend** | Node.js, Express.js REST API, JWT Authentication, bcryptjs, Socket.IO |
| **Database** | MongoDB Atlas / Local MongoDB with Mongoose ODM (with fallback store for zero-config evaluation) |
| **Tooling** | Concurrently, TypeScript Compiler (`tsc`), tsx |

---

## 🔐 Demo Credentials

Quick-fill buttons are provided directly on the split-screen login page:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@pharmacare.io` | `admin123` | Full access (Inventory, POS, Staff, Reports, Settings, Purchases) |
| **Cashier / Staff** | `cashier@pharmacare.io` | `cashier123` | POS Billing, Inventory Search, Stock View |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **npm**

### 2. Running Both Frontend & Backend Concurrently

At the root directory:
```bash
npm run dev
```

This starts:
- **Backend API & WebSockets**: `http://localhost:5000`
- **Next.js Frontend**: `http://localhost:3000`

### 3. Running Services Individually (Optional)

```bash
# Start backend server only (Port 5000)
npm run dev:server

# Start frontend client only (Port 3000)
npm run dev:client
```

### 4. Optional: Connecting to MongoDB Atlas
If you wish to use an external MongoDB Atlas cluster:
1. Open `server/.env`.
2. Set your `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/pharmacare_db?retryWrites=true&w=majority
   ```
3. Run the database seed runner:
   ```bash
   npm run seed
   ```

---

## 📁 System Architecture & Directory Structure

```text
Pharmacy Management System/
├── package.json             # Root runner with concurrently scripts
├── README.md                # System documentation
│
├── server/                  # Backend Express REST API & WebSockets
│   ├── .env                 # Server environment variables (PORT, JWT_SECRET, MONGODB_URI)
│   ├── tsconfig.json        # TypeScript configuration
│   └── src/
│       ├── index.ts         # Server boot, Socket.io initialization, API mounting
│       ├── config/
│       │   └── db.ts        # Mongoose connection & fallback detection
│       ├── models/          # 10 Mongoose Schemas (User, Medication, Batch, Sale, etc.)
│       ├── controllers/     # Controllers for all business operations
│       ├── routes/          # RESTful route definitions
│       ├── middleware/      # JWT authentication, RBAC authorization, error handling
│       ├── socket/          # Socket.io broadcast handlers
│       ├── services/        # dbStore (unified hybrid persistence layer)
│       └── seed/            # Comprehensive realistic medical seed dataset & runner
│
└── client/                  # Next.js 14 Frontend Application
    ├── package.json         # Client dependencies
    ├── tailwind.config.ts   # Custom medical color palette & design tokens
    ├── next.config.mjs      # API & Socket environment configuration
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout with Redux & Toast providers
        │   ├── page.tsx           # Session redirection handler
        │   ├── login/page.tsx     # Split-screen branded login with demo quick-fill
        │   ├── dashboard/page.tsx # KPI summary cards, Recharts, alert feed
        │   ├── inventory/page.tsx # Medicine catalog, batch tracking, stock adjustments
        │   ├── billing/page.tsx   # POS 2-panel interface, FEFO deduction, receipt modal
        │   ├── sales/page.tsx     # Invoices history, return/refund management
        │   ├── suppliers/page.tsx # Vendor directory & purchase history
        │   ├── purchases/page.tsx # Restocking orders & stock intake
        │   ├── expiry/page.tsx    # Shelf-life interval tabs & disposal workflows
        │   ├── notifications/page.tsx # Live notification center
        │   ├── staff/page.tsx     # RBAC user management (Admin only)
        │   ├── reports/page.tsx   # Audited financial metrics & CSV export (Admin only)
        │   └── settings/page.tsx  # Pharmacy profile, tax rates, inventory thresholds
        ├── components/
        │   ├── layout/            # Collapsible Sidebar, Navbar, Global Search Modal
        │   ├── providers/         # Redux provider & session initializer
        │   └── ui/                # Modal, Toast, Badge, Button components
        ├── lib/
        │   ├── api.ts             # Typed REST API client with auto-injected JWT
        │   ├── socket.ts          # Socket.IO client
        │   └── utils.ts           # Formatters for currency, dates, statuses
        ├── store/                 # Redux Toolkit store (auth, cart, notifications, settings)
        └── types/                 # Shared TypeScript interfaces
```

---

## 📡 REST API Endpoint Reference

### Authentication
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET /api/auth/me` — Verify authenticated profile
- `POST /api/auth/forgot-password` — Password recovery

### Inventory & Batches
- `GET /api/inventory` — List medicines with stock aggregates & filters
- `GET /api/inventory/:id` — Detail view with batch history & movements
- `POST /api/inventory` — Add medication (*Admin only*)
- `PUT /api/inventory/:id` — Edit medication (*Admin only*)
- `DELETE /api/inventory/:id` — Archive medication (*Admin only*)
- `POST /api/inventory/:id/batches` — Add inventory batch (*Admin only*)
- `POST /api/inventory/:id/adjust` — Adjust stock quantity with audit reason

### Point of Sale & Billing
- `POST /api/billing/checkout` — Process FEFO sale, deduct batches, generate invoice, emit socket alerts

### Sales & Invoices
- `GET /api/sales` — Filterable invoices list
- `GET /api/sales/:id` — Full invoice detail
- `POST /api/sales/:id/return` — Process return/refund & restore stock (*Admin only*)

### Expiry Management
- `GET /api/expiry?range={7|30|90|expired|all}` — Filter batches by expiry window
- `POST /api/expiry/:batchId/dispose` — Write off expired batch (*Admin only*)

### Suppliers & Purchases
- `GET /api/suppliers` & `POST /api/suppliers` — Supplier directory
- `GET /api/purchases` & `POST /api/purchases` — Purchase orders
- `POST /api/purchases/:id/receive` — Receive consignment into active batches (*Admin only*)

### Reports & System
- `GET /api/dashboard/stats` — Dashboard KPIs and chart datasets
- `GET /api/reports?period={today|week|month|year|all}` — Audited reports (*Admin only*)
- `GET /api/alerts` & `PUT /api/alerts/:id/read` — Notification center
- `GET /api/staff` & `POST /api/staff` — Staff management (*Admin only*)
- `GET /api/settings` & `PUT /api/settings` — Application configuration

---

## 📋 Compliance & Design Standards
Designed for strict clinical accuracy, intuitive user experience, and compliant documentation conforming to Experiment-0 specifications.

