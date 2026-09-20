import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import img1 from '../../assets/img1.png';
import Navbar from '../../components/Navbar/Navbar';
import { useProducts } from '../../hooks/useApiData';
import { uniqueCategories } from '../../lib/products';
import { productImageUrl } from '../../service/productApi';
import { formatCurrency } from '../../lib/format';

// Public home page. Everything it promises exists in the platform: products, quotes, payments and advice.
const Landing = () => {
  const products = useProducts();
  const list = products.data ?? [];
  const categories = uniqueCategories(list);
  const featured = [...list].filter((p) => p.quantityAvailable > 0).slice(0, 4);

  return (
    <div className="landing-page">
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <h1>Connecting Agricultural Supply with B2B Buyers</h1>
          <p>
            AgroLink is a marketplace where farmers list their produce, and buyers request quotes, order in bulk and pay securely.
          </p>

          <div className="cta-buttons">
            <Link to="/register" className="cta-button selected">
              Get Started
            </Link>
            <Link to="/products" className="cta-button">
              Browse products
            </Link>
          </div>
        </div>

        <div className="hero-image">
          <img src={img1} alt="A farmer using a tablet in a field" />
        </div>
      </section>

      <section id="features" className="features">
        <h2>What you can do on AgroLink</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>🌾 List your produce</h3>
            <p>Farmers add products with photos, prices and stock.</p>
          </div>
          <div className="feature-card">
            <h3>📝 Request quotes</h3>
            <p>Buyers ask a seller for a price on a bulk quantity and accept the offer.</p>
          </div>
          <div className="feature-card">
            <h3>💳 Pay securely</h3>
            <p>Payments go through Razorpay and are verified by our server.</p>
          </div>
          <div className="feature-card">
            <h3>📚 Get advice</h3>
            <p>Advisors publish tips and answer farmers’ questions.</p>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="features landing-alt">
          <h2>Product categories</h2>
          <div className="landing-chips">
            {categories.map((category) => (
              <Link key={category} to={`/products?category=${encodeURIComponent(category)}`} className="landing-chip">
                {category}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="features">
          <h2>Available now</h2>
          <div className="mk-grid landing-products">
            {featured.map((product) => {
              const image = productImageUrl(product);
              return (
                <article key={product.id} className="mk-card">
                  {image ? <img src={image} alt={product.name} loading="lazy" /> : <div className="mk-noimg" aria-hidden="true">No photo</div>}
                  <div className="mk-body">
                    <h3>
                      <Link to={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <span className="mk-meta">{product.category}</span>
                    <span className="mk-price">{formatCurrency(product.pricePerUnit)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="features landing-alt">
        <h2>How it works</h2>
        <div className="landing-columns">
          <div className="landing-col">
            <h3>For farmers</h3>
            <ol>
              <li>Create a free account as a farmer.</li>
              <li>List your products with photos and stock.</li>
              <li>Answer quote requests from buyers with your price.</li>
              <li>Get paid when the buyer’s order is confirmed.</li>
            </ol>
          </div>
          <div className="landing-col">
            <h3>For buyers</h3>
            <ol>
              <li>Create a free account as a buyer.</li>
              <li>Find products in the marketplace.</li>
              <li>Order right away, or request a quote for a bulk quantity.</li>
              <li>Accept a quote, pay, and follow your order.</li>
            </ol>
          </div>
        </div>
        <div className="cta-buttons landing-cta">
          <Link to="/register" className="cta-button selected">
            Create an account
          </Link>
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 AgroLink. All rights reserved.</p>
        <p>
          <Link to="/about">About</Link> · <Link to="/contact">Contact</Link> · <Link to="/advisory">Advisory</Link>
        </p>
        <p>
          Developed by{' '}
          <a href="https://www.linkedin.com/in/souvik-mohanty-415552242/" target="_blank" rel="noopener noreferrer">
            @Souvik
          </a>{' '}
          &{' '}
          <a href="https://www.linkedin.com/in/sourav-kumar-nayak/" target="_blank" rel="noopener noreferrer">
            @Sourav
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Landing;
