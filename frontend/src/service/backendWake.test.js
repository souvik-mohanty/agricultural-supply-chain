import test from 'node:test';
import assert from 'node:assert/strict';
import { pingHealth, toHealthUrl, waitForBackend } from './backendWake.js';

// A fake clock: sleeping advances time instantly, so the tests take no real time.
const fakeClock = () => {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
  };
};

test('the health url sits next to the api, for absolute and relative bases', () => {
  assert.equal(toHealthUrl('https://agrolink-backend.onrender.com/api'), 'https://agrolink-backend.onrender.com/actuator/health');
  assert.equal(toHealthUrl('https://agrolink-backend.onrender.com/api/'), 'https://agrolink-backend.onrender.com/actuator/health');
  assert.equal(toHealthUrl('/api'), '/actuator/health');
});

test('resolves up immediately when the backend is already awake', async () => {
  let calls = 0;
  const result = await waitForBackend({ check: async () => ++calls > 0, ...fakeClock() });
  assert.equal(result, 'up');
  assert.equal(calls, 1);
});

test('keeps polling while the server wakes up, then resolves up', async () => {
  const answers = [false, false, false, true];
  let calls = 0;
  const result = await waitForBackend({ check: async () => answers[calls++], ...fakeClock() });
  assert.equal(result, 'up');
  assert.equal(calls, 4);
});

test('gives up with timeout when the server never answers', async () => {
  const clock = fakeClock();
  let calls = 0;
  const result = await waitForBackend({
    check: async () => {
      calls++;
      return false;
    },
    intervalMs: 2000,
    timeoutMs: 10000,
    ...clock,
  });
  assert.equal(result, 'timeout');
  assert.equal(calls, 6); // at 0s, 2s, 4s, 6s, 8s, 10s
});

test('stops polling once aborted', async () => {
  const controller = new AbortController();
  let calls = 0;
  const result = await waitForBackend({
    check: async () => {
      if (++calls === 2) controller.abort();
      return false;
    },
    signal: controller.signal,
    ...fakeClock(),
  });
  assert.equal(result, 'aborted');
  assert.equal(calls, 2);
});

test('an abort during a successful check is not reported as up', async () => {
  const controller = new AbortController();
  const result = await waitForBackend({
    check: async () => {
      controller.abort();
      return true;
    },
    signal: controller.signal,
    ...fakeClock(),
  });
  assert.equal(result, 'aborted');
});

const withFetch = async (fakeFetch, run) => {
  const original = globalThis.fetch;
  globalThis.fetch = fakeFetch;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
};

test('pingHealth is true only for status UP', async () => {
  const respond = (ok, body) => async () => ({ ok, json: async () => body });
  assert.equal(await withFetch(respond(true, { status: 'UP' }), () => pingHealth('/actuator/health')), true);
  assert.equal(await withFetch(respond(true, { status: 'DOWN' }), () => pingHealth('/actuator/health')), false);
  assert.equal(await withFetch(respond(false, { status: 'UP' }), () => pingHealth('/actuator/health')), false);
});

test('pingHealth never throws: network errors, bad json and timeouts are just "not up"', async () => {
  const failing = async () => {
    throw new TypeError('Failed to fetch');
  };
  assert.equal(await withFetch(failing, () => pingHealth('/x')), false);

  const notJson = async () => ({ ok: true, json: async () => { throw new SyntaxError('bad json'); } });
  assert.equal(await withFetch(notJson, () => pingHealth('/x')), false);

  const hangs = (url, { signal }) =>
    new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  assert.equal(await withFetch(hangs, () => pingHealth('/x', 20)), false);
});
