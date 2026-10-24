# Comprehensive SEO Audit Checklist

When auditing an existing page/site, use web_fetch to inspect the actual page (if a URL is given), then check in order of impact priority:

## 1. Technical (foundation — fix first)
- [ ] Is the page unintentionally blocked from indexing (robots.txt, meta noindex)?
- [ ] Is HTTPS in place?
- [ ] Page load speed (Core Web Vitals) — recommend PageSpeed Insights if the user needs precise numbers
- [ ] Is it responsive/mobile-friendly?
- [ ] Any duplicate content / missing canonical tags?
- [ ] Does an XML sitemap exist and is it up to date?

## 2. On-page
- [ ] Title tag: correct length, contains primary keyword, compelling, not duplicated across pages?
- [ ] Meta description: present, compelling, correct length?
- [ ] Unique H1 containing the keyword?
- [ ] Logical heading structure (H2, H3...)?
- [ ] Do images have alt text?
- [ ] Is the URL friendly (short, contains keyword)?
- [ ] Sufficient and sensible internal linking?

## 3. Content
- [ ] Does the content fully address search intent?
- [ ] Signs of E-E-A-T (author info, cited sources, real data)?
- [ ] Any thin content, or duplication with other pages on the site?
- [ ] Spelling/grammar errors?
- [ ] Is content up to date (for time-sensitive topics)?

## 4. Off-page (if data available)
- [ ] Does the site have backlinks from reputable sources, or mostly spammy ones?
- [ ] Any brand signals (brand mentions, social) present?

## 5. Competitor analysis
- Use web_search to review 3-5 competitors currently ranking at the top for the target keyword, comparing length, content depth, and format to find exploitable gaps.

## Presenting audit results
Prioritize listing findings by impact level (High/Medium/Low) and ease of fixing (Easy/Hard), so the user knows what to tackle first.