# itsme invoicey

itsme invoicey is a responsive business operations app for sales, purchasing, stock, expenses, payments and reporting. It runs locally with its built-in SQLite database and also ships as Windows and Android packages.

## Start the application

Use Node.js 22.5 or later (Node.js 24 or later is recommended). From this folder, run:

```sh
node hosting/server.mjs
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). Leave the terminal running while you use the app. Stop it with **Ctrl+C**.

The first start creates `data/ledgerly.sqlite` and fills it with clearly editable example business records so the dashboard is ready to explore. Future starts reopen the same database. Enter your business name, contact information, address and currency under **Settings**. The sample records are not real customer or supplier data.

## Windows 10 desktop app

The Electron desktop build opens Ledgerly in its own Windows window and starts its SQLite service locally. The final installer bundles the runtime, so the installed app does not require Node.js. It stores its database in `%APPDATA%\Ledgerly Business Operations\ledgerly.sqlite` and keeps the local service bound to `127.0.0.1`.

On a Windows build machine with Node.js 22.12 or later and internet access, run:

```sh
pnpm install --config.block-exotic-subdeps=false
pnpm desktop:start
pnpm desktop:make
```

The Windows installer is created under `out/make/`. The packaged application starts with its own local database; it does not bundle the development database or copy browser data automatically. Back up `data/ledgerly.sqlite` from the web version before migrating existing records.

## Android app

The Android release bundles the same authenticated, multi-company business workspace with private SQLite storage, per-company account backup/restore, company separation, permissions, invoices, quotations, inventory, expenses and reporting. Install the rebuilt `app/build/outputs/apk/release/app-release.apk` on Android 11 or newer. The current standalone application ID is `com.itsme.invoicey.proapp`.

The Android startup uses a classic script on the private WebView asset origin. This avoids a WebView compatibility failure where the external module script was rejected and the screen stayed on “Bringing your workspace together”. Startup now has a 15-second timeout and a Retry button, and local date formatting no longer depends on the device locale accepting the `en-CA` extension.

The Android backend is bundled in `android/app/src/main/assets/business/backend.js`. The QC runners use `hosting/server.mjs` with disposable data directories, and the Android runtime contract QC covers storage, email-code registration and password recovery, company separation, invoices, quotations, inventory, expenses, payments, backup/restore and permissions.

## Shared Android + desktop API

The project now includes `hosting/server.mjs`, which starts the same tested backend for a shared HTTPS host. It serves the desktop UI and API from one origin and supports Android cross-origin requests with credential cookies when `INVOICEY_CORS_ORIGIN` is configured. Set persistent `LEDGER_DATA_DIR` and `LEDGER_DB` storage on the host, then run `node hosting/server.mjs` with Node 22 or newer.

The frontend reads `public/api-config.js`. Leave `INVOICEY_API_BASE_URL` empty for the current offline-local mode; set it to the hosted API origin before rebuilding Android to connect the phone to the shared workspace. The hosted API requires HTTPS and an exact CORS origin list; do not use `*` with login cookies.

## Email verification and password recovery

First-time setup and new-company signup require a one-time email code before creating an account. Forgot-password sends a time-limited code to the verified account email and invalidates the account's existing sessions after a successful reset. Existing accounts can add or update their recovery email from **Settings → Account recovery email** after signing in. A private recovery code remains as an offline fallback for accounts that do not yet have a verified email.

For the hosted service, configure `SMTP_HOST`, `SMTP_PORT` (465 by default), `SMTP_SECURE` (`true` or `false`), `SMTP_USER`, `SMTP_PASSWORD` and optionally `SMTP_FROM` in the hosting environment. Keep the SMTP password in the host's private environment settings, never in source control or the app. Email-code features stay unavailable until a mail transport is configured. The application has no global factory-reset code or all-data wipe action; normal record-level delete controls are unchanged.

## What is included

- **Overview:** sales today, month-to-date net profit, receivables, inventory value, recent invoices, cash movement, low-stock alerts and top customers.
- **Invoices and sales:** product and service lines, due dates, partial and full receipts, overpayments/customer credit, print layout and outstanding balances. Saving an invoice reduces product stock and saves product/service cost at the time of sale. Unpaid standalone invoices can be reopened from the invoice list or document preview and edited; paid, converted or expense-linked invoices stay locked to protect accounting history.
- **Quotations and estimates:** create and edit offers, reopen them from the quotation list or document preview, print customer-ready documents, set expiry dates and convert a quote into an invoice. Each quotation creates a Project Key that remains on its converted invoice.
- **Projects:** see each Project Key’s quotation/invoice history, revenue, costs, linked expenses, labor, uploaded receipts, category totals, profit and margin.
- **Inventory:** product codes, categories, units, opening balances, reorder points, weighted-average purchase cost, selling prices, unit margins and stock-in/stock-out corrections.
- **Services:** maintain a reusable service catalog with descriptions, charges and cost estimates. Service document lines do not change stock and print with a title and description.
- **Purchases:** record supplier purchases, received products and an initial supplier payment. Stock increases and weighted-average product cost recalculates together.
- **Expenses:** link costs to customers, quotations, invoices and Project Keys. Record worker counts, names, days or hours and labor rates; upload PDF/JPG/JPEG/PNG bills and receipts. Expense categories can be maintained in the app.
- **Customers and suppliers:** contact records, lifetime activity, related documents, account balances and transaction history.
- **Payments:** separate timelines for customer receipts and supplier payments, with invoice allocation and supplier account credits.
- **Profit sharing:** maintain partner percentages and save period distributions based on realized net profit.
- **Reports:** daily, monthly and yearly ranges for sales, purchases, expenses, inventory and profit; export report data as CSV.
- **Search and filters:** search the current list and filter by record status, stock level and category.

## Connected calculations

- Invoice totals start with item quantities multiplied by unit price, then apply line and document discounts and tax. Saving an invoice deducts product quantities from stock and stores product/service cost on every invoice line. Services never change stock.
- Customer receipts are attached to invoices. The remaining amount is `max(invoice total − receipts, 0)`. Amounts above an invoice total remain visible as customer credit.
- A purchase increases available stock and updates purchase cost using a quantity-weighted average. Supplier payments reduce the supplier's balance.
- Project revenue is the invoice subtotal after discounts, before tax. Project cost combines captured product/service cost and expenses linked to its Project Key. Net profit is gross profit less dated operating and project expenses. Purchases are treated as inventory purchases, not immediate expenses.
- Partner distributions use positive net profit for the chosen date range multiplied by each partner's current share percentage. Distributions are displayed separately and do not subtract profit twice.
- Reports use invoice, purchase, expense and movement dates. Inventory value is on-hand quantity multiplied by current weighted-average purchase cost.

## Data model

The normalized schema is in [`database/schema.sql`](database/schema.sql). It includes:

| Area | Tables |
| --- | --- |
| Workspace | `settings`, `companies`, `sequences` |
| People | `customers`, `suppliers`, `partners` |
| Catalog and stock | `products`, `services`, `stock_movements` |
| Sales | `invoices`, `invoice_items`, `payments` |
| Quotes and projects | `quotations`, `quotation_items`, `projects` |
| Purchasing | `purchases`, `purchase_items`, `supplier_payments` |
| Expenses and profit | `expenses`, `expense_categories`, `expense_attachments`, `profit_shares` |

The server applies related writes in SQLite transactions for invoice creation, purchases, stock adjustments and quote conversion. Foreign keys and non-negative/positive amount constraints are enabled in the schema.

Private account backups are debounced per company so a burst of invoice or quotation edits does not rebuild the SQLite snapshot after every row. Manual backup, download and restore actions remain immediate. Each company has its own backup history; credentials, OTP records and active sessions are never included.

## Printing documents

Use **Print / Save PDF** on an invoice, quotation, estimate, purchase order or receipt. Turn off **Headers and footers** in the browser print dialog to omit browser-generated dates, page counts and page titles. The print layout uses A4 sizing and repeats item-table headings on multi-page documents. The saved file is a validated PDF output; edit the source invoice or quotation in the app and export again when values need to change. Paid/converted/expense-linked invoice history remains protected.

## Project files

- `hosting/server.mjs` — Node HTTP server, API routes, SQLite persistence and shared hosted business workflows.
- `database/schema.sql` — relational schema and indexes.
- `public/index.html`, `public/styles.css`, `public/extra.css`, `public/app.js` — responsive frontend.
- `data/ledgerly.sqlite` — created locally on first start; excluded from version control.

The desktop server binds to `127.0.0.1`; the packaged applications keep their data in their local application data directories. Each company has a separate workspace and private backup location. Use Company Settings → Account Backup & Restore to create, download or restore company data snapshots.

