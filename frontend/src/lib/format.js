const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export const formatCurrency = (value) => currency.format(Number(value) || 0);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// "2026-10-01" is a calendar date, not a moment: parse it as local midnight so it never shifts by a day.
const toDate = (value) => (DATE_ONLY.test(value) ? new Date(`${value}T00:00:00`) : new Date(value));

export const formatDate = (value) => {
  if (!value) return '—';
  const date = toDate(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = toDate(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// "WAREHOUSE_OPERATOR" -> "Warehouse operator"
export const humanize = (value) =>
  value ? value.charAt(0) + value.slice(1).toLowerCase().replaceAll('_', ' ') : '';

// Today as YYYY-MM-DD in the user's own time zone (for <input type="date" min=...>).
export const todayIso = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

// Order ids are 36 characters (timestamp + random); tables show the start of them.
export const shortOrderId = (id) => (id.length > 22 ? `${id.slice(0, 22)}…` : id);
