import React, { useEffect, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getUserDetails } from '../../service/userApi';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserDetails();
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user", err);
      }
    };
    fetchUser();
  }, []);

  if (!user) return <div className="profile-page">Loading...</div>;

  return (
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
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>2FA Enabled:</strong> {user.twoFactorEnabled ? 'Yes' : 'No'}</p>

        <button className="edit-btn" onClick={() => navigate('/update-profile')}>
            <FaEdit style={{ marginRight: '8px' }} />Edit Profile
        </button>

      </div>
    </div>
  );
};

export default Profile;
