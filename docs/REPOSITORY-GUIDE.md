# Invoicey repository guide

This repository is the version-controlled source and documentation for itsme invoicey. Each meaningful change should be committed with a short message that describes the user-visible or technical change. Use a branch for a feature or fix, review the diff, then merge it into `main` after local verification.

## What belongs in GitHub

- Application source: web UI, hosting/API code, Android Java and runtime source, build scripts, SQL schema, and required static assets.
- Documentation: setup, authentication, deployment configuration names, release notes, and recovery procedures.
- Automated quality-control scripts that use disposable test data only.
- Dependency manifests and lockfiles so builds can be repeated.

## What must stay out of GitHub

- Real company/customer/supplier databases and SQLite WAL/SHM files.
- SMTP passwords, API tokens, account passwords, OTPs, environment files, and private keys.
- Android signing keystores and their passwords.
- `node_modules`, Gradle caches, generated APK/AAB/installers, temporary test data, logs, and local backups.

The root `.gitignore` excludes these paths and file types. Review `git status --short` before every commit; never force-add an ignored database, secret, signing file, or build output.

## Local setup and build notes

Read the root `README.md`, `hosting/README.md`, and `android/README.md` before building. Use the checked-in package manager lockfile and the documented Node/Java/Android toolchain. Configure SMTP and hosted storage with environment variables on the hosting service; copy names from `hosting/.env.example`, and keep actual values out of the repository.

## Version history and recovery

1. Commit each coherent feature/fix separately and include the related documentation update.
2. Tag a reviewed release with the app version, and keep its release notes with the source change.
3. To restore source, check out a known commit or tag. Do not restore live business databases from source history.
4. Restore business data only from the app's company backup/restore workflow or a separately protected backup. Test data restore using a disposable copy.
5. If a credential or signing key is ever committed, treat it as exposed: revoke/rotate it, remove it from active history where possible, and do not rely on deleting the latest file alone.

## Current snapshot limitation

The reviewed local snapshot contains the bundled Android backend but does not contain the top-level `server.mjs` referenced by the Android runtime entry. Some README build references also point to files not present in the snapshot. This repository should be treated as a source snapshot, not a verified reproducible release, until those build inputs are restored and checked.

