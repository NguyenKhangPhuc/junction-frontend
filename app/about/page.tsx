import Link from 'next/link';

export const metadata = {
  title: 'About KoJaPu - Newsroom & Mission',
  description: 'Learn about KoJaPu, our editorial standards, and digital publishing vision.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="border-b border-border pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest mb-2">
          <span>Editorial Overview</span>
          <span>•</span>
          <span>About Us</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          About KoJaPu
        </h1>
        <p className="text-text-secondary mt-2 text-base">
          Independent journalism, thoughtful analysis, and modern digital storytelling.
        </p>
      </div>

      <div className="space-y-8 text-foreground">
        <section className="p-6 rounded-2xl bg-surface border border-border">
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Our Mission
          </h2>
          <p className="text-text-secondary leading-relaxed text-sm sm:text-base">
            KoJaPu was founded with a singular purpose: to deliver accurate, unbiased, and beautifully presented news. By pairing disciplined editorial rigor with an uncompromising digital standard, we provide readers with clarity in a noisy information era.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface-subtle border border-border">
            <h3 className="font-bold text-foreground text-base mb-2">
              Signature Visual Identity
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Designed around the signature <span className="font-mono text-primary font-semibold">#29ecdb</span> cyan accent, prioritizing high-legibility typography, clear hierarchy, and seamless responsive performance across all viewports.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-subtle border border-border">
            <h3 className="font-bold text-foreground text-base mb-2">
              Adaptive Architecture
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Built with Next.js Server Components for lightning-speed initial rendering, complemented by reactive client navigation for instantaneous transitions.
            </p>
          </div>
        </section>

        <div className="pt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-black font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Back to Front Page
          </Link>
        </div>
      </div>
    </div>
  );
}
