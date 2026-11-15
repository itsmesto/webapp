# itsme invoicey Android quality plan

This is a verification plan, not a claim that the checks below have passed. Record actual results in a separate generated QA report.

## Target and baseline

- A standalone, offline Android installation must operate without the Windows computer or a remote server.
- Samsung Galaxy A16 and A16 5G are separate models and regional variants. The precise phone model, installed Android version, Android System WebView version, memory, and storage must be reported when physical testing is possible.
- Samsung's official A16 5G specification lists a 1080 × 2340 display, 6.7 inch nominal size, and 90 Hz maximum refresh rate. It now offers Android 15 and Android 16 manuals. Validate at least Android 14 / API 34 baseline and the latest locally available newer API when practical.
- An emulator can validate API behavior, installation, SQLite storage, Android lifecycle, touch layouts, and file intents. It does not validate Samsung One UI, Samsung-specific file providers, actual phone speed, or real device hardware.
- Exercise portrait near 360–412 CSS pixels, landscape, 200% font scale, keyboard visible, system Back, rotation, and the top/bottom safe insets.

## Reusable business workflow

The existing `scripts/tenant-qc.mjs` is the primary business behavior reference. Its 38 checks run against the Windows/Node server. Android must run equivalent assertions against its own runtime and storage, rather than treating Windows results as proof of Android functionality.

1. First setup creates company A, company administrator and distinct super administrator; logo, profile, bank details and terms persist.
2. Restart and login reload the same company data.
3. Create customer, supplier, product and service. Purchase stock adds inventory and supplier payment; weighted cost is calculated.
4. Create quotation with product/service lines, item and document discount and tax; stock does not change. Edit preserves project reference.
5. Add project labour and material/transport expenses and upload PDF/JPEG/PNG receipts.
6. Convert quotation to invoice; quotation reference remains; product inventory falls once; services do not alter inventory.
7. Record partial payment and overpayment; project expenses, profit, margin and partner shares agree with independently calculated expected values.
8. Generate invoice, quotation, estimate and receipt PDF. Confirm A4 dimensions, sharp proportional logo, exact company details, long tables, totals and terms, no black/blank pages, overlaps or cut-off content.
9. Export company Excel backup; validate tables, manifest, typed data, asset bytes and company ID; restore own backup atomically; reject wrong company, corrupt file and incompatible version without data changes.
10. Create company B and new signed-up company C. Verify empty records, separate folders/databases/backups and limits; create B record, then switch to A and confirm it cannot be found there.
11. Create salesperson and accountant; verify every meaningful allowed/denied API operation and navigation. Salesperson sees own sales only. A normal admin cannot open super-admin controls or read B data.
12. Configure custom permissions, deactivate/reactivate a user, reset password, enforce user/role limits, prevent removing the last administrator.
13. Logout then Back/relaunch must not restore protected pages or data. Invalid credentials, offline recovery code and password change work; hashes, salts and session secrets are not readable passwords.
14. Search partial accented name, formatted/partial phone, address, invoice/quotation number, SKU, product and service description; combine filters then clear them.
15. Edit/update and void/cancel/delete records appropriately, including inventory reversal and audit entries. Reject overselling and malformed amounts without partial writes.

## Android-specific storage and lifecycle

- Force-stop and relaunch after completed write: same company profile, transactions, roles, theme and attachments remain.
- Rotate and return from background with open form and document preview; no duplicate transaction, stale company, crash or lost saved data.
- Run with Wi-Fi/mobile data disabled; login, ordinary modules, reports and local automatic backups still work.
- Install an update over the same package and signing identity: existing data and password remain. An uninstall is expected to remove private app data unless the user exports a backup first.
- Use system document pickers rather than raw Windows paths. Test choosing a backup directory, persistable URI permission, exporting and importing after process restart, denied/cancelled picker, no provider installed, full storage and inaccessible folder.
- File upload must handle content:// documents, encoded names, PNG/SVG logo policy, file size/type validation and cancellation.
- Verify A4 PDF export opens/shares through a read-only content URI with an appropriate grant. XLSX export opens with Excel or another spreadsheet app where available.
- External web/email/phone links open external apps; no external page runs in the trusted local WebView bridge.
- Release build disables remote WebView debugging, rejects untrusted URI navigation, and stores database files only in private app storage.

## Desktop data portability gap to resolve

The existing per-company Excel export contains business tables, attachments and company profile, but excludes `access.sqlite` (user accounts, password hashes, memberships, permissions, user limits, audit and sessions). It also requires a matching original company UUID. Creating an unrelated Android company with the same name must never bypass that validation.

To preserve saved desktop data together with accounts and permissions, implement and test an explicit full-environment migration archive with a manifest and integrity checks, or an equally strict company-adoption migration operation. Do not silently weaken ordinary cross-company restore safeguards. Path values must be remapped into Android private storage and all live sessions must be invalidated on migration. A deliberate secure portable archive should not carry plaintext passwords.

## Test evidence and result format

Record test name, expected behavior, actual result, pass/fail/skipped, device/emulator model, API version, WebView version, app version, source revision, timestamps and attachment paths. Save screenshots for setup, login, dashboard, navigation, company switch, populated invoice form and dark mode. Save exported PDF/Excel artifacts and machine-readable reports.

Never state that every requirement passed when a check was skipped. Physical Galaxy A16, Samsung file-provider behavior, physical printing and real-device performance must be marked untested unless actually exercised.

## Primary compatibility documentation

- [Samsung Galaxy A16 5G official specification and manuals](https://www.samsung.com/in/smartphones/galaxy-a/galaxy-a16-5g-light-green-128gb-sm-a166plgbins/)
- [Android Emulator hardware acceleration](https://developer.android.com/studio/run/emulator-acceleration): Windows Hypervisor Platform is the recommended Windows backend; CPU virtualization must be available. A Windows reboot may be required if the hypervisor feature is newly enabled. AEHD is scheduled to retire on 31 December 2026.
- [Android WebView integration and security](https://developer.android.com/develop/ui/views/layout/webapps/webview): only trusted packaged pages may call an injected native bridge; external links should open outside the bridged WebView.

