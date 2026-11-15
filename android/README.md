# itsme invoicey Android

This folder contains the Android WebView application source and bundled business assets.

## Current QA source revision

- App version: **3.1.31** (version code **31531**)
- Production application ID: `com.itsme.invoicey.fixed1`
- QA/debug application ID: `com.itsme.invoicey.fixed1.qa`
- Minimum Android: API 30
- Target and compile Android: API 36

This source revision fixes PDF handoff to Android share targets. It validates the generated PDF, exposes it through the app's private content provider, attaches the URI as both stream and ClipData, and grants receiving apps read permission through the chooser. The manifest declares PDF share-target visibility.

The bundled restore handler also reports invalid or incompatible uploaded backups as user-facing validation errors, rolls back a started transaction, restores foreign-key checks, and detaches the archive safely.

## Build

Use JDK 17, Gradle 8.11.1, Android SDK 36 and Android build tools.

```powershell
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\android-sdk'
$env:INVOICEY_RELEASE_KEYSTORE = 'C:\private\qa-or-release-key.jks'
$env:INVOICEY_RELEASE_STORE_PASSWORD = 'set-in-private-environment'
$env:INVOICEY_RELEASE_KEY_ALIAS = 'set-in-private-environment'
$env:INVOICEY_RELEASE_KEY_PASSWORD = 'set-in-private-environment'
gradle :app:assembleDebug
```

Gradle requires signing environment values for debug as well as release. Use a disposable QA key for a QA APK. Use the protected Play upload key only for an authorized production release. Never commit keystores or passwords.

## QC and limitation

See [QC_REPORT-v3.1.31.md](QC_REPORT-v3.1.31.md) for the results and scope. Automated checks confirm the native intent/URI implementation and backend workflows. They do not prove that WhatsApp displayed a PDF in a real composer or sent it. That final check requires an Android phone with WhatsApp or WhatsApp Business. The QA build is not Play Store signed; the generated APK is intentionally excluded from Git.
