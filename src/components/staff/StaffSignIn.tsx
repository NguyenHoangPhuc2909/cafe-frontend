import Icon from '../ui/Icon';
import { useState } from 'react';
import { useStaffAuth } from '../../hooks/useStaffAuth';

export default function StaffSignIn() {
  const { signIn, isSigningIn, error } = useStaffAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  return <section className="mx-auto w-full max-w-md">
    <h2 className="text-xl font-bold text-primary">Đăng nhập nhân viên</h2>
    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Đăng nhập để bắt đầu ca làm việc của bạn.</p>
    <form className="mt-5 space-y-4" onSubmit={async event => { event.preventDefault(); await signIn(username, password); setPassword(''); }}>
      <div><label htmlFor="staff-username" className="mb-1.5 block text-sm font-semibold">Tên đăng nhập</label><input id="staff-username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} disabled={isSigningIn} required className="min-h-control w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 text-base sm:text-sm outline-none focus:border-primary" /></div>
      <div><label htmlFor="staff-password" className="mb-1.5 block text-sm font-semibold">Mật khẩu</label><div className="relative"><input id="staff-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={isSigningIn} required className="min-h-control w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest pl-3 pr-12 text-base sm:text-sm outline-none focus:border-primary" /><button type="button" aria-pressed={showPassword} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)} disabled={isSigningIn} className="absolute inset-y-0 right-0 flex w-control items-center justify-center rounded-xl text-lg text-on-surface-variant hover:text-primary"><Icon name={showPassword ? 'eye_off' : 'eye'} /></button></div></div>
      {error && <p role="alert" className="rounded-xl bg-error-container/40 p-3 text-sm text-error">{error}</p>}
      <button type="submit" disabled={isSigningIn || !username.trim() || !password} className="ui-button ui-button--primary w-full">{isSigningIn ? 'Đang đăng nhập…' : 'Đăng nhập vào hệ thống'}</button>
    </form>
  </section>;
}
