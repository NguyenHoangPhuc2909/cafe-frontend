import { StaffSessionSkeleton } from '../ui/Skeleton';
import Icon from '../ui/Icon';
import { Link } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';

export default function StaffSessionStatus() {
  const { verificationError, retryVerification, signOut } = useStaffAuth();
  return <main className="staff-theme flex min-h-screen items-center justify-center bg-background px-4 py-8">
    <section aria-busy={!verificationError} className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface p-6 text-center shadow-sm">
      {verificationError ? <><span aria-hidden="true" className="icon-slot text-5xl text-primary"><Icon name="cloud_off" /></span><h1 className="mt-4 text-xl font-bold text-primary">Chưa xác minh được phiên đăng nhập</h1></> : <><h1 className="sr-only">Đang xác minh đăng nhập</h1><StaffSessionSkeleton /></>}
      {verificationError ? <><p role="alert" className="mt-3 text-sm leading-relaxed text-on-surface-variant">{verificationError}</p><button type="button" onClick={retryVerification} className="mt-5 min-h-control w-full rounded-xl bg-primary px-4 font-semibold text-on-primary">Kiểm tra lại kết nối</button><button type="button" onClick={signOut} className="mt-3 min-h-control w-full rounded-xl border border-primary px-4 text-sm font-semibold text-primary">Quay lại đăng nhập</button></>
        : null}
      <Link to="/" className="mt-4 inline-flex min-h-control items-center text-sm font-semibold text-primary underline">Về trang khách</Link>
    </section>
  </main>;
}
