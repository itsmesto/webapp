// Compatibility entry point for the source bundle's workflow QC command.
// The authoritative workflow suite runs against the included hosted backend
// and covers the Android fetch contract plus the relaunch persistence checks.
await import('../android/qa/check-workflows-script.mjs');

