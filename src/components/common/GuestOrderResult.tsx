import { useState } from 'react';
import { useGuestSession } from '../../hooks/useGuestSession';

export default function GuestOrderResult() {
  const { attempt, resolveUnknownOrder } = useGuestSession();
  const [resolution, setResolution] = useState<'created' | 'not-created' | null>(null);

  if (!attempt) return null;
  if (attempt.state === 'sending') return <div role="status" className="customer-notice">Đang gửi đơn cho {attempt.tableName}… Vui lòng chờ kết quả.</div>;
  if (attempt.state === 'unknown') return <section role="alert" className="customer-order-uncertain">
    <h2 className="text-lg font-bold text-primary">Chưa xác nhận được kết quả gửi đơn</h2>
    <p className="mt-2 text-sm leading-relaxed">Đơn cho {attempt.tableName} có thể đã được tạo lúc {new Date(attempt.startedAt).toLocaleTimeString('vi-VN')}. Bạn vui lòng nhờ nhân viên kiểm tra trước khi gửi tiếp để tránh trùng đơn. Giỏ hàng vẫn được giữ lại.</p>
    <fieldset className="mt-4 text-sm"><legend className="font-semibold">Kết quả kiểm tra với nhân viên</legend>
      <label className="mt-2 flex min-h-control cursor-pointer items-start gap-3"><input type="radio" name="order-resolution" checked={resolution === 'not-created'} onChange={() => setResolution('not-created')} className="mt-1 h-5 w-5 shrink-0 accent-secondary" /><span>Đơn chưa được tạo; giữ giỏ để gửi lại.</span></label>
      <label className="mt-2 flex min-h-control cursor-pointer items-start gap-3"><input type="radio" name="order-resolution" checked={resolution === 'created'} onChange={() => setResolution('created')} className="mt-1 h-5 w-5 shrink-0 accent-secondary" /><span>Đơn đã được tạo; xóa giỏ hiện tại để tránh gửi trùng.</span></label>
    </fieldset>
    <button disabled={!resolution} onClick={() => resolveUnknownOrder(resolution === 'created')} className="ui-button mt-3">Xác nhận kết quả kiểm tra</button>
  </section>;
  return null;
}
