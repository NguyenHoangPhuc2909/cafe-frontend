export function parseCashAmount(input: string, positive = false): number {
  const value = Number(input);
  if (input.trim() === '' || !Number.isSafeInteger(value) || value < (positive ? 1 : 0) || value > 999_999_999_999)
    throw new Error(positive ? 'Nhập số tiền nguyên lớn hơn 0, tối đa 999.999.999.999đ.' : 'Nhập số tiền thực đếm từ 0 trở lên, tối đa 999.999.999.999đ.');
  return value;
}
export function cashDifference(actual: number, expected: number) {
  return Math.round((actual - expected) * 100) / 100;
}
export function cashStatus(difference: number) {
  return difference === 0 ? 'Khớp quỹ' : difference > 0 ? 'Thừa tiền' : 'Thiếu tiền';
}
export function cashDate(date: string) { return date.split('-').reverse().join('/'); }

const key = (username: string, operation: string) => `cafe:cash-pending:v1:${username}:${operation}`;
export function readCashPending<T extends { requestId: string; businessDate: string }>(username: string, operation: string): T | null {
  const raw = localStorage.getItem(key(username, operation));
  if (raw == null) return null;
  const request: T = JSON.parse(raw);
  if (!request || typeof request.requestId !== 'string' || !request.requestId || typeof request.businessDate !== 'string')
    throw new Error('Không đọc được yêu cầu tiền mặt đang chờ.');
  return request;
}
export function writeCashPending(username: string, operation: string, request: unknown) {
  localStorage.setItem(key(username, operation), JSON.stringify(request));
}
export function clearCashPending(username: string, operation: string) { localStorage.removeItem(key(username, operation)); }
