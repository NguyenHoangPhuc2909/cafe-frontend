import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Input, Modal, Progress, Radio, Select, Tag } from 'antd';
import Icon from '../ui/Icon';
import type { StocktakeDraft, StocktakeReport } from '../../types/stocktake';
import { getStocktakePreview, saveStocktake } from '../../services/staffStocktakes';
import { staffErrorMessage } from '../../services/staffApi';
import { actualQuantity, clearStocktakeDraft, matchesStocktakeSearch, newStocktakeDraft,
  readStocktakeDraft, stocktakeDifference, stocktakeKey, stocktakeRequest, writeStocktakeDraft } from '../../utils/stocktakeDraft';

interface Props { token: string; username: string; onClose: () => void; onSuccess: (report: StocktakeReport) => void }
type Filter = 'all' | 'unchecked' | 'checked' | 'difference';
const number = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 6 });

export default function StocktakeForm({ token, username, onClose, onSuccess }: Props) {
  const [restored] = useState(() => {
    try { return { draft: readStocktakeDraft(username), error: '' }; }
    catch { return { draft: null, error: 'Chưa đọc được bản nháp trên trình duyệt. Kiểm tra bộ nhớ trước khi nhập tiếp.' }; }
  });
  const [draft, setDraft] = useState<StocktakeDraft | null>(restored.draft);
  const [error, setError] = useState(restored.error);
  const [storageError, setStorageError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(!!restored.draft?.pending);
  const [kind, setKind] = useState('ingredient');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const busyRef = useRef(false);
  const locked = busy || !!draft?.pending;

  function persist(next: StocktakeDraft) {
    setDraft(next);
    try { writeStocktakeDraft(username, next); setStorageError(''); return true; }
    catch { setStorageError('Chưa giữ được bản nháp. Kiểm tra bộ nhớ trình duyệt; chưa đóng form để tránh mất dữ liệu.'); return false; }
  }

  useEffect(() => {
    if (restored.draft || restored.error) return;
    const controller = new AbortController();
    getStocktakePreview(token, controller.signal).then(items => {
      if (controller.signal.aborted) return;
      const next = newStocktakeDraft(items);
      setDraft(next);
      try { writeStocktakeDraft(username, next); }
      catch { setStorageError('Chưa giữ được bản nháp trên trình duyệt.'); }
    }).catch(cause => { if (!controller.signal.aborted) setError(staffErrorMessage(cause)); });
    return () => controller.abort();
  }, [token, username, restored]);

  const refresh = async () => {
    if (locked || loading) return;
    setLoading(true); setError('');
    try {
      const items = await getStocktakePreview(token);
      persist(newStocktakeDraft(items, draft));
      setReview(false);
      setError(draft ? 'Đã cập nhật số đối chiếu và giữ số đã nhập cho các mặt hàng còn trong kho. Hãy kiểm tra lại trước khi lưu.' : '');
    } catch (cause) { setError(staffErrorMessage(cause)); }
    finally { setLoading(false); }
  };
  const updateLine = (key: string, patch: { input?: string; note?: string }) => {
    if (!draft || locked) return;
    persist({ ...draft, items: draft.items.map(item => stocktakeKey(item) === key ? { ...item, ...patch } : item) });
  };
  const checked = draft?.items.filter(item => item.input.trim() !== '').length ?? 0;
  const total = draft?.items.length ?? 0;
  const difference = (item: NonNullable<typeof draft>['items'][number]) => {
    try { const actual = actualQuantity(item.input, item.productId != null); return actual == null ? null : stocktakeDifference(actual, item.expectedQuantity); }
    catch { return null; }
  };
  const differences = draft?.items.filter(item => { const delta = difference(item); return delta != null && delta !== 0; }).length ?? 0;
  const rows = draft?.items.filter(item => {
    if (review) return true;
    if ((kind === 'ingredient') !== (item.ingredientId != null) || !matchesStocktakeSearch(item.itemName, query)) return false;
    if (stocktakeKey(item) === focusedKey) return true;
    const done = item.input.trim() !== '';
    const delta = difference(item);
    return filter === 'all' || (filter === 'checked' && done) || (filter === 'unchecked' && !done)
      || (filter === 'difference' && delta != null && delta !== 0);
  }) ?? [];

  const startReview = () => {
    if (!draft) return;
    try { stocktakeRequest(draft, crypto.randomUUID()); setError(''); setReview(true); }
    catch (cause) { setError(staffErrorMessage(cause)); }
  };
  const submit = async () => {
    if (!draft || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const request = draft.pending ?? stocktakeRequest(draft, crypto.randomUUID());
      const next = { ...draft, pending: request };
      if (!persist(next)) return;
      const report = await saveStocktake(token, request);
      try { clearStocktakeDraft(username); }
      catch { /* Retried pending requests return this same saved report. */ }
      onSuccess(report);
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      // A definite rejection allows editing. Network failures keep the exact request for retry.
      if (status === 400 || status === 404 || status === 409) {
        persist({ ...draft, pending: null }); setReview(false);
      }
      setError(staffErrorMessage(cause));
    } finally { busyRef.current = false; setBusy(false); }
  };

  return <Modal open width={900} className="stocktake-modal" title={<div className="stocktake-title"><span className="stocktake-title-icon"><Icon name="inventory_2" /></span><div><h2>{review ? 'Xem lại phiếu kiểm kho' : 'Kiểm kho'}</h2><p>Ghi nhận số lượng thực tế tại quán</p></div></div>}
    mask={{ closable: false }} closable={!busy && !loading} keyboard={!busy && !loading}
    onCancel={onClose} footer={<div className="stocktake-footer"><span><Icon name="check" /> Bản nháp được giữ trên thiết bị này</span><div className="stocktake-actions">
      <Button disabled={busy || loading} onClick={onClose}>Đóng</Button>
      {review && !locked && <Button onClick={() => setReview(false)}>Tiếp tục nhập</Button>}
      {review ? <Button type="primary" loading={busy} onClick={() => void submit()}>{draft?.pending ? 'Gửi lại cùng phiếu' : 'Lưu phiếu kiểm kho'}</Button>
        : <Button type="primary" disabled={!checked || loading} onClick={startReview}>Xem lại phiếu</Button>}
    </div></div>}>
    <div className="stocktake-form">
      <div className="stocktake-meta"><span className="stocktake-person"><Icon name="person" /><strong>{username}</strong></span>
        <span><Icon name="schedule" />{draft ? new Date(draft.startedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Đang tải danh sách…'}</span>
        {!review && <Button className="stocktake-refresh" type="text" shape="circle" aria-label="Tải lại số đối chiếu" title="Tải lại số đối chiếu" disabled={locked || loading}
          icon={<Icon name="refresh" spin={loading} />} onClick={() => void refresh()} />}
      </div>
      {error && <Alert className="mt-3" type="warning" title={error} showIcon />}
      {storageError && <Alert className="mt-3" type="error" title={storageError} showIcon />}
      {draft?.pending && <Alert className="mt-3" type="info" showIcon title="Phiếu chưa rõ kết quả. Gửi lại cùng phiếu để kiểm tra, tránh tạo trùng." />}
      {draft && <>
        <div className="stocktake-overview"><div className="stocktake-progress"><div><span>Tiến độ kiểm kho</span><strong>{checked}<small> / {total} mặt hàng</small></strong></div>
          <div className="stocktake-stat"><span>Chưa kiểm</span><strong>{total - checked}</strong></div>
          <div className={`stocktake-stat${differences ? ' has-difference' : ''}`}><span>Chênh lệch</span><strong>{differences}</strong></div></div>
          <Progress percent={total ? Math.round(checked / total * 100) : 0} showInfo={false} strokeColor="#a1653b" size="small" />
        </div>
        {review ? <Alert type={checked < total ? 'warning' : 'info'} showIcon
          title={checked < total ? `Còn ${total - checked} mặt hàng chưa kiểm. Phiếu sẽ ghi rõ các dòng này là “Chưa kiểm”.` : 'Đã nhập đủ các mặt hàng. Kiểm tra chênh lệch trước khi lưu.'} />
          : <div className="stocktake-toolbar">
            <Radio.Group value={kind} onChange={event => setKind(event.target.value)} optionType="button" buttonStyle="solid"
              options={[{ value: 'ingredient', label: 'Nguyên liệu' }, { value: 'packaged', label: 'Hàng đóng gói' }]} />
            <Input className="stocktake-search" prefix={<Icon name="search" />} aria-label="Tìm mặt hàng kiểm kho" placeholder="Tìm tên mặt hàng…" allowClear value={query} onChange={event => setQuery(event.target.value)} />
            <Select aria-label="Lọc trạng thái kiểm kho" value={filter} onChange={setFilter} options={[
              { value: 'all', label: 'Tất cả' }, { value: 'unchecked', label: 'Chưa kiểm' }, { value: 'checked', label: 'Đã kiểm' }, { value: 'difference', label: 'Có chênh lệch' },
            ]} />
          </div>}
        <div className="stocktake-list-heading"><span>{review ? 'Kết quả kiểm đếm' : `${rows.length} mặt hàng trong danh sách`}</span><span>Số lượng thực tế</span></div>
        <div className="stocktake-rows" aria-label="Danh sách kiểm kho">
          {rows.length === 0 && <p className="py-8 text-center text-on-surface-variant">Không có mặt hàng phù hợp.</p>}
          {rows.map(item => {
            const key = stocktakeKey(item); const delta = difference(item);
            let invalid = false;
            try { actualQuantity(item.input, item.productId != null); } catch { invalid = true; }
            return <div className={`stocktake-row${delta != null ? delta === 0 ? ' is-matched' : ' is-different' : ''}`} key={key} onFocus={() => setFocusedKey(key)}
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusedKey(null); }}>
              <div className="stocktake-row-main"><div className="stocktake-item-info"><strong>{item.itemName}</strong><small>Tồn hệ thống <b>{number(item.expectedQuantity)}</b> {item.unit}</small></div>
                {review ? <strong>{item.input.trim() === '' ? 'Chưa kiểm' : `${number(Number(item.input))} ${item.unit ?? ''}`}</strong>
                  : <label><span className="sr-only">Số thực tế {item.itemName}</span><input className="stocktake-quantity" type="number" min="0" step={item.productId != null ? '1' : 'any'}
                    value={item.input} disabled={locked} placeholder="Chưa kiểm" aria-invalid={invalid} aria-label={`Số thực tế ${item.itemName}`}
                    onChange={event => updateLine(key, { input: event.target.value })} /><span className="stocktake-unit">{item.unit}</span></label>}
              </div>
              {invalid && <p className="text-error text-xs">Nhập số từ 0 trở lên; hàng đóng gói dùng số nguyên.</p>}
              {delta != null && <Tag color={delta === 0 ? 'green' : 'orange'}>{delta === 0 ? 'Khớp tồn' : `Chênh lệch: ${delta > 0 ? '+' : ''}${number(delta)} ${item.unit ?? ''}`}</Tag>}
              {(item.input.trim() !== '' || item.note) && <details open={item.note ? true : undefined} className="stocktake-line-note">
                <summary>Ghi chú{item.note ? ': đã thêm' : ''}</summary>
                {review ? <p className="whitespace-pre-wrap">{item.note || 'Không có ghi chú.'}</p> : <Input.TextArea aria-label={`Ghi chú ${item.itemName}`} rows={2} maxLength={500} value={item.note}
                  disabled={locked} placeholder="Hao hụt, hỏng, nguyên nhân thừa/thiếu…" onChange={event => updateLine(key, { note: event.target.value })} />}
              </details>}
            </div>;
          })}
        </div>
        <p className="stocktake-hint">Để trống nếu chưa kiểm · Nhập 0 nếu hết hàng · Phiếu không tự điều chỉnh tồn kho</p>
        <label className="stocktake-general-note">Ghi chú chung <span>(không bắt buộc)</span>
          <Input.TextArea className="mt-2" rows={2} maxLength={500} value={draft.note} disabled={locked || review}
            onChange={event => persist({ ...draft, note: event.target.value })} placeholder="Các vấn đề cần báo chủ quán…" />
        </label>
      </>}
    </div>
  </Modal>;
}
