// Requests are serialized by the HTTP adapter. Nested tenant operations preserve
// their parent context until the returned promise has settled.
export class AsyncLocalStorage {
  getStore() { return this.store; }
  run(store, callback) {
    const previous = this.store; this.store = store;
    let result;
    try { result = callback(); } catch (error) { this.store = previous; throw error; }
    if (result?.then) return Promise.resolve(result).finally(() => { this.store = previous; });
    this.store = previous; return result;
  }
}


