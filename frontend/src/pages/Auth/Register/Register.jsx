import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';
import { registerUser } from '../../../service/authApi'; 

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    aadhar: '',
    contactNumber: '',
    address: '',
    roles: [''],
    twoFactorEnabled: false
  });

  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'roles') {
      setFormData((prev) => ({
        ...prev,
        roles: [value]
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(formData); 
      setMsg('Registration successful!');
      setMsgType("success");
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data || 'Registration failed');
    }
  };

  return (
    <div className="register">
      <div className="logo"><h1>AgroLink</h1></div>
      <div className="register-form">
        <h1>Sign Up</h1>

        <form onSubmit={handleSubmit} className="form-grid">

          {/* Row 1: Username + Password */}
          <div className="form-row">
            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required/>
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required/>
          </div>

          {/* Row 2: Email + Aadhar */}
          <div className="form-row">
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required/>
            <input type="text" name="aadhar" placeholder="Aadhar" value={formData.aadhar} onChange={handleChange} required/>
          </div>

          {/* Row 3: Contact + Address */}
          <div className="form-row">
            <input type="text" name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} required/>
            <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required/>
          </div>

          {/* Role Dropdown */}
          <select name="roles" value={formData.roles[0]} onChange={handleChange} required>
            <option value="" disabled hidden>-- Select Role --</option>
            <option value="FARMER">Farmer</option>
            <option value="ADMIN">Admin</option>
            <option value="BUYER">Buyer</option>
            <option value="CARRIER">Carrier</option>
            <option value="MANAGER">Manager</option>
            <option value="WAREHOUSE_OPERATOR">Warehouse Operator</option>
            <option value="ADVISOR">Advisor</option>
          </select>

          <button type="submit">Register</button>
           {msg && (
            <p style={{ color: msgType === "success" ? "green" : "red" }}>
              {msg}
            </p>
          )}
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Register;
