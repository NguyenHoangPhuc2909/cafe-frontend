import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-outline-variant/30 bg-surface-container-low md:mt-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 self-start text-primary">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">coffee</span>
          <span className="font-headline-md text-base font-bold">L'Atelier Café</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-on-surface-variant">
          <span className="inline-flex min-h-11 items-center gap-1.5"><span aria-hidden="true" className="material-symbols-outlined text-base">schedule</span>Giờ phục vụ · 07:00 – 22:30</span>
          <a href="tel:19008868" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:text-secondary"><span aria-hidden="true" className="material-symbols-outlined text-base">call</span>Liên hệ · 1900 8868</a>
        </div>
      </div>
    </footer>
  );
}