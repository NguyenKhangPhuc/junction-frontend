import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Banner / Ticker */}
      <div className="flex items-center gap-2 mb-8 p-3 bg-surface-subtle border border-border rounded-lg text-xs sm:text-sm">
        <span className="px-2 py-0.5 rounded bg-primary text-black font-bold uppercase text-[10px]">
          Breaking
        </span>
        <span className="text-text-secondary truncate">
          KoJaPu releases modern digital journalism navigation interface with #29ecdb signature identity.
        </span>
      </div>

      {/* Featured Headline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest">
            <span>Special Report</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            The Next Wave of Editorial Publishing & Digital Experience
          </h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
            KoJaPu brings together lightning-fast performance, responsive horizontal navigation, and an intuitive mobile experience tailored for today&apos;s digital newsroom.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/news"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-black font-semibold text-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_var(--color-primary)]"
            >
              Explore Latest News
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-surface border border-border text-foreground font-semibold text-sm hover:border-primary transition-colors"
            >
              About KoJaPu
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 p-6 rounded-2xl bg-surface border border-border space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
            Trending Today
          </h2>
          <ul className="space-y-4 divide-y divide-border">
            <li className="pt-3 first:pt-0">
              <span className="text-xs text-primary font-mono font-semibold">01 / TECH</span>
              <p className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors mt-1">
                Global tech summits converge on modern web performance standards.
              </p>
            </li>
            <li className="pt-3">
              <span className="text-xs text-primary font-mono font-semibold">02 / ECONOMY</span>
              <p className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors mt-1">
                Digital publishing markets record robust multi-channel reader engagement.
              </p>
            </li>
            <li className="pt-3">
              <span className="text-xs text-primary font-mono font-semibold">03 / DESIGN</span>
              <p className="text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors mt-1">
                Why turquoise and cyan hues dominate futuristic UI experiences in 2026.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
