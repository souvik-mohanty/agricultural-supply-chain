import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { loginUser, getDemoRoles, demoLogin } from "../../../service/authApi";
import { useAuth } from "../../../auth/useAuth";
import { roleLabel } from "../../../auth/roles";
import Logo from '../../../components/Logo/Logo';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(null); // 'success' or 'error'
  const [demoRoles, setDemoRoles] = useState([]);
  const location = useLocation();
  const { login, isAuthenticated, sessionExpired } = useAuth();
  const destination = location.state?.from?.pathname || '/dashboard';

  // The backend offers demo roles only when it runs with DEMO_LOGIN_ENABLED=true.
  useEffect(() => {
    getDemoRoles()
      .then((res) => setDemoRoles(res.data))
      .catch(() => setDemoRoles([]));
  }, []);

  const handleDemoLogin = async (role) => {
    try {
      const response = await demoLogin(role);
      await login(response.data.token); // once logged in, the redirect below takes over
    } catch (err) {
      setMsg(err.response?.data?.message || "Demo login failed");
      setMsgType("error");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ username, password });

      if (response.status === 200 && response.data.token) {
        await login(response.data.token); // once logged in, the redirect below takes over
      } else {
        console.log("Login failed.");
        setMsg("Login failed: Token not received");
        setMsgType("error");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : "❌ Login failed");

      setMsg(errorMsg);
      setMsgType("error");
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
          <input type="text"
            placeholder="User Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input type="password"
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

        {demoRoles.length > 0 && (
          <div className="demo-login">
            <p className="demo-login-title">Quick login (demo, no password)</p>
            <div className="demo-login-buttons">
              {demoRoles.map((role) => (
                <button type="button" key={role} onClick={() => handleDemoLogin(role)}>
                  Login as {roleLabel(role)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
