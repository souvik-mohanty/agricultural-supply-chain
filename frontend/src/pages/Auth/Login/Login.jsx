import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../service/authApi";
import { useDemoAccounts } from "../../../hooks/useApiData";
import { useAuth } from "../../../auth/useAuth";
import { ROLE_CHOICES, roleLabel } from "../../../auth/roles";
import Logo from '../../../components/Logo/Logo';
import DemoAccounts from './DemoAccounts';
import './Login.css';

const errorText = (err) =>
  err.response?.data?.message ||
  (typeof err.response?.data === 'string' ? err.response.data : "❌ Login failed");

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // the role the visitor signs in as; the server checks it against the account
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(null); // 'success' or 'error'
  const [busyUsername, setBusyUsername] = useState(null);
  const location = useLocation();
  const { login, isAuthenticated, sessionExpired } = useAuth();
  const destination = location.state?.from?.pathname || '/dashboard';

  // The backend lists demo accounts only while it runs with DEMO_LOGIN_ENABLED=true; otherwise this stays empty.
  const demoAccounts = useDemoAccounts().data ?? [];

  // "Try a demo account" links here with #demo-accounts: scroll to the panel once it has loaded.
  useEffect(() => {
    if (location.hash === '#demo-accounts' && demoAccounts.length > 0) {
      document.getElementById('demo-accounts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, demoAccounts.length]);

  const signIn = async (credentials) => {
    const response = await loginUser(credentials);
    if (response.status === 200 && response.data.token) {
      await login(response.data.token); // once logged in, the redirect below takes over
    } else {
      throw new Error("Login failed: Token not received");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn({ username, password, role });
    } catch (err) {
      setMsg(errorText(err));
      setMsgType("error");
    }
  };

  // "Use": show the credentials in the form, as if the visitor had typed them.
  const useAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setRole(account.role);
    setMsg(`Filled in ${account.username}. Press Sign In.`);
    setMsgType("success");
    document.getElementById('login-username')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // "Sign in": the same login request, without the typing.
  const signInAs = async (account) => {
    setBusyUsername(account.username);
    setMsg('');
    try {
      await signIn({ username: account.username, password: account.password, role: account.role });
    } catch (err) {
      setMsg(errorText(err));
      setMsgType("error");
      document.getElementById('login-username')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setBusyUsername(null);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  return (
    <div className='login'>
      <Link to="/" className="auth-logo" aria-label="AgroLink home"><Logo layout="stacked" tone="dark" /></Link>
      <div className="login-form">
        <h1>Sign In</h1>
        <form onSubmit={handleLogin}>
          <select
            id="login-role"
            aria-label="Sign in as"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="" disabled>Sign in as…</option>
            {ROLE_CHOICES.map((choice) => (
              <option key={choice} value={choice}>{roleLabel(choice)}</option>
            ))}
          </select>
          <input type="text"
            id="login-username"
            aria-label="User name"
            autoComplete="username"
            placeholder="User Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input type="password"
            id="login-password"
            aria-label="Password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign In</button>

          <div className="login-options">
            <Link to="/forgot-password" className="forgot">Forgot Password?</Link>
            <p>Don't have an account? <Link to="/register" className="forgot">Register</Link></p>
          </div>

          {sessionExpired && !msg && (
            <p role="status" style={{ color: "orange" }}>
              Your session expired. Please sign in again.
            </p>
          )}

          {msg && (
            <p role={msgType === "error" ? "alert" : "status"} style={{ color: msgType === "success" ? "green" : "red" }}>
              {msg}
            </p>
          )}
        </form>
      </div>

      {demoAccounts.length > 0 && (
        <DemoAccounts accounts={demoAccounts} busyUsername={busyUsername} onUse={useAccount} onSignIn={signInAs} />
      )}
    </div>
  );
};

export default Login;
