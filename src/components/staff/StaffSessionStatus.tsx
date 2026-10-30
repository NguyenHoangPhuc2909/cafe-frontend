import { Link } from 'react-router-dom';
import { useStaffAuth } from '../../hooks/useStaffAuth';

export default function StaffSessionStatus() {
  const { verificationError, retryVerification, signOut } = useStaffAuth();
  return <main className="staff-theme flex min-h-screen items-center justify-center bg-[#F6F2EE] px-4 py-8">
    <section className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface p-6 text-center shadow-sm">
      <span aria-hidden="true" className="material-symbols-outlined text-5xl text-primary">{verificationError ? 'cloud_off' : 'verified_user'}</span>
      <h1 className="mt-4 text-xl font-bold text-primary">{verificationError ? 'Chưa xác minh được phiên đăng nhập' : 'Đang xác minh đăng nhập…'}</h1>
      {verificationError ? <><p role="alert" className="mt-3 text-sm leading-relaxed text-on-surface-variant">{verificationError}</p><button type="button" onClick={retryVerification} className="mt-5 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary">Kiểm tra lại kết nối</button><button type="button" onClick={signOut} className="mt-3 min-h-11 w-full rounded-xl border border-primary px-4 text-sm font-semibold text-primary">Quay lại đăng nhập</button></>
        : <p role="status" className="mt-3 text-sm text-on-surface-variant">Vui lòng chờ hệ thống kiểm tra quyền nhân viên.</p>}
      <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">Về trang khách</Link>
    </section>
  </main>;
}
