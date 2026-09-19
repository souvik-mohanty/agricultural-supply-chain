import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar'; // ✅ Navbar reused
import './ComingSoon.css';
import bgif from '../../assets/CODER3.gif';

const ComingSoon = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const calculateTimeLeft = () => {
    const launchDate = new Date('2025-09-31T00:00:00');
    const now = new Date();
    const diff = launchDate - now;

    if (diff > 0) {
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  useEffect(() => {
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="coming-soon"
      style={{
        backgroundImage: `url(${bgif})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    ><div className="overlay">
        <Navbar variant="profile" />
        <main className="content">
          <h1>COMING SOON</h1>
          <div className="countdown">
            <div><span>{timeLeft.days}</span><p>Days</p></div>
            <div><span>{timeLeft.hours}</span><p>Hours</p></div>
            <div><span>{timeLeft.minutes}</span><p>Minutes</p></div>
            <div><span>{timeLeft.seconds}</span><p>Seconds</p></div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComingSoon;
