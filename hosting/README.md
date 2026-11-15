# Shared hosting API

This entrypoint starts the same backend used by the Android app. It provides
the authenticated multi-company API, SQLite persistence, private per-company account backup/restore,
permissions, invoice/quotation workflows and static desktop UI from `public/`.

Run from the project root with Node 22 or newer:

```text
node hosting/server.mjs
```

Configure `LEDGER_DATA_DIR` and `LEDGER_DB` on a persistent hosting volume.
Use HTTPS and set `INVOICEY_CORS_ORIGIN` to the exact origin(s) of the Android
app and any separately hosted desktop UI. Do not use `*` with login cookies.

For Android shared mode, set `globalThis.INVOICEY_API_BASE_URL` in
`public/api-config.js` to the hosted API origin before building the APK. Leave
it empty to retain the current offline-local mode.

## Hosted security controls

`hosting/server.mjs` installs `http-security.mjs` before starting the portable
backend. It applies CSP and related response headers, API no-store caching,
exact-origin checks for writes and JSON content-type enforcement. Workbook
restore remains binary. The public origin defaults to
`https://api.primeenergy.lk`; set `INVOICEY_PUBLIC_ORIGIN` for a different host.
`INVOICEY_CORS_ORIGIN` accepts comma-separated exact HTTP(S) origins only.
Opaque `null` origins and wildcards are deliberately excluded. Separately hosted
clients should use an explicitly approved HTTP(S) origin, not a file:// page.

Hosted backup locations must stay within each active company's backup folder.
Creating a company cannot assign a custom backup location. These checks do not
move or delete existing databases or backups.

For isolated browser tests only, use `NODE_ENV=test`, a private disposable
`LEDGER_DATA_DIR`, `INVOICEY_TEST_EMAIL_OUTBOX`, and `INVOICEY_TEST_BROWSER=1`.
That last flag serves an empty API base so the sandbox cannot accidentally
contact the production API. Never enable these test settings on the live app.

Run `node scripts/security-qc.mjs`, `node scripts/tenant-qc.mjs` and
`node scripts/workflow-qc.mjs` for isolated regression checks. The last suite is
an Android fetch-contract reference test, not evidence of a physical APK test.

