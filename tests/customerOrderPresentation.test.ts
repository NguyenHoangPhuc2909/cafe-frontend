import test from 'node:test';
import assert from 'node:assert/strict';
import { customerOrderPresentation } from '../src/utils/customerOrderPresentation.ts';

test('an unpaid pending order is never shown as paid or being prepared', () => {
  const view = customerOrderPresentation({ status: 'PENDING', paymentStatus: 'UNPAID' });
  assert.equal(view.kind, 'pending');
  assert.equal(view.step, 2);
});

test('payment confirmation, preparation and completion have distinct presentations', () => {
  assert.equal(customerOrderPresentation({ status: 'PENDING', paymentStatus: 'PAID' }).kind, 'paid');
  assert.equal(customerOrderPresentation({ status: 'PREPARING', paymentStatus: 'PAID' }).kind, 'preparing');
  const completed = customerOrderPresentation({ status: 'COMPLETED', paymentStatus: 'PAID' });
  assert.equal(completed.kind, 'completed');
  assert.equal(completed.stepStatus, 'finish');
});

test('server expiration and refunds do not display a successful checkout', () => {
  const expired = customerOrderPresentation({ status: 'EXPIRED', paymentStatus: 'UNPAID' });
  assert.equal(expired.kind, 'expired');
  assert.equal(expired.stepStatus, 'error');
  const refunded = customerOrderPresentation({ status: 'COMPLETED', paymentStatus: 'REFUNDED' });
  assert.equal(refunded.kind, 'refunded');
  assert.equal(refunded.stepStatus, 'error');
});
