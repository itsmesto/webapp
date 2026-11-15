# itsme invoicey 3.0.1

## Installation fix

- The previous 3.0.0 APK used the Android debug certificate and package ID `com.itsme.invoicey`.
- This production build uses package ID `com.itsme.invoicey.mobile` and a dedicated RSA 4096-bit release certificate. It installs as a clean application when an older debug-signed package is present.
- The package is universal: it contains no device-specific native ABI split.

## Included

- Offline Android host with bundled frontend and local SQLite backend.
- Separate company workspaces, login, roles, permissions, inventory, sales, purchases, invoices, quotations, estimates, expenses, payments, profit calculations, search, audit logs, Excel backup/restore, and PDF export.
- Android Storage Access Framework for user-selected backup destinations.
- A4 PDF generation with page checks before export.
- ITSME Invoicey logo and developer credit in the app.

## Migration

The changed package ID means Android treats this as a new application. If records exist in an older installation, use the old app's validated workspace export and import it after installing this build. Do not delete the old app until the export has been verified.

