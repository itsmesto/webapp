# itsme invoicey 3.0.2

- Added code-only Factory reset from the sign-in screen.
- The reset code is validated by the backend, rejects incorrect codes, clears sessions and all tenant/legacy records, removes generated Excel backups, and returns the app to first-time setup.
- Added explicit confirmation before the destructive reset action.
- Bundled the updated desktop and Android UI/backend assets.
- Native Android runtime contract: 27 checks passed, including reset behavior.
- Physical Samsung Galaxy A16 testing was not possible on this host; installability was verified with APK alignment, v1/v2/v3 signature verification, package metadata, and the Android runtime contract harness.

