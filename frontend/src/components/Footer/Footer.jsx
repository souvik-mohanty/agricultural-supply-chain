import React from 'react';
import './footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <div className='footer'>
      <div className='footer-icons'>
        <a href='https://www.facebook.com' target='_blank' rel='noopener noreferrer'>
          <FaFacebook className='icon' />
        </a>
        <a href='https://www.twitter.com' target='_blank' rel='noopener noreferrer'>
          <FaTwitter className='icon' />
        </a>
        <a href='https://www.instagram.com' target='_blank' rel='noopener noreferrer'>
          <FaInstagram className='icon' />
        </a>
        <a href='https://www.linkedin.com' target='_blank' rel='noopener noreferrer'>
          <FaLinkedin className='icon' />
        </a>
      </div>
    </div>
  );
};

export default Footer;
