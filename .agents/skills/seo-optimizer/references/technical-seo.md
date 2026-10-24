# Technical SEO

## Crawling & Indexing

- **robots.txt**: make sure it doesn't accidentally block pages that need to be indexed
- **XML sitemap**: submit via Google Search Console, update it when new content is published
- **Canonical tags**: avoid duplicate content between URL variants (e.g., with/without UTM parameters, http/https, with/without www)
- **Index status**: check via Google Search Console (Coverage report) to see if any pages are unexpectedly "Excluded"

## Core Web Vitals (speed & experience)

Google uses 3 main metrics to evaluate page load experience (thresholds may change — web_search "Core Web Vitals thresholds" to get the latest figures before giving specific advice):
- **LCP (Largest Contentful Paint)**: time to render the largest visible element
- **INP (Interaction to Next Paint)**: interaction responsiveness delay (replaced FID as of 2024)
- **CLS (Cumulative Layout Shift)**: layout stability during load

Common improvements:
- Compress/optimize images (WebP/AVIF), lazy loading
- Reduce render-blocking JavaScript, use defer/async
- Use a CDN, enable browser caching
- Set fixed dimensions for images/videos to avoid layout shift

## Mobile-first

Google indexes primarily based on the mobile version of a page. Ensure:
- Responsive design, no hidden/different content between mobile and desktop
- Large enough fonts, adequately spaced tap targets

## HTTPS & security
- HTTPS is required (a minor ranking factor but important for trust)

## Site structure
- Flat architecture: important pages should be at most 3 clicks from the homepage
- Breadcrumbs help both users and Google understand site structure
- Avoid orphan pages (pages not linked from anywhere internally)

## Quick check during an audit
If a specific URL is given, use web_fetch to inspect the actual HTML and check: title tag, meta description, H1 tag, canonical tag, whether it's accidentally noindexed, page size, image alt text.