# itsme invoicey Android

This folder contains the offline Android build of **itsme invoicey**. It bundles the same business backend and UI as the desktop application, with private SQLite storage under the app data directory. Companies, users, roles, invoices, stock, expenses, attachments, private per-company account backups, and audit data are kept in the selected company workspace.

## Install

Install the supplied `itsme-invoicey-v3.1.5-safe-actions-service-catalog.apk` on Android 11 or newer. Version 3.1.5 uses the package ID `com.itsme.invoicey.proapp` and adds navigation-bar-safe modal actions plus saved service suggestions. Service titles can be searched from the catalog, descriptions and prices remain editable, and matching titles are updated/reused instead of creating duplicate services. On older differently-signed installations, export a workspace backup and uninstall the old build before installing; Android will otherwise report “App not installed.” Save PDF, Print PDF and Share PDF all use the validated document-only A4 exporter. The exporter paints one isolated document surface, prevents stale duplicate modal content, paginates monotonically, applies print margins, keeps complete content, rejects blank/black pages, and preserves proportional logos. Save PDF opens Android's document picker, Print PDF opens the native print dialog, and Share PDF exposes the validated file through a read-only content provider with URI permissions for WhatsApp, Gmail, Drive, Bluetooth and other installed apps. Company Settings saves a separate document accent color per company and applies it to document headings, rules, tables, totals, payment blocks and print/PDF layouts. The release keeps the WebView below system bars, keeps focused fields and actions above the keyboard, and preserves the manually entered per-company Receiver Key. First-time setup and signup require email OTP verification; password recovery uses the verified email, with the saved private recovery code retained as a fallback. Existing data can be moved through the validated workspace backup/restore flow. There is no global all-data reset action; ordinary record-level delete controls remain available according to user permissions.

## Build from source

The project uses Android Gradle Plugin 8.9.2, compile/target SDK 35, and Java 11 source compatibility. Run the `assembleDebug` task from this directory after setting `JAVA_HOME` and `ANDROID_SDK_ROOT`. For a release build, also set `INVOICEY_RELEASE_KEYSTORE`, `INVOICEY_RELEASE_STORE_PASSWORD`, `INVOICEY_RELEASE_KEY_ALIAS`, and `INVOICEY_RELEASE_KEY_PASSWORD`; the signing key is intentionally kept outside source control.

## QA status

The latest reference workflow verifier passed 41 business workflows and 4 relaunch-persistence checks; the Android storage/authentication contract passed 32 checks, and the hosted workflow suite passed 47 checks. These are automated backend and file-asset checks, not a physical-phone run. Phone installation, real SMTP delivery, rendered phone layout, file picker behavior, PDF rendering, printing and performance still require device/hosting validation.

Developer: B.A. Dhameera Idumal · +94 70 235 9602 · dhameera@hotmail.com

Release 3.1.5 adds navigation-bar-safe modal footers and saved service catalog suggestions with case-insensitive title reuse. Release 3.1.4 added safe editing for unpaid invoices and estimates/quotations, with transactional stock replacement and accounting locks for paid, converted or expense-linked invoices. It also retains the duplicate invoice-table continuation-page fix. The exporter accepts exactly one invoice document and one item table, then advances each page start to the previous page end without replaying a separate header or a second document.



