import React from 'react';
import './Home.css';
import Navbar from '../../components/Navbar/Navbar';
import gif from '../../assets/coder2.gif'; // Ensure the path is correct

const Home = () => {
  return (
    <div className='home'>
      <Navbar />
      <div className='gif-container'>
        <img src={gif} alt="shin-chan" />
        <h3>Website Under Development</h3>
      </div>
    </div>
  );
};

export default Home;
