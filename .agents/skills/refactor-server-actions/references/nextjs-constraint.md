# Why "importing multiple Server Actions into one Client Component" breaks Vercel deploys

## What's confirmed (via independent, real-deploy bisection)

A community investigation (additive bisection + reverse bisection, real Vercel deploys at
every step — local builds do not reproduce it) isolated the exact trigger:

> A Client Component (`"use client"`) importing **more than one individually-exported
> Server Action**, whether from one file or split across several `"use server"` files,
> causes the Vercel build to fail silently at the output-deploy stage: "Deploying
> outputs…" hangs, the build produces zero output artifacts, and the Builds record on
> Vercel comes back empty (sometimes surfaced as `NEXT_MISSING_LAMBDA`).

Key findings from that bisection, in order:
1. A Client Component importing 6 named Server Actions from one `actions.ts` -> fails.
2. Same 6 functions with `"use server"` removed (plain functions) -> succeeds. Confirms
   Server Actions specifically (not the functions' code) are the trigger.
3. Restoring them as 6 real Server Actions in one file -> fails again.
4. **Splitting across 3 separate `"use server"` files, still 6 total named exports
   imported into the same Client Component -> still fails.** This rules out file count
   or folder organization as the fix -- it is *not* solved by moving actions into more
   files.
5. Consolidating into **one exported dispatcher function** that switches internally to
   private (non-exported) functions -> deploy succeeds.

This was reproduced identically on Next.js 15.5.20 and 16.1.6, so it isn't tied to one
specific version. The person who found it did not have access to `@vercel/next` internals,
so the exact mechanism inside the builder isn't confirmed -- only the reproducible trigger
and fix are.

## What this means for a refactor

- Reorganizing a `"use server"` file into a `get/post/put/delete` folder structure (this
  skill's Step 4) is good for code organization but **does not by itself fix this class of
  deploy failure**, since the bug is about the *Client Component's import surface*, not
  file layout.
- The fix that's actually verified to work is the **dispatcher pattern** in Step 5: only
  one exported Server Action per domain reaches any given Client Component; everything
  else stays as private, non-exported functions called internally by that one dispatcher.
- This constraint is specifically about **Client Components**. Server Components, route
  handlers, and other server-only code calling multiple named Server Actions directly have
  not been reported as affected -- only apply the dispatcher pattern where a Client
  Component is doing the importing.

## If the user's error differs

If the user is hitting a *different* error message (e.g. TypeScript errors, ESLint rule,
ordinary ESM import limits, or one of the various documented Next.js Server Action GitHub
issues about "Failed to find Server Action" / stale deployments / skew protection), don't
assume it's this same bug -- ask for their exact error text and Next.js/Vercel version, and
treat their own reproduction as authoritative over this reference if it conflicts.