# SUMMARY — Junction Frontend (Pohjola Post / KoJaPu)

A Next.js 16 App Router front-end for an AI-assisted **newsroom platform**. It presents a Nordic
broadsheet-style news site ("Pohjola Post", branded "KoJaPu" on the About page) and provides a
back-office authoring suite where editors publish articles, attach video footage, run semantic
search, and generate AI-dubbed multilingual video tracks.

Everything here is the **client/UI layer**. It talks to a separate Python backend (default
`http://localhost:5605/api`) that owns the database, embeddings, and the dubbing pipeline.

---

## Core capabilities

| Area | What exists |
| --- | --- |
| **Editorial front page** | `app/page.tsx` — LIVE WIRE meta bar, semantic search bar, asymmetric 5:7 hero grid (3 "Priority Wire" stubs + 1 lead story), filterable "Dispatches from Finnish Cities" grid (6 city bureaus), newsletter signup, footer. |
| **Hybrid live/mock data** | Real Helsinki articles come from `GET /articles`; the other 5 bureaus (Oulu, Tampere, Turku, Rovaniemi, Espoo) are curated mock `RegionalDispatch` cards. If the API is offline/empty, the whole feed falls back to mock data. |
| **Semantic search** | `SemanticSearchBar` calls `POST /articles/search` (pgvector cosine similarity, `intfloat/multilingual-e5-large`, 1024-dim vectors). Debounced 350 ms, top-6 results, `min_similarity` 0.5, shows match % + raw score/distance. On API failure it scores a 6-item multilingual (VI/EN/FI) mock corpus locally. |
| **Article CRUD** | `app/create-article/page.tsx` — react-hook-form authoring (title/author/language/content, 6 languages), normalised list from any response shape, client search filter, edit modal, delete via a shared confirmation modal. |
| **Video upload** | `EditArticleModal`: multi-file drag & drop, optimistic local preview (blob URL) then real `POST /videos` multipart upload linked to the article, existing DB videos merged and playable. |
| **AI dubbing** | `EmbedDubbingModal`: 27 languages split into Coqui **XTTS-v2** (voice cloning, 16 langs) and **Microsoft Edge-TTS** (11 langs). Runs `POST /videos/process-stream` with SSE progress parsed inside Axios `onDownloadProgress`, live % + stage text, `AbortController` cancel. |
| **Video theater** | `app/videos/[id]/page.tsx`: HTML5 player, language track switcher (original + every completed dubbed version), time-coded transcript segments (`{start, end, text}`), breadcrumb, dubbing launch. |
| **Responsive** | Desktop navbar + separate mobile top bar / bottom tab bar, breakpoint-aware layout across phone / tablet / desktop. |

---

## Tech stack

- **Next.js 16.4.2** (App Router, Turbopack, `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`)
- **React 19.3**, TypeScript 5 (strict)
- **TanStack Query 5** — all server state (queries, mutations, invalidation)
- **Axios** — HTTP + SSE-style streaming
- **framer-motion 14** — layout/enter-exit animation, modals
- **react-hook-form 7** — article authoring
- **Tailwind CSS 4** via `@tailwindcss/turbopack` loader (no PostCSS config)
- **pnpm**, ESLint 9 (`eslint-config-next`)

---

## Layout

```
app/                      # single source of truth
  page.tsx                # front page
  layout.tsx              # root layout: QueryProvider > DynamicModalProvider > nav + <main> + DynamicPopupModal
  globals.css             # Tailwind v4 @theme tokens, CSS vars, Newsreader/Inter fonts
  about/page.tsx          # mission page
  create-article/page.tsx # authoring + dispatch catalogue (Newsroom Desk)
  videos/[id]/page.tsx    # video theater
  components/
    navigation/           # server wrapper + desktop/mobile clients + NavItem types
    search/               # SemanticSearchBar
    modal/                # DynamicPopupModal, EditArticleModal, EmbedDubbingModal
  context/                # DynamicModalContext (+ Loader/Notification/Progressbar — see Notes)
  providers/QueryProvider.tsx
  hooks/                  # useArticles, useVideos, useArticleSearch, useDebounce, query/useFolderProgress
  services/api.ts         # axios client + articleApi + videoApi
  types/api.ts            # article, video, dubbing, RegionalDispatch schemas
  types/article.ts        # semantic search request/response schemas
constants/design-tokens.ts  # colors, type scale, spacing, radii, layout tokens
services/ hooks/ types/     # 1-line re-export shims of app/* (see Notes)
public/                   # boilerplate SVGs
.agents/skills/           # redesign, refactor-server-actions, refactor-skill, seo-optimizer
```

`tsconfig.json` maps `@/*` → repo root, so imports use `@/app/...`.

---

## Backend contract

`NEXT_PUBLIC_API_URL` is normalised so a trailing `/api` is appended if missing; default fallback is
`http://localhost:5605/api`. Media paths are resolved to `${apiOrigin}${file_path}` for the player.
Both service modules install a response interceptor that logs method, URL, status, and body.

**Articles** — `GET /articles` · `GET /articles/{id}` (includes `videos[]`) · `POST /articles` ·
`PUT /articles/{id}` · `DELETE /articles/{id}` · `POST /articles/search`
(`{query, limit, min_similarity}` → `{query, total_results, results[]}` with `similarity_score`, `distance`).
Article responses carry `has_embedding`, `original_language`, `author`, `created_at`.

**Videos** — `POST /videos` (multipart: `file`, optional `article_id`, `original_language`) ·
`GET /videos` · `GET /videos/{id}` · `POST /videos/process` (blocking) ·
`POST /videos/process-stream` (progress events `init → audio → stt → translate → tts_prepare → tts →
merge → completed | error`, each `{stage, percent, message, error?, data?}`) ·
`GET /videos/{id}/dubbed` · `DELETE /videos/{id}/dubbed/{lang}`.
Dubbed versions store transcript text/JSON, audio path, video path, `status`, `is_default_file`.

---

## Design system

Dark-accent-on-light broadsheet palette: `primary #000000` / `on-primary #ffffff` on
`background #f9f9f9`, a `surface-container-lowest → highest` ramp (`#ffffff → #e2e2e2`),
`on-surface #1a1c1c`, `outline #747878`, error `#ba1a1a`.
**Newsreader** (serif headlines) + **Inter** (UI/body). Tokens exist twice — CSS custom properties in
`app/globals.css` (consumed as Tailwind utilities: `bg-surface-container-low`, `px-gutter-mobile`,
`font-headline`) and mirrored in `constants/design-tokens.ts`. `max-w-[1440px]` container, 24/16 px
gutters, `rounded-xl/2xl` cards, 20px header, 64px mobile bottom nav with `pb-20 md:pb-0` body offset.

---

## State & data-fetching conventions

Query keys are namespaced (`articleKeys`, `videoKeys` with `lists` / `detail` / `dubbed`). Mutations
invalidate the relevant keys — dubbing invalidates all three video keys, article create/delete
invalidates lists and removes the detail entry. `useArticles` uses `staleTime: 0` +
`refetchOnMount: 'always'` + refetch on window focus so the front page stays live.
`useProcessDubbingStream` takes `{payload, onProgress, signal}` and maps SSE events to local modal
progress state (component state, not cache). Destructive actions route through
`useDynamicModal().openModal({ title, message, variant, onConfirm })`, which handles its own busy
state and keeps the modal open on a thrown error.

---

## Running it

```bash
pnpm install
NEXT_PUBLIC_API_URL=http://localhost:5605/api pnpm dev   # variable is optional; falls back to that URL
pnpm build && pnpm start
```

There is no `.env.example` checked in and no test runner configured. `README.md` is still the
`create-next-app` boilerplate — this file is the actual overview.

---

## Known gaps / cleanup candidates

- **Duplicate shim directories**: root `services/`, `hooks/`, `types/` are `export * from '../app/...'`
  re-exports. Nothing imports them (`@/services`, `@/hooks`, `@/types` have zero call sites) — delete
  or make them the canonical layer, don't keep both.
- **Unused contexts**: `LoaderContext`, `NotificationContext`, `ProgressbarContext` are defined but
  never mounted or consumed; `ProgressbarContext` depends on `useFolderProgress`, a stub that
  returns `{data: undefined, isLoading: false}` and ignores its argument. Folder progress is not wired
  to any real endpoint.
- **Mock-heavy surfaces**: hero "Priority Wire" cards, 5 of 6 bureau cards, newsletter submit
  (local-only success toast), and the search fallback corpus are all hardcoded. `isRealData` is the
  only live/mock discriminator.
- **Cards aren't navigable**: front-page dispatch cards advertise "Read full dispatch" but have no
  link/handler, and there is no article detail route — only `/videos/[id]`.
- **Brand inconsistency**: About page and metadata say *KoJaPu*, nav/layout say *Pohjola Post*, and
  About uses utilities backed by undefined theme tokens (`border-border`, `text-text-secondary`,
  `bg-surface-subtle`) and hardcodes `#29ecdb` cyan plus default sans headings instead of
  `font-headline`/Newsreader — so it reads differently from the rest of the app and silently loses
  those styles.
- **Search UX**: dropdown opens only on input/focus and results are not clickable; ESC/outside-click
  dismissal is the only interaction.
- **`videoApi.upload` default language** is `vi`, while the authoring form defaults to `vi` too but
  the UI offers six language choices — worth confirming the intended default.
