// Helpers for waiting until the backend is awake. Free hosting (Render) puts the server to sleep when idle and needs
// a minute or so to start it again. Pure module (no React, no Vite env) so it can be unit tested with `npm test`.

// The health check lives next to the API, not under it: https://host/api  ->  https://host/actuator/health
export const toHealthUrl = (apiBaseUrl) => `${apiBaseUrl.replace(/\/api\/?$/, '')}/actuator/health`;

// One health check. Resolves true only for {"status":"UP"}; never throws.
// Deliberately a plain GET without custom headers, so the browser sends no CORS preflight.
export const pingHealth = async (url, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      return false;
    }
    const body = await response.json();
    return body?.status === 'UP';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Polls `check` until it succeeds. Resolves 'up', 'timeout' (gave up after timeoutMs) or 'aborted' (signal fired).
export const waitForBackend = async ({
  check,
  signal,
  intervalMs = 2000,
  timeoutMs = 150000,
  sleep = defaultSleep,
  now = Date.now,
}) => {
  const startedAt = now();
  for (;;) {
    if (signal?.aborted) {
      return 'aborted';
    }
    if (await check()) {
      return signal?.aborted ? 'aborted' : 'up';
    }
    if (now() - startedAt >= timeoutMs) {
      return 'timeout';
    }
    await sleep(intervalMs);
  }
};
