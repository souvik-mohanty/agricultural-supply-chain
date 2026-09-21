import React from 'react';
import { roleLabel } from '../../../auth/roles';

// The dummy accounts the backend lists while it runs in demo mode (DEMO_LOGIN_ENABLED=true).
//   "Use"      copies the credentials into the sign-in form, so a visitor sees the normal login flow
//   "Sign in"  logs in straight away with the same credentials (the normal login, not a shortcut)
const DemoAccounts = ({ accounts, busyUsername, onUse, onSignIn }) => (
  <section id="demo-accounts" className="demo-accounts" aria-labelledby="demo-accounts-title">
    <h2 id="demo-accounts-title">Demo accounts</h2>
    <p className="demo-accounts-note">
      No need to register: pick a ready-made account and look around. These are shared dummy users with public
      passwords, so anyone can be signed in as them at the same time, and they are reset whenever the server restarts.
      Don't enter anything private.
    </p>

    <ul className="demo-accounts-list">
      {accounts.map((account) => (
        <li key={account.username} className="demo-account">
          <span className="demo-account-role">{roleLabel(account.role)}</span>
          <p className="demo-account-desc">{account.description}</p>
          <dl className="demo-account-creds">
            <div>
              <dt>Username</dt>
              <dd>
                <code>{account.username}</code>
              </dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>
                <code>{account.password}</code>
              </dd>
            </div>
          </dl>
          <div className="demo-account-actions">
            <button type="button" className="secondary" onClick={() => onUse(account)} aria-label={`Fill the form with ${account.username}`}>
              Use
            </button>
            <button
              type="button"
              onClick={() => onSignIn(account)}
              disabled={busyUsername !== null}
              aria-label={`Sign in as ${account.username}`}
            >
              {busyUsername === account.username ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

export default DemoAccounts;
