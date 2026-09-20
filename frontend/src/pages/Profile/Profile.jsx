import React from 'react';
import { FaEdit } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../auth/useAuth';
import { roleLabel } from '../../auth/roles';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
    <Navbar />
    <div className="profile-page">
      {/* 💡 Background Text */}
      <div className="background-text">AGROLINK</div>

      <div className="profile-card">
        <h2>My Profile</h2>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Aadhar:</strong> {user.aadhar}</p>
        <p><strong>Contact:</strong> {user.contactNumber}</p>
        <p><strong>Address:</strong> {user.address}</p>
        <p><strong>Role:</strong> {roleLabel(user.role)}</p>
        <p><strong>2FA Enabled:</strong> {user.twoFactorEnabled ? 'Yes' : 'No'}</p>

        <button className="edit-btn" onClick={() => navigate('/update-profile')}>
            <FaEdit style={{ marginRight: '8px' }} />Edit Profile
        </button>
        <p style={{ marginTop: '1rem' }}><Link to="/complaints/new">Report a problem</Link></p>

      </div>
    </div>
    </>
  );
};

export default Profile;
