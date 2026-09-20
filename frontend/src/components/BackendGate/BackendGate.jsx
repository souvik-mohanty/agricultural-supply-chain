import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../service/apiClient';
import { pingHealth, toHealthUrl, waitForBackend } from '../../service/backendWake';
import './BackendGate.css';

const AWAKE_KEY = 'agrolink.backendAwakeAt';
const AWAKE_TTL_MS = 10 * 60 * 1000; // free hosting sleeps after ~15 idle minutes; re-check after 10
const LOADER_DELAY_MS = 1000; // an already-awake server answers faster than this, so the page never flashes

const recentlyAwake = () => {
  try {
    const at = Number(sessionStorage.getItem(AWAKE_KEY));
    return at > 0 && Date.now() - at < AWAKE_TTL_MS;
  } catch {
    return false;
  }
};

const markAwake = () => {
  try {
    sessionStorage.setItem(AWAKE_KEY, String(Date.now()));
  } catch {
    // storage can be blocked (private mode); the gate just checks again next time
  }
};

const progressMessage = (seconds) => {
  if (seconds < 20) return 'Starting the server…';
  if (seconds < 60) return 'Still starting up, almost there…';
  return 'Taking longer than usual, hang on…';
};

// Shows a loading page while the (free-tier) backend wakes up, then renders the app.
const BackendGate = ({ children }) => {
  const [status, setStatus] = useState(() => (recentlyAwake() ? 'ready' : 'checking')); // checking | ready | failed
  const [showLoader, setShowLoader] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (status !== 'checking') {
      return undefined;
    }
    const controller = new AbortController();
    const startedAt = Date.now();
    const loaderTimer = setTimeout(() => setShowLoader(true), LOADER_DELAY_MS);
    const clock = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);

    const healthUrl = toHealthUrl(API_BASE_URL);
    waitForBackend({ check: () => pingHealth(healthUrl), signal: controller.signal }).then((result) => {
      if (result === 'up') {
        markAwake();
        setStatus('ready');
      } else if (result === 'timeout') {
        setStatus('failed');
      }
    });

    return () => {
      controller.abort();
      clearTimeout(loaderTimer);
      clearInterval(clock);
    };
  }, [status]);

  if (status === 'ready') {
    return children;
  }
  if (status === 'checking' && !showLoader) {
    return null;
  }

  return (
    <div className="backend-gate" role="status" aria-live="polite">
      <h1 className="backend-gate-logo">AgroLink</h1>

      {status === 'checking' ? (
        <>
          <div className="backend-gate-spinner" aria-hidden="true" />
          <h2>Waking up the server</h2>
          <p>{progressMessage(seconds)}</p>
          <div className="backend-gate-bar" aria-hidden="true">
            <span />
          </div>
          <p className="backend-gate-hint">
            AgroLink runs on free hosting, which puts the server to sleep when nobody is using it. Starting it again
            usually takes 30 to 60 seconds. This page continues by itself.
          </p>
          <p className="backend-gate-timer">{seconds}s</p>
        </>
      ) : (
        <>
          <h2>The server is not responding</h2>
          <p className="backend-gate-hint">
            It did not start within a couple of minutes. It may be down, or you may be offline.
          </p>
          <div className="backend-gate-actions">
            <button
              type="button"
              onClick={() => {
                setSeconds(0);
                setShowLoader(true);
                setStatus('checking');
              }}
            >
              Try again
            </button>
            <button type="button" className="secondary" onClick={() => setStatus('ready')}>
              Continue anyway
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BackendGate;
