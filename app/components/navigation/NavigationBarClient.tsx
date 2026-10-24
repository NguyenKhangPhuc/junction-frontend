'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem, NavigationProps } from './types';
import { typography } from '@/constants/design-tokens';

const subscribe = () => () => {};

function getFormattedClientDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

export function NavigationBarClient({
  items,
  projectName = 'KoJaPu',
  tagline = 'News & Editorial Insights',
}: NavigationProps) {
  const pathname = usePathname();
  const currentDateString = useSyncExternalStore(
    subscribe,
    getFormattedClientDate,
    () => 'Daily Edition'
  );

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="hidden md:block w-full border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Masthead Row: Brand, Edition & Metadata */}
        <div className="flex items-center justify-between py-4 border-b border-border/60">
          {/* Left: Publication Date & Status */}
          <div className="flex items-center space-x-3 text-xs text-text-muted">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="font-medium tracking-wide">
              {currentDateString}
            </span>
            <span className="hidden lg:inline text-border">|</span>
            <span className="hidden lg:inline font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              Live Updates
            </span>
          </div>

          {/* Center: Brand Logo */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1"
              aria-label={`${projectName} Homepage`}
            >
              <span className={`${typography.logo.size} ${typography.logo.weight} ${typography.logo.tracking} text-foreground group-hover:opacity-90 transition-opacity`}>
                {projectName}
              </span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)] animate-pulse" />
            </Link>
            <p className="hidden md:block text-[11px] uppercase tracking-widest text-text-muted mt-0.5">
              {tagline}
            </p>
          </div>

          {/* Right: Action & Utility */}
          <div className="flex items-center space-x-3">
            <div className="hidden xl:flex items-center bg-surface-subtle text-text-muted rounded-full px-3 py-1.5 text-xs border border-border">
              <svg
                className="w-3.5 h-3.5 mr-2 text-text-muted"
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
              <span>Search articles...</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-semibold text-primary border border-primary/30">
              Newsroom
            </span>
          </div>
        </div>

        {/* Bottom Row: Horizontal Navigation Items (Placed Underneath as requested) */}
        <nav
          aria-label="Desktop Primary Navigation"
          className="flex items-center justify-center py-2.5 gap-2 sm:gap-4 lg:gap-8"
        >
          {items.map((item: NavItem) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? 'text-primary bg-primary-subtle font-bold shadow-sm'
                    : 'text-text-secondary hover:text-primary hover:bg-surface-subtle'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-primary text-black">
                      {item.badge}
                    </span>
                  )}
                </span>

                {/* Active Underline Highlight with Brand Glow */}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
