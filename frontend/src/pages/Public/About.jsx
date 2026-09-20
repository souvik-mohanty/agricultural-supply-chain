import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';

const About = () => (
  <PageLayout title="About AgroLink" subtitle="Connecting agricultural supply with B2B buyers" narrow>
    <section className="ui-card">
      <p>
        AgroLink is a marketplace for agricultural produce. Farmers list what they grow, and buyers find it, ask for a
        price on a bulk quantity, and pay through the platform.
      </p>
    </section>

    <section className="pg-section" aria-labelledby="about-farmers">
      <h2 id="about-farmers">For farmers</h2>
      <ul>
        <li>List products with photos, prices and available stock.</li>
        <li>Receive quote requests from buyers and answer them with your price.</li>
        <li>See the orders that contain your products.</li>
        <li>Ask advisors questions and read their articles.</li>
      </ul>
    </section>

    <section className="pg-section" aria-labelledby="about-buyers">
      <h2 id="about-buyers">For buyers</h2>
      <ul>
        <li>Search the marketplace by name, category and price.</li>
        <li>Order straight from a product page or from your cart.</li>
        <li>Request a quote for a bulk quantity, then accept or reject the offer.</li>
        <li>Pay securely with Razorpay. Payments are confirmed by our server, not by your browser.</li>
      </ul>
    </section>

    <section className="pg-section" aria-labelledby="about-more">
      <h2 id="about-more">Also on the platform</h2>
      <ul>
        <li>Warehouse staff record stored crops and mark them ready for delivery.</li>
        <li>Advisors publish articles and answer farmers’ questions.</li>
        <li>Administrators manage accounts and review complaints.</li>
      </ul>
      <p>
        <Link className="ui-btn primary" to="/register">Create an account</Link>{' '}
        <Link className="ui-btn ghost" to="/products">Browse products</Link>
      </p>
    </section>
  </PageLayout>
);

export default About;
