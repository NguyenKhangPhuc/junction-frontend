'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem, NavigationProps } from './types';

export function NavigationBarMobile({
  items,
  projectName = 'Pohjola Post',
}: NavigationProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderItemIcon = (href: string, active: boolean) => {
    const iconClass = `w-5 h-5 transition-transform duration-200 ${
      active ? 'scale-110 text-primary' : 'text-on-surface-variant'
    }`;

    if (href === '/') {
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 2.5 : 2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      );
    }

    if (href.startsWith('/news')) {
      return (
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 2.5 : 2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      );
    }

    return (
      <svg
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 2.5 : 2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  return (
    <div className="md:hidden">
      {/* Top Mobile Masthead */}
      <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high px-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none"
          aria-label={`${projectName} Homepage`}
        >
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-on-primary font-headline text-sm font-bold">
            P
          </div>
          <span className="font-headline text-[20px] font-medium tracking-tight text-primary">
            {projectName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-wider text-secondary">
            Helsinki 02°C
          </span>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
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

      {/* Bottom Mobile Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high shadow-lg pb-[max(env(safe-area-inset-bottom),0px)]"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          {items.map((item: NavItem) => {
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center min-h-[48px] px-2 py-1 transition-colors duration-200 focus:outline-none ${
                  active ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {active && (
                  <span className="absolute top-0 inset-x-8 h-0.5 bg-primary rounded-full" />
                )}

                <div className="mb-1">{renderItemIcon(item.href, active)}</div>

                <span
                  className={`font-body text-[11px] uppercase tracking-wider ${
                    active ? 'font-bold text-primary' : 'font-medium text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default NavigationBarMobile;
