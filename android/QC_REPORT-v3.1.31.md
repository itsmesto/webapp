# Android release QC — 3.1.31

Date: 2026-11-15  
Production package: `com.itsme.invoicey.fixed1`  
QA APK package: `com.itsme.invoicey.fixed1.qa`  
Version: `3.1.31` (version code `31531`)  
Minimum Android: API 30; target/compile SDK: 36.

## User-reported issue addressed

When users chose WhatsApp or another Android share target for a quotation/invoice PDF, the chooser could open but the receiving app might not be able to read the attachment. The Android layer now:

- checks that the generated/cached PDF exists and is non-empty;
- builds a content URI for the private cached file;
- shares it as `application/pdf` using `ACTION_SEND` and `EXTRA_STREAM`;
- places the same URI in `ClipData` and adds read-grant flags to send intent and chooser;
- grants read-only URI permission to eligible resolved share targets;
- declares PDF send-target visibility in the manifest.

The receiving app opens the selected chat/composer; the user still needs to press **Send**. WhatsApp contact selection and actual sending were not automated.

## Additional defect found during QC

The malformed uploaded-backup path could fail while attaching the SQLite file, before the restore handler's error conversion, producing HTTP 500. Restore now catches attach/read/compatibility failures, returns a clear invalid-backup validation response, rolls back only when a transaction began, restores foreign-key enforcement, and detaches only if attachment succeeded. Existing company-mismatch and validation messages remain intact.

The workflow QA script was updated to match the current contract: expenses attach to paid invoices, and backup/restore uses private per-company SQLite snapshot endpoints rather than removed XLSX routes. Corrupt and cross-company backup cases are covered.

## Verification results

| Check | Result | Scope |
|---|---:|---|
| Android Gradle `:app:assembleDebug` | Passed | JDK 17, Gradle 8.11.1, SDK 36 |
| APK signature | Passed | One QA signer; v3 signature verified |
| APK package/version | Passed | `com.itsme.invoicey.fixed1.qa`, 3.1.31 / 31531 |
| Android API metadata | Passed | min 30, target 36 |
| JavaScript syntax | Passed | All 20 bundled business JavaScript files |
| Android manifest XML | Passed | Parsed successfully |
| Workflow QC | 41 passed, 0 failed | Disposable backend data; includes invoices, quotes, stock, expenses, receipts, backups and restore |
| Tenant/data-isolation QC | 57 passed, 0 failed | Disposable databases; account isolation, permissions, auth/recovery and persistence |
| Security QC | 58 passed, 0 failed | Sandboxed/disposable data only |
| Connected-device WhatsApp handoff | Not run | No ADB device was connected |

The workflow runner exercises the backend through the app's fetch contract; it is not an Android UI/device test. Tests use disposable isolated data and do not exercise production customer records.

## Artifact

QA APK filename: `itsme-invoicey-3.1.31-pdf-share-fix-debug.apk`  
SHA-256: `8D1A549C8E25345EE07B1FB9E2F125F3D0012D8EEF3F1AB8F5348BD83835E445`

The APK is signed using a temporary QA key. It installs as a separate `.qa` app, cannot update the Play Store app, and must not be submitted as a Play release. The APK and signing key are not committed to this repository.

## Remaining verification

Install the QA APK on a phone, create a quotation/invoice PDF, select WhatsApp Business, open a test chat, confirm the PDF thumbnail/name is visible in the composer, and press Send. If the file does not appear, capture Android and WhatsApp versions and a screen recording before changing URI-provider or package-target behavior.
