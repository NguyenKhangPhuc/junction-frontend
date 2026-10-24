'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem, NavigationProps } from './types';

export function NavigationBarClient({
  items,
  projectName = 'Pohjola Post',
}: NavigationProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href.startsWith('/#')) {
      return false;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes('#news') && pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('news');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', '#news');
      }
    }
  };

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-surface-container-high/60 transition-colors">
      <div className="h-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Masthead: Logo & Publication Title */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline text-lg font-bold shadow-sm">
            P
          </div>
          <Link
            href="/"
            className="font-headline text-[24px] leading-[30px] tracking-tight text-primary font-medium select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            aria-label={`${projectName} Homepage`}
          >
            {projectName}
          </Link>
        </div>

        {/* Primary Horizontal Navigation Links */}
        <nav
          aria-label="Desktop Primary Navigation"
          className="flex items-center gap-6"
        >
          {items.map((item: NavItem) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                aria-current={active ? 'page' : undefined}
                className={`font-body text-[13px] leading-[18px] uppercase tracking-wider transition-colors pb-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm ${
                  active
                    ? 'text-primary font-semibold border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Utility: Weather, Search & Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-body text-[11px] leading-[16px] uppercase tracking-wider font-semibold text-on-surface">
              Helsinki • 02°C
            </span>
            <span className="font-body text-[12px] leading-[18px] text-secondary">
              Nordic Edition • Daily
            </span>
          </div>

          <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />

          {/* Search Button */}
          <button
            type="button"
            aria-label="Search edition"
            className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-full hover:bg-surface-container"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
          </button>

          {/* Profile Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm text-on-primary cursor-pointer hover:opacity-90 transition-opacity"
            title="Subscriber Profile"
          >
            <svg
              className="w-4 h-4 text-on-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavigationBarClient;
