import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './update.css';
import { getUserDetails, updateUser } from '../../service/userApi';

const Update = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null); // Will hold current user ID

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
  const [msgType, setMsgType] = useState('');

  // 🔄 Fetch current user on load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserDetails(); // <-- assumes /api/users/me
        const user = response.data;

        setUserId(user.id); // Save ID for update
        setFormData({
          username: user.username || '',
          password: '',
          email: user.email || '',
          aadhar: user.aadhar || '',
          contactNumber: user.contactNumber || '',
          address: user.address || '',
          roles: [user.role || ''],
          twoFactorEnabled: user.twoFactorEnabled || false,
        });
      } catch (error) {
        setMsg('Failed to fetch user data');
        setMsgType('error');
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'roles') {
      setFormData((prev) => ({ ...prev, roles: [value] }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMsg('User ID not loaded');
      setMsgType('error');
      return;
    }

    try {
      await updateUser(userId, formData);
      setMsg('User updated successfully!');
      setMsgType('success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setMsg('Update failed');
      setMsgType('error');
    }
  };

  return (
    <div className="register">
      <div className="logo"><h1>AgroLink</h1></div>
      <div className="register-form">
        <h1>Update Profile</h1>

        <form onSubmit={handleSubmit} className="form-grid">

          <div className="form-row">
            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
            <input type="password" name="password" placeholder="New Password" value={formData.password} onChange={handleChange} />
          </div>

          <div className="form-row">
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input type="text" name="aadhar" placeholder="Aadhar" value={formData.aadhar} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <input type="text" name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} required />
            <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
          </div>

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

          <div className="form-row toggle-row">
                <label htmlFor="twoFactorEnabled">Two-Factor Authentication</label>
                <label className="switch">
                    <input
                    type="checkbox"
                    name="twoFactorEnabled"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) =>
                        setFormData((prev) => ({
                        ...prev,
                        twoFactorEnabled: e.target.checked
                        }))
                    }
                    />
                    <span className="slider round"></span>
                </label>
            </div>


          <button type="submit">Update</button>
          {msg && <p style={{ color: msgType === 'success' ? 'green' : 'red' }}>{msg}</p>}
        </form>
      </div>
    </div>
  );
};

export default Update;
