# itsme invoicey 3.1.31 — QA release notes

## Fixed
- Improved quotation and invoice PDF sharing to Android apps. PDF validation, content URI, stream/ClipData, and chooser read permissions are handled by the native Android layer.
- Improved malformed backup handling so invalid SQLite uploads return a clear validation error and do not leave a restore transaction or foreign-key state half-open.

## QC
The full checks and limits are recorded in [QC_REPORT-v3.1.31.md](QC_REPORT-v3.1.31.md): 41 workflow, 57 tenant-isolation, and 58 security checks passed; Android build, APK signature, package/version, bundled JavaScript syntax, and manifest checks passed. WhatsApp composer behavior still needs a connected physical phone.

## Test package
The debug QA APK is signed with a temporary QA key, uses package `com.itsme.invoicey.fixed1.qa`, and is not suitable for Play Console submission. The APK and keys are excluded from Git; the QC report records the checksum.
