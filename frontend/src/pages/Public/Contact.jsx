import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import { useAuth } from '../../auth/useAuth';

// There is no contact-form endpoint, so this page points to what does exist instead of pretending to send a message.
const Contact = () => {
  const { isAuthenticated } = useAuth();
  return (
    <PageLayout title="Contact" subtitle="How to reach us" narrow>
      <section className="ui-card">
        <h2>Something wrong on the platform?</h2>
        {isAuthenticated ? (
          <p>
            <Link className="ui-btn primary" to="/complaints/new">Report a problem</Link>
          </p>
        ) : (
          <p>
            <Link to="/login">Log in</Link> to report a problem with a user, product or order. The administrators review every report.
          </p>
        )}
      </section>

      <section className="ui-card pg-section">
        <h2>The team</h2>
        <p>AgroLink is built by:</p>
        <ul>
          <li>
            <a href="https://www.linkedin.com/in/souvik-mohanty-415552242/" target="_blank" rel="noopener noreferrer">Souvik Mohanty</a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/sourav-kumar-nayak/" target="_blank" rel="noopener noreferrer">Sourav Kumar Nayak</a>
          </li>
        </ul>
      </section>
    </PageLayout>
  );
};

export default Contact;
