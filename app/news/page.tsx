import Link from 'next/link';

export const metadata = {
  title: 'Latest News - KoJaPu',
  description: 'Breaking news, editorial stories and live reporting from KoJaPu',
};

export default function NewsPage() {
  const articles = [
    {
      id: 1,
      category: 'Technology',
      title: 'Artificial Intelligence Transforms Real-Time Journalism Workflows',
      excerpt: 'How newsrooms worldwide are accelerating verification, transcription, and interactive storytelling.',
      time: '12 mins ago',
      readTime: '4 min read',
    },
    {
      id: 2,
      category: 'Innovation',
      title: 'Next-Generation Web Frameworks Deliver Sub-Second Page Transitions',
      excerpt: 'React 19 and Next.js 16 redefine server rendering and hydration benchmarks.',
      time: '34 mins ago',
      readTime: '6 min read',
    },
    {
      id: 3,
      category: 'Design Systems',
      title: 'Tokenized Theming: Building Resilient Color Systems with #29ecdb',
      excerpt: 'A deep dive into centralized design tokens, strict responsive patterns, and accessible high-contrast UI.',
      time: '1 hour ago',
      readTime: '5 min read',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="border-b border-border pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest mb-2">
          <span>KoJaPu Newsroom</span>
          <span>•</span>
          <span>All Dispatches</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Latest News & Dispatches
        </h1>
        <p className="text-text-secondary mt-2 text-base max-w-2xl">
          Curated stories, investigations, and global dispatches updated continuously throughout the day.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between p-6 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all duration-200 group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                <span className="font-semibold text-primary uppercase tracking-wider">
                  {item.category}
                </span>
                <span>{item.time}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h2>
              <p className="text-sm text-text-secondary mt-2 line-clamp-3">
                {item.excerpt}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>{item.readTime}</span>
              <span className="font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                Read full story →
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          ← Return to Front Page
        </Link>
      </div>
    </div>
  );
}
