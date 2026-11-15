// The native bridge is available only to the bundled, local application page.
export function nativeCall(operation, args = {}) {
  if (!globalThis.InvoiceyNative?.call) throw new Error('The Android data service is unavailable. Restart the app.');
  const response = JSON.parse(globalThis.InvoiceyNative.call(operation, JSON.stringify(args)));
  if (!response.ok) throw new Error(response.error || 'The Android data operation failed.');
  return response.value;
}
export const environment = nativeCall('env');


