import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

export function LoadingRegion({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="status" aria-live="polite" className={className}>
    <span className="sr-only">{label}</span><div aria-hidden="true">{children}</div>
  </div>;
}

export function ProductGridSkeleton({ staff = false }: { staff?: boolean }) {
  return <LoadingRegion label="Đang tải thực đơn" className={staff ? 'flex-1 overflow-y-auto p-4 pb-24 md:pb-4' : ''}>
    <div className={staff ? 'pos-product-grid' : 'menu-grid'}>
      {Array.from({ length: 8 }, (_, index) => <div key={index} className={`product-card ${staff ? 'product-card--staff' : ''}`}>
        <Skeleton className="product-card__image !rounded-none" />
        <div className="product-card__body">
          <Skeleton className="h-4 w-2/5" />
          <div className="product-card__name"><Skeleton className="mt-1 h-4 w-4/5" /></div>
          <div className="product-card__description space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div>
          <div className="product-card__footer"><Skeleton className="h-5 w-16" /><div className="flex gap-1">{staff && <Skeleton className="h-control w-control" />}<Skeleton className="h-control w-control" /></div></div>
        </div>
      </div>)}
    </div>
  </LoadingRegion>;
}

export function OrderListSkeleton() {
  return <LoadingRegion label="Đang tải danh sách đơn hàng">
    <div className="order-collection__heading"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-16" /></div>
    {[0, 1, 2, 3, 4].map(index => <div key={index} className="order-skeleton-row">
      <div className="flex justify-between gap-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-5 w-24" /></div>
      <Skeleton className="mt-3 h-3 w-4/5" /><div className="mt-3 flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-20" /></div>
    </div>)}
  </LoadingRegion>;
}

export function OrderDetailSkeleton() {
  return <LoadingRegion label="Đang tải chi tiết đơn hàng">
    <div className="ui-panel space-y-6 p-5"><Skeleton className="h-6 w-2/5" /><Skeleton className="h-4 w-3/5" />
      <div className="space-y-4 border-y border-outline-variant/40 py-6">{[0, 1, 2].map(index => <div key={index} className="flex justify-between gap-6"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-4 w-16" /></div>)}</div>
      <Skeleton className="h-6 w-1/2" /><Skeleton className="h-control w-full" />
    </div>
  </LoadingRegion>;
}

export function TablesSkeleton() {
  return <LoadingRegion label="Đang tải bàn và kiểm tra phiên phục vụ" className="mt-5">
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">{Array.from({ length: 9 }, (_, index) => <div key={index} className="ui-panel flex flex-col items-center gap-4 p-4">
        <Skeleton className="h-10 w-10" /><Skeleton className="h-5 w-20" /><Skeleton className="h-6 w-24 !rounded-md" /><Skeleton className="h-3 w-16" />
      </div>)}</div>
      <div className="ui-panel space-y-5 p-5"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-control w-full" /></div>
    </div>
  </LoadingRegion>;
}

export function TableAccessSkeleton() {
  return <LoadingRegion label="Đang tìm thông tin bàn">
    <div className="flex flex-col items-center">
      <Skeleton className="mb-4 h-12 w-12" /><Skeleton className="h-8 w-36" />
      <div className="mt-3 w-full space-y-2"><Skeleton className="mx-auto h-4 w-5/6" /><Skeleton className="mx-auto h-4 w-2/3" /></div>
      <Skeleton className="mt-6 h-control w-full" />
    </div>
  </LoadingRegion>;
}

export function StaffSessionSkeleton() {
  return <LoadingRegion label="Đang xác minh phiên đăng nhập nhân viên">
    <div className="flex flex-col items-center gap-4"><Skeleton className="h-12 w-12" /><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
  </LoadingRegion>;
}
