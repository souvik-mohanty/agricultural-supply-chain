import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../../service/authApi";
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(null); // 'success' or 'error'
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ username, password });

      if (response.status === 200 && response.data.token) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        setMsg("Login successful!");
        setMsgType("success");
        setTimeout(() => navigate("/home"), 1500);
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

  return (
    <div className='login'>
      <div className="logo"><h1>AgroLink</h1></div>
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

          {msg && (
            <p style={{ color: msgType === "success" ? "green" : "red" }}>
              {msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
