import Icon from '../ui/Icon';
import { Link } from 'react-router-dom';
import Brand from './Brand';

export default function Footer() {
  return (
    <footer className="customer-footer mt-8 md:mt-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link to="/" className="inline-flex min-h-control items-center gap-2 self-start text-primary">
          <Brand subtitle="Hẹn bạn ở một ly cà phê tiếp theo." />
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-on-surface-variant">
          <span className="inline-flex min-h-control items-center gap-1.5"><span aria-hidden="true" className="icon-slot text-base"><Icon name="schedule" /></span>Giờ phục vụ · 07:00 – 22:30</span>
          <a href="tel:19008868" className="inline-flex min-h-control items-center gap-1.5 font-semibold text-primary hover:text-on-secondary-container"><span aria-hidden="true" className="icon-slot text-base"><Icon name="call" /></span>Liên hệ · 1900 8868</a>
        </div>
      </div>
    </footer>
  );
}
