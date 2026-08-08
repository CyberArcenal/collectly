# Collectly – Debt Management System

<p align="center">
  <img src="https://github.com/CyberArcenal/collectly/blob/main/screenshots/ss1.png?raw=true" width="45%" />
</p>

**Collectly** is a cross‑platform desktop application for managing loans, collections, and borrower relationships. Built with Electron, React, TypeScript, and TypeORM (SQLite), it provides a modern UI for tracking debts, payments, penalties, and notifications. The system includes a robust **state transition layer** that automatically handles business rules, audit logging, and data consistency, making it reliable even in complex workflows.

![Electron](https://img.shields.io/badge/Electron-40.x-blue)
![React](https://img.shields.io/badge/React-19.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3.28-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 🚀 Features

### Debtors
- **Debtor Directory** – searchable, paginated list of all borrowers with contact details and outstanding debt.
- **Credit Checks** – internal scoring based on payment history and overdue flags; full audit log of every check.
- **Debtor Groups / Segments** – create groups (VIP, High‑Risk, etc.) and assign debtors for targeted collections.
- **State Transitions** – automatic handling of borrower activation/deactivation, which updates all related debts (e.g., marks active loans as defaulted upon deactivation).

### Loans & Debts
- **Active Loans** – view all active debts with days left, filter by due date range or remaining amount.
- **Overdue Accounts** – dedicated page with penalty application, bulk reminders, and partial payments.
- **Closed Loans** – archive of fully paid debts with summary stats and ability to reopen.
- **Loan Applications** – manage new loan requests; approval automatically creates an active debt and, if configured, generates a PDF loan agreement.
- **Forgiveness & Corrections** – apply forgiveness with notifications, or correct total amounts without triggering forgiveness flows.
- **State Transitions** – debt status changes (`active` → `overdue` → `defaulted` → `paid`) are managed by a dedicated transition service that applies penalties, sends notifications, updates credit scores, and prints receipts.

### Collections
- **Payment Schedule** – calendar or list view of upcoming expected payments; mark payments as paid directly.
- **Transaction Log** – complete history of all payments, exportable to CSV/JSON, with admin edit/delete.
- **Payment Methods** – CRUD for payment types (Cash, Bank Transfer, etc.), set default, view usage stats.
- **Payment State Transitions** – when a payment is created, it is automatically confirmed and applied to the debt within a transaction. Editing, deleting, or restoring a payment will **automatically adjust the debt's paid and remaining amounts** to maintain consistency, thanks to the payment transition service.

### Reports
- **Aging Analysis** – AR aging buckets (0‑30, 31‑60, 61‑90, 90+ days) with bar chart and drill‑down to debts.
- **Collection Report** – actual vs. expected collection over time, KPIs, and payments per debtor.
- **Debtor Statement** – printable PDF/HTML statement showing all loans, payments, and penalties for a selected debtor.
- **Expected Payments** – forecast incoming payments based on due dates; filter by debtor group.

### System
- **Audit Trail** – complete history of all CREATE, UPDATE, DELETE actions across the system.
- **Notification Logs** – track email/SMS notifications sent to borrowers.
- **Device (Printer) Manager** – configure receipt printers (USB, network, Bluetooth), test print, set default.
- **System Settings** – centralised configuration for general, collections, loans, notifications, reports, integrations, and audit/security.
- **Robust Transaction Safety** – all write operations are wrapped in database transactions. If any step fails, changes are rolled back. The payment creation includes **explicit validations** (e.g., debt existence, positive amount, valid date, and soft‑delete check) to catch errors early.
- **Built‑in Reconciliation** – the system can recalculate `paidAmount` from the sum of active payments to fix any rare inconsistencies (available as an admin tool).

### Additional
- **Dark / Light Theme** – theme toggling via CSS variables.
- **Export & Import** – reports, transactions, and settings can be exported to CSV, Excel, or PDF.
- **Windows‑like UI** – compact tables, cards, and familiar button styles for a professional feel.

---

## 🛠️ Technology Stack

| Layer            | Technologies |
|------------------|--------------|
| **Desktop Framework** | Electron 40.x |
| **Frontend**     | React 19 (TypeScript), Tailwind CSS, React Router, React Hook Form, Chart.js / Recharts |
| **Backend (IPC)** | Node.js, TypeORM, SQLite |
| **Database**     | SQLite (with TypeORM migrations) |
| **Printing**     | `escpos`, raw TCP, system printing commands (Windows / Linux) |
| **Notifications** | Nodemailer (SMTP), Twilio (SMS) |
| **Build & Packaging** | Vite, electron-builder (NSIS for Windows, DMG for macOS, AppImage/Deb for Linux) |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Clone & Install
```bash
git clone https://github.com/CyberArcenal/collectly.git
cd collectly
npm install
```

### Development
```bash
npm run dev
```
This will start the Vite dev server and launch the Electron app in development mode.

### Database Migrations
```bash
npm run migration:generate   # generate a new migration from entity changes
npm run migration:run        # run pending migrations
```

### Build for Production
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```
The installers will be placed in the `release/` directory.

---

## 🗂️ Project Structure

```
debt-management/
├── src/
│   ├── main/                # Electron main process
│   │   ├── db/              # Data source & migrations
│   │   ├── entities/        # TypeORM entities (Debt, Payment, Borrower, etc.)
│   │   ├── ipc/             # IPC handlers (debt, borrower, group, loanApp, etc.)
│   │   ├── services/        # Core business logic (DebtService, PaymentService, etc.)
│   │   ├── StateTransitionServices/   # Business rules for status changes (Debt, Payment, Borrower, etc.)
│   │   ├── subscribers/     # TypeORM subscribers that trigger state transitions
│   │   └── index.js         # Main entry point
│   ├── renderer/            # React frontend
│   │   ├── api/             # API clients (IPC wrappers)
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (debtors, loans, reports, settings)
│   │   ├── contexts/        # React contexts (settings, theme)
│   │   ├── utils/           # Helpers, formatters, dialogs
│   │   └── main.tsx         # React entry
│   ├── entities/            # Shared entity definitions (used by both main & renderer types)
│   └── utils/               # Shared utilities (logger, auditLogger, etc.)
├── migrations/              # TypeORM migration files
├── build/                   # Icons and build resources
├── release/                 # Generated installers
├── package.json
└── README.md
```

---

## 🔧 Configuration

All system settings are stored in the database table `system_settings`. You can modify them via the **Settings** page in the app. Key categories:

- **General** – company name, timezone, currency, auto‑logout, date format.
- **Collections** – default interest/penalty rates, auto‑penalty, reminder days.
- **Loans** – partial payments, early payment discounts, amortization type.
- **Notifications** – email/SMTP, SMS/Twilio, reminder schedules.
- **Reports** – export formats, backup schedule, retention days.
- **Integrations** – accounting API, credit bureau API, webhooks.
- **Audit & Security** – audit log retention, log events, MFA for admin.

---

## Sync System

The application uses a **full sync** approach to synchronize data with the server. Unlike per‑entity sync, full sync sends all data for all entities in a single atomic operation.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Full Sync** | All entities are synced together in one background task |
| **Per‑User Metadata** | Each user has independent sync state (tracked on server) |
| **Local Snapshots** | Client stores lightweight snapshots (`sync_snapshots`) for change detection |
| **Task‑based Progress** | Sync runs asynchronously; progress is polled via task ID |
| **Atomic Transaction** | Either all records save or none do |

### Sync Flow

1. **User triggers sync** – Click "Full Sync" button
2. **Client loads all local data** – All entities are read from local database
3. **Server receives payload** – Validates foreign keys, processes in dependency order
4. **Task is queued** – Server returns a `taskId` for progress tracking
5. **Client polls for progress** – Progress updates shown in real‑time
6. **Snapshots updated** – On completion, local snapshots are updated with new record counts

### Entities Synced

| Entity | Description |
|--------|-------------|
| `PaymentMethod` | Payment types (Cash, GCash, etc.) |
| `Borrower` | Debtor/Customer information |
| `Debt` | Loan and payment obligations |
| `LoanAgreement` | Contract details |
| `LoanApplication` | Loan requests |
| `PaymentTransaction` | Payment records |
| `PenaltyTransaction` | Penalty records |

### Change Detection

The client uses `sync_snapshots` to detect local changes:

- **Record Count** – If the number of records for an entity differs from the last sync, it's considered changed
- **Data Hash** – A SHA‑256 hash of record IDs and timestamps is stored; if the hash changes, the entity has been modified

When changes are detected, the UI shows a "X new" badge on the entity list.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sync/full/` | POST | Start a full sync |
| `/api/v1/sync/status/` | GET | Get per‑user sync status |
| `/api/v1/sync/task/{task_id}/` | GET | Get task progress |
| `/api/v1/sync/tasks/` | GET | List tasks |

### Offline Support

In offline mode, the client stores all changes locally. The sync service automatically detects changes via snapshots and syncs them when the server becomes available.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Sync fails | Check server logs; verify server is reachable |
| "No changes detected" | Check if data was actually modified; if not, sync may be skipped |
| Stuck "Syncing" status | Restart the app; run `npm run migration:run` to ensure snapshots table is up‑to‑date |
| Missing entities | Ensure all 7 entities are included in the sync payload |

---

For more details, see [docs/SYNC.md](docs/SYNC.md).
```

---

## 12.10.2: Create `docs/SYNC.md`

```markdown
# Sync System Documentation

## Overview

The Collectly sync system provides offline‑first synchronization using a **full sync** strategy. All data for all entities is sent to the server in a single request, processed atomically, and tracked via background tasks.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Electron)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Local Database (SQLite)                      │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │   │
│  │  │  borrowers    │  │  debts        │  │  sync_snapshots   │   │   │
│  │  ├───────────────┤  ├───────────────┤  ├───────────────────┤   │   │
│  │  │  payments     │  │  penalties    │  │  entity, count,   │   │   │
│  │  │  loan_agreem  │  │  loan_apps    │  │  hash, status     │   │   │
│  │  └───────────────┘  └───────────────┘  └───────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Sync Service (Main)                         │   │
│  │  • fullSync() → builds payload, calls server                   │   │
│  │  • getSyncStatus() → merges server + local snapshots          │   │
│  │  • getPendingChanges() → detects local modifications           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     IPC Handlers                                │   │
│  │  • full_sync.ipc.js                                            │   │
│  │  • status.ipc.js                                               │   │
│  │  • task_status.ipc.js                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Django)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Full Sync Endpoint                          │   │
│  │  POST /api/v1/sync/full/                                       │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │ 1. Validate payload                                     │   │   │
│  │  │ 2. Process entities in dependency order                 │   │   │
│  │  │ 3. Atomic transaction                                   │   │   │
│  │  │ 4. Update UserSyncMetadata (per‑user)                   │   │   │
│  │  │ 5. Return task ID                                       │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### Client Side

#### SyncSnapshot Entity

The `sync_snapshots` table stores lightweight metadata for each entity:

| Field | Type | Description |
|-------|------|-------------|
| `entity` | string | Entity name (e.g., 'Borrower') |
| `lastSyncedAt` | datetime | Last successful sync timestamp |
| `recordCount` | integer | Number of records at last sync |
| `dataHash` | string | SHA‑256 hash of records |
| `syncStatus` | string | idle / syncing / completed / failed |
| `lastSyncTaskId` | string | Associated server task ID |

#### SyncSnapshotService

- `getSnapshot(entityName)` – Get snapshot for an entity
- `updateSnapshot(entityName, recordCount, hash, taskId)` – Update after sync
- `markSyncing(entityName)` – Mark as in progress
- `markFailed(entityName)` – Mark as failed
- `hasEntityChanged(entityName, records)` – Check for local changes
- `computeEntityHash(entityName, records)` – Generate hash for change detection

#### SyncService (Simplified)

- `fullSync(user, metadata)` – Start a full sync, returns task ID
- `getSyncStatus()` – Merge server metadata with local snapshots
- `getTaskStatus(taskId)` – Poll server for progress
- `pollTaskStatus(taskId, callback)` – Continuously poll until completion
- `getPendingChanges()` – List entities with local modifications

### Server Side

#### UserSyncMetadata

Tracks per‑user sync state per entity:

| Field | Description |
|-------|-------------|
| `user` | User who owns the metadata |
| `entity` | Entity name |
| `last_synced_at` | Last successful sync timestamp |
| `total_synced` | Cumulative records synced |
| `status` | idle / syncing / completed / failed |
| `last_sync_ip` | IP address of the client |
| `last_sync_user_agent` | Device/browser info |

#### TaskProgress

Tracks progress of a background sync task:

| Field | Description |
|-------|-------------|
| `task_id` | Unique task identifier |
| `status` | queued / running / completed / failed |
| `total` | Total records to process |
| `processed` | Records processed so far |
| `current_entity` | Entity being processed |

## Data Flow

### Full Sync Sequence

```
Client                    Server
  │                         │
  │  1. Load all local data │
  │  (borrowers, debts...)  │
  │                         │
  │  2. POST /sync/full/    │
  │  { entities: {...} }    │
  │─────────────────────────>│
  │                         │
  │                         │  3. Validate
  │                         │  - Required fields
  │                         │  - Foreign keys
  │                         │  - Uniqueness
  │                         │
  │                         │  4. Process entities
  │                         │  in dependency order
  │                         │
  │                         │  5. Atomic transaction
  │                         │  Save all records
  │                         │
  │                         │  6. Update per-user
  │                         │  metadata
  │                         │
  │  7. Return task_id      │
  │<─────────────────────────│
  │                         │
  │  8. Poll /task/{id}/    │
  │─────────────────────────>│
  │                         │
  │  9. Progress updates    │
  │<─────────────────────────│
  │                         │
  │  10. Task completed     │
  │  (or failed)            │
  │<─────────────────────────│
  │                         │
  │  11. Update snapshots   │
  │  (local)                │
  │                         │
```

### Entity Processing Order (Server)

1. `PaymentMethod` – No dependencies
2. `Borrower` – No dependencies
3. `Debt` – Depends on `Borrower`
4. `LoanAgreement` – Depends on `Debt`
5. `LoanApplication` – Depends on `Borrower`
6. `PaymentTransaction` – Depends on `Debt` and `PaymentMethod`
7. `PenaltyTransaction` – Depends on `Debt`

## Client API Usage

### Starting a Full Sync

```javascript
import syncAPI from './api/utils/sync';

// Start sync
const result = await syncAPI.fullSync(
  {}, // entities loaded by main process
  {
    client_user: 'admin',
    device_id: 'desktop-123',
    app_version: '2.0.0'
  }
);
// result = { taskId: 'abc-123', status: 'queued', entities: [...], totalRecords: 150 }
```

### Polling for Progress

```javascript
const progress = await syncAPI.pollTaskStatus(
  taskId,
  (progress) => {
    console.log(`Progress: ${progress.progressPercentage}%`);
    // Update UI
  }
);
console.log('Sync completed:', progress);
```

### Getting Sync Status

```javascript
const status = await syncAPI.getSyncStatus();
// Returns merged server + local status
console.log(status.entities); // Array of EntitySyncStatus
```

### Detecting Local Changes

```javascript
const changes = await syncAPI.getPendingChanges();
changes.forEach(change => {
  console.log(`${change.entity}: ${change.reason}`);
  console.log(`  ${change.previousCount} → ${change.currentCount} records`);
});
```

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Sync not available` | Server offline or no URL configured | Check server connection; verify `system_settings` has server URL |
| `Validation failed` | Payload missing required fields or invalid data | Check the error details; fix data and retry |
| `Task not found` | Task ID expired or invalid | Start a new sync; don't reuse old task IDs |
| `Polling timed out` | Server took too long to respond | Increase timeout or check server performance |
| `Foreign key error` | Referenced record not found in payload | Ensure parent records (e.g., Borrower) are included before child records (e.g., Debt) |

### Debugging

1. **Check logs**: Look in `src/main/logs/` for detailed logs.
2. **Enable verbose logging**: Set `NODE_ENV=development` to see more output.
3. **Inspect database**: Use SQLite browser to check `sync_snapshots` table for status.
4. **Test with small dataset**: Reduce records to isolate issues.

### Resetting Sync State

If sync gets stuck, you can reset snapshots:

```sql
-- Reset all snapshots to idle
UPDATE sync_snapshots SET syncStatus = 'idle';
```

Or use the reset function (if exposed via IPC).

## Migration from Old Sync

If you're migrating from the old per‑entity sync system:

1. **Drop old tables**: `sync_metadata`, `sync_conflicts`, `sync_queue` are no longer used.
2. **Create `sync_snapshots`**: Run migration to add the new table.
3. **Update API endpoints**: Replace per‑entity calls with `/sync/full/`.
4. **Update client logic**: Remove conflict/queue handling.

For detailed migration steps, see the [Client Migration Guide](./client_migration_guide.md).

---

**Last Updated:** August 2026
```

---

## 12.10.3: Update API Client Documentation (JSDoc)

The API methods in `src/renderer/api/utils/sync.ts` already have JSDoc comments. We'll ensure they are comprehensive and up‑to‑date.

```typescript
// src/renderer/api/utils/sync.ts (excerpt with improved JSDoc)

/**
 * Start a full sync of all local data to the server.
 *
 * This method loads all entities from the local database and sends them
 * to the server in a single request. The server processes them atomically
 * and returns a task ID for progress tracking.
 *
 * @param entities - Dictionary of entity_name -> { records: [...] }
 *                   If empty, the main process will load all data.
 * @param metadata - Optional metadata for the sync request.
 * @param metadata.client_user - Username of the client user (default: "system").
 * @param metadata.device_id - Device identifier (e.g., MAC address, UUID).
 * @param metadata.app_version - Application version.
 * @returns Object containing taskId, status, list of entities, and totalRecords.
 * @throws Error if sync is unavailable or the server returns an error.
 *
 * @example
 * ```ts
 * const result = await syncAPI.fullSync(
 *   { Borrower: { records: borrowers } },
 *   { client_user: 'admin', device_id: 'desktop-123' }
 * );
 * console.log(result.taskId); // "abc-123"
 * ```
 */
async fullSync(
  entities: Record<string, { records: any[] }>,
  metadata?: { client_user?: string; device_id?: string; app_version?: string }
): Promise<FullSyncResponse> {
  // ... implementation
}

/**
 * Get the current sync status, merging server metadata with local snapshots.
 *
 * This method queries the server for per‑user sync metadata and combines it
 * with local snapshots to provide a complete picture of sync state.
 *
 * @returns UserSyncSummary with additional local fields.
 *
 * @example
 * ```ts
 * const status = await syncAPI.getSyncStatus();
 * console.log(status.totalEntities); // 7
 * status.entities.forEach(e => console.log(e.entity, e.status));
 * ```
 */
async getSyncStatus(): Promise<UserSyncSummary & {
  localSnapshots?: any[];
  pendingChangesCount?: number;
  source?: string;
}> {
  // ... implementation
}
```
---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

Please ensure your code adheres to the existing ESLint configuration and includes appropriate tests (where applicable).

---

## 📄 License

This project is proprietary software. For commercial licensing inquiries, please contact:

**CyberArcenal** – [cyberarcenal1@gmail.com](mailto:cyberarcenal1@gmail.com)

---

## 📧 Contact

- Author: CyberArcenal
- Email: cyberarcenal1@gmail.com
- GitHub: [CyberArcenal](https://github.com/CyberArcenal)

---

## 🙏 Acknowledgements

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [TypeORM](https://typeorm.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Chart.js](https://www.chartjs.org/) / [Recharts](https://recharts.org/)

---

*Collectly – Helping you stay on top of collections, one payment at a time.*