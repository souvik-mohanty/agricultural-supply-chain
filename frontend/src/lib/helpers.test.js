import test from 'node:test';
import assert from 'node:assert/strict';
import { getErrorMessage, isUnauthorized, shouldRetry } from './errors.js';
import { formatCurrency, formatDate, humanize } from './format.js';
import { navItemsFor } from '../navigation/navItems.js';
import { ROLES, ROLE_CHOICES, isBuyerRole, roleLabel } from '../auth/roles.js';

const httpError = (status, message) => ({ response: { status, data: message ? { message } : {} } });

test('errors: 4xx messages from the backend are shown, generic ones are friendly', () => {
  assert.equal(getErrorMessage(httpError(400, 'name: must not be blank')), 'name: must not be blank');
  assert.equal(getErrorMessage(httpError(409, 'Insufficient stock for product p1')), 'Insufficient stock for product p1');
  assert.equal(getErrorMessage(httpError(404)), 'We could not find what you asked for.');
  assert.match(getErrorMessage(httpError(401)), /session has expired/);
  assert.match(getErrorMessage(httpError(403)), /permission/);
  assert.equal(getErrorMessage(httpError(403, 'This account has been suspended')), 'This account has been suspended');
  assert.match(getErrorMessage(httpError(413)), /too large/);
  assert.match(getErrorMessage(httpError(503, 'Online payments are not configured')), /not configured/);
});

test('errors: server failures never leak details', () => {
  const message = getErrorMessage(httpError(500, 'java.lang.NullPointerException at com.agrolink...'));
  assert.doesNotMatch(message, /NullPointer|agrolink/);
  assert.match(message, /problem/);
  assert.match(getErrorMessage(httpError(502)), /problem/);
});

test('errors: network failures and timeouts', () => {
  assert.match(getErrorMessage({ message: 'Network Error', code: 'ERR_NETWORK' }), /Cannot reach the server/);
  assert.match(getErrorMessage({ code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' }), /too long/);
  assert.equal(getErrorMessage(undefined, 'fallback'), 'fallback');
});

test('errors: only 401 counts as an expired session, and 4xx are not retried', () => {
  assert.equal(isUnauthorized(httpError(401)), true);
  assert.equal(isUnauthorized(httpError(403)), false);
  assert.equal(shouldRetry(0, httpError(404)), false);
  assert.equal(shouldRetry(0, httpError(500)), true);
  assert.equal(shouldRetry(2, httpError(500)), false);
  assert.equal(shouldRetry(0, { message: 'Network Error' }), true);
});

test('format: rupees, dates and labels', () => {
  assert.match(formatCurrency(8750), /8,750\.00/);
  assert.match(formatCurrency(1234567.5), /12,34,567\.50/); // Indian digit grouping
  assert.equal(formatCurrency(undefined), formatCurrency(0));
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate('not a date'), '—');
  assert.match(formatDate('2026-10-01'), /01 Oct 2026|1 Oct 2026/); // a calendar date never shifts to the day before
  assert.equal(humanize('WAREHOUSE_OPERATOR'), 'Warehouse operator');
  assert.equal(humanize('PAID'), 'Paid');
  assert.equal(humanize(undefined), '');
});

test('navigation: every role gets only links for screens that exist for it', () => {
  const labels = (role) => navItemsFor(role).map((item) => item.label);

  assert.deepEqual(labels(undefined), ['Marketplace', 'Categories', 'Advisory', 'About']);
  assert.ok(labels(ROLES.BUYER).includes('Payments'));
  assert.ok(labels(ROLES.CUSTOMER).includes('Quote requests'));
  assert.ok(labels(ROLES.FARMER).includes('My products'));
  assert.ok(!labels(ROLES.FARMER).includes('Users'));
  assert.ok(labels(ROLES.ADMIN).includes('Users'));
  assert.ok(labels(ROLES.ADMIN).includes('Reports'));
  assert.ok(!labels(ROLES.BUYER).includes('Warehouse'));
  assert.ok(labels(ROLES.WAREHOUSE_OPERATOR).includes('Warehouse'));
  assert.ok(labels(ROLES.ADVISOR).includes('Farmer queries'));
  assert.ok(labels('SOMETHING_NEW').includes('Dashboard')); // unknown roles still get a sane menu
});

test('navigation: every link points at a route path (no duplicates within a role)', () => {
  for (const role of [undefined, ...Object.values(ROLES)]) {
    const paths = navItemsFor(role).map((item) => item.to);
    assert.ok(paths.every((path) => path.startsWith('/')));
    assert.equal(new Set(paths).size, paths.length, `duplicate link for ${role}`);
  }
});

test('roles: the sign-in picker offers every backend role exactly once', () => {
  assert.deepEqual([...ROLE_CHOICES].sort(), Object.values(ROLES).sort());
  assert.equal(new Set(ROLE_CHOICES).size, ROLE_CHOICES.length);
});

test('roles: buyer detection and labels', () => {
  assert.equal(isBuyerRole(ROLES.BUYER), true);
  assert.equal(isBuyerRole(ROLES.CUSTOMER), true);
  assert.equal(isBuyerRole(ROLES.FARMER), false);
  assert.equal(roleLabel(ROLES.WAREHOUSE_OPERATOR), 'Warehouse operator');
  assert.equal(roleLabel('NEW_ROLE'), 'NEW_ROLE');
});
