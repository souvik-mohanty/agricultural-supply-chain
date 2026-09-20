import React from 'react';
import { humanize } from '../../lib/format';

// Tone per backend status value (order, RFQ, account, complaint states).
const TONES = {
  OPEN: 'info',
  QUOTED: 'warn',
  ACCEPTED: 'ok',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
  PENDING: 'warn',
  PAID: 'ok',
  ACTIVE: 'ok',
  SUSPENDED: 'danger',
  RESOLVED: 'ok',
  READY: 'ok',
  STORED: 'info',
};

const StatusBadge = ({ status }) => (
  <span className={`ui-badge ${TONES[status] ?? 'neutral'}`}>{humanize(status)}</span>
);

export default StatusBadge;
