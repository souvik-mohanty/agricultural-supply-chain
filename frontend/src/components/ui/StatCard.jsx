import React from 'react';
import { Link } from 'react-router-dom';

// A dashboard number. `to` makes the whole card a link to where the number comes from.
const StatCard = ({ label, value, hint, to }) => {
  const content = (
    <>
      <span className="ui-stat-label">{label}</span>
      <span className="ui-stat-value">{value}</span>
      {hint && <span className="ui-stat-hint">{hint}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="ui-stat ui-stat-link">
      {content}
    </Link>
  ) : (
    <div className="ui-stat">{content}</div>
  );
};

export default StatCard;
