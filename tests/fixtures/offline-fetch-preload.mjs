// Preload script for tests/offline-shutdown.test.ts (and any other test that needs a fully
// offline `fetch`). Loaded via `node --import` BEFORE the server entrypoint, so every network
// call the server's warm-up/preload machinery makes fails exactly like it would in a
// network-denied sandbox (ECONNREFUSED-style rejection), without needing an actual sandbox —
// portable across CI/dev machines that can't shell out to macOS's sandbox-exec.
globalThis.fetch = () => Promise.reject(new TypeError('fetch failed: network is unreachable (offline test fixture)'));
