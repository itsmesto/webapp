/*
 * Shared API configuration.
 * Leave empty for the normal same-origin desktop server or offline Android
 * backend. Set this to the HTTPS origin of the hosted API before rebuilding
 * Android, for example: https://invoicey-api.example.com
 */
// Hosted shared-service deployment for primeenergy.lk.
// Keep the runtime override so desktop/test environments can still replace it.
globalThis.INVOICEY_API_BASE_URL = globalThis.INVOICEY_API_BASE_URL || 'https://api.primeenergy.lk';

