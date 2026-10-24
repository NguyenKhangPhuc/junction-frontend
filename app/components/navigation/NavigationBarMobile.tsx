'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem, NavigationProps } from './types';
import { typography } from '@/constants/design-tokens';

const subscribe = () => () => {};

function getFormattedMobileDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

export function NavigationBarMobile({
  items,
  projectName = 'KoJaPu',
}: NavigationProps) {
  const pathname = usePathname();
  const currentDateString = useSyncExternalStore(
    subscribe,
    getFormattedMobileDate,
    () => 'Today'
  );

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Helper icons for mobile navigation items
  const renderItemIcon = (href: string, active: boolean) => {
    const iconClass = `w-5 h-5 transition-transform duration-200 ${
      active ? 'scale-110 text-primary' : 'text-text-secondary'
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

    // Default icon for About or other routes
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
      {/* Top Mobile Bar: Brand & Status */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface/95 backdrop-blur-md border-b border-border">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          aria-label={`${projectName} Homepage`}
        >
          <span className={`${typography.logo.size} ${typography.logo.weight} text-foreground`}>
            {projectName}
          </span>
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
        </Link>

        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="truncate max-w-[150px]">{currentDateString}</span>
        </div>
      </div>

      {/* Bottom Mobile Navigation Bar: Items Placed At The Bottom as requested */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-lg border-t border-border shadow-lg pb-[max(env(safe-area-inset-bottom),0px)]"
      >
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          {items.map((item: NavItem) => {
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center min-h-[48px] px-2 py-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active ? 'text-primary' : 'text-text-secondary hover:text-primary'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active Indicator Top Glow */}
                {active && (
                  <span className="absolute top-0 inset-x-6 h-0.5 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]" />
                )}

                <div className="relative mb-1">
                  {renderItemIcon(item.href, active)}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-primary text-black">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] tracking-wide transition-all ${
                    active ? 'font-bold text-primary' : 'font-medium text-text-secondary'
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
