const steps = ['Chọn món', 'Giỏ hàng', 'Thanh toán', 'Nhận món'];

export default function CustomerFlowSteps({ current }: { current: number }) {
  return <nav aria-label="Tiến trình đặt món" className="mb-6 overflow-x-auto">
    <ol className="flex min-w-max items-center gap-3 text-xs sm:gap-5 sm:text-sm">
      {steps.map((step, index) => <li key={step} aria-current={index === current ? 'step' : undefined}
        className={`flex items-center gap-2 ${index <= current ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${index <= current ? 'bg-primary text-on-primary' : 'bg-surface-container'}`}>
          {index < current ? '✓' : index + 1}
        </span>{step}
        {index < steps.length - 1 && <span aria-hidden="true" className="ml-1 text-outline">›</span>}
      </li>)}
    </ol>
  </nav>;
}
