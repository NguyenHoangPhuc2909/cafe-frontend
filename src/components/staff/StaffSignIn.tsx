import { useState } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';

export default function StaffSignIn() {
  const { signIn, isSigningIn, error } = useStaffAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  return <section className="mx-auto w-full max-w-md">
    <span aria-hidden="true" className="material-symbols-outlined text-4xl text-primary">badge</span>
    <h2 className="mt-3 text-xl font-bold text-primary">Đăng nhập nhân viên</h2>
    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Dùng tài khoản Staff hoặc Admin để truy cập khu vực làm việc của quán.</p>
    <form className="mt-5 space-y-4" onSubmit={async event => { event.preventDefault(); await signIn(username, password); setPassword(''); }}>
      <div><label htmlFor="staff-username" className="mb-2 block text-sm font-semibold">Tên đăng nhập</label><input id="staff-username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} disabled={isSigningIn} required className="min-h-12 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 text-base outline-none focus:border-primary" /></div>
      <div><label htmlFor="staff-password" className="mb-2 block text-sm font-semibold">Mật khẩu</label><div className="relative"><input id="staff-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={isSigningIn} required className="min-h-12 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest pl-3 pr-20 text-base outline-none focus:border-primary" /><button type="button" aria-pressed={showPassword} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)} disabled={isSigningIn} className="absolute inset-y-0 right-1 min-w-16 px-3 text-xs font-semibold text-primary">{showPassword ? 'Ẩn' : 'Hiện'}</button></div></div>
      {error && <p role="alert" className="rounded-xl bg-error-container/40 p-3 text-sm text-error">{error}</p>}
      <button type="submit" disabled={isSigningIn || !username.trim() || !password} className="min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-40">{isSigningIn ? 'Đang đăng nhập…' : 'Đăng nhập vào hệ thống'}</button>
    </form>
  </section>;
}
