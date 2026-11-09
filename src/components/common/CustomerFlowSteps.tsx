import { Steps } from 'antd';

export default function CustomerFlowSteps({ current, status = 'process' }: { current: number; status?: 'process' | 'finish' | 'error' }) {
  return <nav aria-label="Tiến trình đặt món" className="customer-flow-progress">
    <Steps size="small" current={current} status={status} responsive={false} orientation="horizontal" titlePlacement="vertical"
      items={['Chọn món', 'Giỏ hàng', 'Thanh toán', 'Nhận món'].map(title => ({ title }))} />
  </nav>;
}
