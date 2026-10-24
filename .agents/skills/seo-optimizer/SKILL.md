---
name: seo-optimizer
description: Comprehensive SEO (Search Engine Optimization) guidance to help websites rank higher on Google search results. Use this skill whenever the user mentions SEO, search engine optimization, ranking on Google, growing organic traffic, writing SEO-optimized content, auditing a website, keyword research, on-page/off-page/technical SEO, Core Web Vitals, backlinks, or any request related to search rankings. Applies to writing new SEO-optimized content, auditing/optimizing existing pages, building an overall SEO strategy, or analyzing competitors.
---

# SEO Optimizer

This skill helps Claude perform SEO optimization following Google's current best practices (E-E-A-T, Core Web Vitals, Helpful Content) to sustainably improve search rankings — without resorting to tricks (black-hat techniques) that could get a site penalized.

## Core principles

1. **Users first, search engines second**: Google increasingly prioritizes genuinely helpful content for readers (Helpful Content System). Do not keyword-stuff.
2. **E-E-A-T**: Experience, Expertise, Authoritativeness, Trustworthiness — content should demonstrate real experience, expertise, authority, and trustworthiness.
3. **No "quick ranking hacks"**: Sustainable SEO takes time (usually 3-6+ months). Be cautious about / decline requests for black-hat techniques (link farms, cloaking, unmoderated mass PBN spam, etc.).
4. **Prioritize by impact**: Technical SEO (can it be indexed at all) → Quality content → On-page → Off-page/backlinks.

## Workflow

Identify which stage the user is at, then go to the corresponding section:

### A. Writing new SEO-optimized content
→ Read `references/onpage-content.md`. Always ask/confirm first: target keyword, search intent, target audience, desired length.

### B. Auditing / optimizing an existing page
→ Read `references/audit-checklist.md`. If a URL is given, use web_fetch to inspect the actual page before auditing (title, meta, headings, load speed, mobile-friendliness...).

### C. Keyword research
→ Read `references/keyword-research.md`. Use web_search to survey the real intent currently ranking for that keyword (see what type of content Google is prioritizing in results).

### D. Technical SEO (speed, indexing, sitemap, URL structure...)
→ Read `references/technical-seo.md`.

### E. Off-page / Backlinks
→ Read `references/offpage-linkbuilding.md`.

### F. Overall SEO strategy / planning
→ Combine all sections above. Start with: business goals, competitors, available resources (time, budget, team).

## Response principles

- Always explain **why** a recommendation matters (based on how Google actually works), not just list tasks to do.
- When current data might be uncertain (Google's algorithm changes constantly), **web_search** to verify the latest information from Google Search Central before giving specific technical advice (e.g., Core Web Vitals thresholds, recent algorithm updates).
- For requests to write SEO-optimized articles: create an actual file (.md or .docx depending on context) rather than just replying in chat, since this is content the user will reuse/publish.
- Always remind the user that SEO is a long-term process; avoid promising "top ranking in X days."

## Reference files

- `references/onpage-content.md` — Writing SEO-optimized content: structure, title/meta, headings, internal links, length, E-E-A-T
- `references/keyword-research.md` — How to research and select keywords, analyze search intent
- `references/technical-seo.md` — Core Web Vitals, crawling/indexing, sitemap, robots.txt, schema markup, mobile-first
- `references/audit-checklist.md` — Comprehensive checklist for auditing an existing page/site
- `references/offpage-linkbuilding.md` — Building quality backlinks, avoiding penalties