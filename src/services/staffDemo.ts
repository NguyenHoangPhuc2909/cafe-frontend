import { createCheckout, transitionCheckout } from '../utils/checkout';
import type { PreparationStatus } from '../utils/checkout';
import { previewSnapshot, publishPreview } from './previewOrders';

export function seedStaffDemoOrders() {
  const existing = new Set(previewSnapshot().map(order => order.code));
  const now = Date.now();
  const scenarios: { method: 'transfer' | 'counter'; state: 'unpaid' | 'verifying' | 'paid' | 'expired'; preparation?: PreparationStatus }[] = [
    { method: 'transfer', state: 'unpaid' }, { method: 'transfer', state: 'verifying' },
    { method: 'counter', state: 'verifying' }, { method: 'counter', state: 'paid', preparation: 'received' },
    { method: 'transfer', state: 'paid', preparation: 'preparing' }, { method: 'counter', state: 'paid', preparation: 'ready' },
    { method: 'transfer', state: 'paid', preparation: 'served' }, { method: 'counter', state: 'expired' },
  ];
  let count = 0;
  scenarios.forEach((scenario, index) => {
    const code = `DEMO-SAMPLE-${String(index + 1).padStart(2, '0')}`;
    if (existing.has(code)) return;
    const created = scenario.state === 'expired' ? now - 240000 : now - index * 3000;
    let order = createCheckout([
      { id: '9001', productId: 9001, name: 'Cà phê sữa đá (mẫu)', quantity: index % 2 + 1, price: 30000, isAvailable: true },
      { id: '9002', productId: 9002, name: 'Bánh brownie (mẫu)', quantity: 1, price: 40000, isAvailable: true },
    ], index % 2 ? 'Ít đá, phục vụ bánh trước.' : '', { id: 90000 + index, tableName: `Bàn mẫu ${String(index + 1).padStart(2, '0')}` }, code, created);
    order = transitionCheckout(order, { type: 'method', method: scenario.method }, created);
    if (['verifying', 'paid'].includes(scenario.state)) order = transitionCheckout(order, { type: 'confirm' }, created);
    if (scenario.state === 'paid') {
      order = transitionCheckout(order, { type: 'paid' }, created);
      while (order.preparationStatus !== scenario.preparation) order = transitionCheckout(order, { type: 'advance' }, created);
    }
    if (scenario.state === 'expired') order = transitionCheckout(order, { type: 'tick' }, now);
    if (publishPreview(order)) count++;
  });
  return count;
}
