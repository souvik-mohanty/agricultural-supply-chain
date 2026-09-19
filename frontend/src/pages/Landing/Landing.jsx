import React, { useState } from 'react';
import './Landing.css';
import img1 from '../../assets/img1.png';
import Navbar from '../../components/Navbar/Navbar';

const Landing = () => {
  const [selectedBtn, setSelectedBtn] = useState('register');
  const [loadingStart, setLoadingStart] = useState(false);   // For "Get Started"
  const [loadingProducts, setLoadingProducts] = useState(false); // For "Products"


  return (
    <div className="landing-page">
      <Navbar showNavLinks={true} />

      <section className="hero">
        <div className="hero-content">
          <h1>Empowering Farmers with Smart Technology</h1>
          <p>AgroLink connects farmers, data, and innovation to boost yield and sustainability.</p>

          <div className="cta-buttons">
            <a
              href="/register"
              className={`cta-button ${selectedBtn === 'register' ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (loadingStart || loadingProducts) return;
                setSelectedBtn('register');
                setLoadingStart(true);
                setTimeout(() => {
                  window.location.href = "/register";
                }, 700);
              }}
              style={{ pointerEvents: loadingStart ? 'none' : 'auto', opacity: loadingStart ? 0.6 : 1 }}
            >
              {loadingStart ? 'Loading...' : 'Get Started'}
            </a>

            {/* Products Button */}
            <a
              href="/products"
              className={`cta-button ${selectedBtn === 'products' ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (loadingStart || loadingProducts) return;
                setSelectedBtn('products');
                setLoadingProducts(true);
                setTimeout(() => {
                  window.location.href = "/products";
                }, 700);
              }}
              style={{ pointerEvents: loadingProducts ? 'none' : 'auto', opacity: loadingProducts ? 0.6 : 1 }}
            >
              {loadingProducts ? 'Loading...' : 'Products'}
            </a>
          </div>

        </div>

        <div className="hero-image">
          <img src={img1} alt="Smart Agriculture" />
        </div>
      </section>

      <section id="features" className="features">
        <h2>Why Choose AgroLink?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>🌱 Soil Analysis</h3>
            <p>AI-powered soil health tracking for better crop planning.</p>
          </div>
          <div className="feature-card">
            <h3>🌤️ Weather Forecasting</h3>
            <p>Real-time, location-based weather predictions.</p>
          </div>
          <div className="feature-card">
            <h3>📊 Smart Recommendations</h3>
            <p>Data-driven crop and fertilizer suggestions.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 AgroLink. All rights reserved.</p>
        <p>
          Developed by 
          <a href="https://www.linkedin.com/in/souvik-mohanty-415552242/" target="_blank" rel="noopener noreferrer">@Souvik</a> & 
          <a href="https://www.linkedin.com/in/sourav-kumar-nayak/" target="_blank" rel="noopener noreferrer">@Sourav</a>
        </p>
      </footer>
    </div>
  );
};

export default Landing;
