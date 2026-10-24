---
name: refactor-server-actions
description: Refactor a Next.js "use server" actions file that has many exported Server Actions into a folder-per-domain structure split by HTTP-style intent (get/post/put/delete), one action per file. Use this whenever the user wants to split/reorganize/refactor Next.js Server Actions (actions.ts, actions.js, or similar "use server" files) into folders, mentions having "too many server actions in one file", asks to fix an error about importing too many Server Actions into one Client Component ("use client") file, or wants all imports across the codebase updated after moving/splitting actions. Also trigger if the user pastes a "use server" file with multiple exported async functions and asks to organize/clean it up.
---

# Refactor Next.js Server Actions into get/post/put/delete folders

## What this skill does

Takes a single `"use server"` file with many exported Server Actions (e.g. `actions.ts`
with `actionOne`, `actionTwo`, ...) and splits it into a folder structure like:

```
profiles/
  get/
    getProfile.ts
    getProfileList.ts
  post/
    createProfile.ts
  put/
    updateProfile.ts
  delete/
    deleteProfile.ts
```

It also fixes the real Next.js constraint the user is hitting: **a Client Component
("use client") file should not import too many Server Actions directly from a single
module**, and rewrites every import site across the codebase to point at the new files.

Read `references/nextjs-constraint.md` before starting if you (Claude) are not certain
why the "importing more than N actions from one file" error happens, so you explain it
correctly and don't invent a wrong root cause.

## Step-by-step workflow

### 1. Discover the source file(s)

- Find the target `"use server"` file(s) — usually `actions.ts` / `actions.js` inside
  an app/feature/domain directory (e.g. `app/profiles/actions.ts`,
  `features/profiles/actions.ts`).
- If the user didn't specify a path, search the repo for files starting with
  `"use server"` that export multiple functions:
  ```bash
  grep -rl '^"use server"' --include='*.ts' --include='*.tsx' .
  ```
- Read the full file. List every exported function, its name, params, return type,
  and any shared imports/helpers/types used inside it.

### 2. Determine the domain folder name

- The domain folder name comes from the feature the actions belong to (e.g. `profiles`,
  `orders`, `comments`) — usually the parent directory name, or ask the user if it's
  ambiguous. Don't guess silently if there are multiple plausible domains mixed
  together in one file — flag that split too.

### 3. Classify every action into get / post / put / delete

Classify by semantics, not just name prefix — read what the function body actually does
(query vs. mutate vs. create vs. remove), then confirm with naming convention:

| Folder   | Semantics                              | Common name patterns                          |
|----------|-----------------------------------------|------------------------------------------------|
| `get`    | Reads/fetches data, no mutation         | `get*`, `fetch*`, `list*`, `find*`, `search*`  |
| `post`   | Creates a new resource                  | `create*`, `add*`, `insert*`, `register*`      |
| `put`    | Updates/replaces an existing resource   | `update*`, `edit*`, `set*`, `toggle*`, `save*` (when saving an existing record) |
| `delete` | Removes a resource                      | `delete*`, `remove*`, `destroy*`               |

If a name and its actual behavior disagree (e.g. `getOrCreateProfile` that also writes),
classify by the dominant side effect and note the ambiguity to the user rather than
silently picking one.

If a single action genuinely does two things (e.g. update-then-fetch), prefer keeping it
whole in whichever folder matches its primary externally-visible effect, and mention the
tradeoff instead of splitting the function body itself.

### 4. Create one file per action

For each action, create `domain/<verb-folder>/<actionName>.ts` (match the user's existing
extension, `.ts` unless the codebase uses `.tsx`/`.js`). Each file:

- Starts with `"use server"` on its own line at the top.
- Contains only the imports that function actually needs (don't drag the whole original
  import block into every file — trim per-file).
- Preserves the original function body, types, and JSDoc/comments untouched — this is a
  structural move, not a rewrite of logic.
- Keeps the original export name unless the user asks to rename.

If several actions share a non-trivial helper (a db client, a zod schema, a type), put
that shared piece in `domain/shared.ts` (or `domain/types.ts`) and import it from each
action file, rather than duplicating it everywhere.

### 5. Fix the "too many actions imported into one client file" problem

Read `references/nextjs-constraint.md` for the full explanation before doing this step.
**Splitting actions into separate files/folders alone does NOT fix this** — it has been
independently bisected (real Vercel deploys, additive/reverse bisection, reproduced on
both Next 15.5.20 and 16.1.6) that the trigger is a Client Component importing *more than
one individually-exported Server Action*, regardless of how many files those actions live
in. A Client Component importing 6 named exports from 3 separate `"use server"` files
still fails the same way as importing 6 from 1 file.

**Verified fix: consolidate into a single exported dispatcher per Client Component usage
site.** For each domain, keep the per-action files from Step 4 (`get/getProfile.ts`,
`post/createProfile.ts`, etc.) as **internal, non-exported-to-client** implementations,
then add one gateway file that is the *only* thing the Client Component imports:

```ts
// profiles/actions.gateway.ts   ("use server")
import { getProfile } from "./get/getProfile";
import { getProfileList } from "./get/getProfileList";
import { createProfile } from "./post/createProfile";
import { updateProfile } from "./put/updateProfile";
import { deleteProfile } from "./delete/deleteProfile";

type ProfileAction =
  | { type: "getProfile"; payload: { id: string } }
  | { type: "getProfileList"; payload: Record<string, never> }
  | { type: "createProfile"; payload: CreateProfileInput }
  | { type: "updateProfile"; payload: UpdateProfileInput }
  | { type: "deleteProfile"; payload: { id: string } };

export async function runProfileAction(action: ProfileAction) {
  switch (action.type) {
    case "getProfile": return getProfile(action.payload.id);
    case "getProfileList": return getProfileList();
    case "createProfile": return createProfile(action.payload);
    case "updateProfile": return updateProfile(action.payload);
    case "deleteProfile": return deleteProfile(action.payload.id);
  }
}
```

```ts
// page.tsx  ("use client")
import { runProfileAction } from "./profiles/actions.gateway";
// only ONE export imported — this is what makes the deploy succeed
```

Rules for this step:
- One gateway/dispatcher file per **domain per Client Component usage pattern** — don't
  make one giant dispatcher for the whole app; scope it to what a given client file
  actually needs (e.g. `profiles/actions.gateway.ts`, `orders/actions.gateway.ts`).
- The per-action files under `get/`, `post/`, `put/`, `delete/` should generally stop
  being imported directly by any Client Component once a gateway exists for that domain.
  They're still fine to export normally for use by Server Components, route handlers, or
  other server-side callers — the failure mode is specifically Client Component → multiple
  individually-exported Server Actions.
- If a Client Component only ever needs a single action from a domain, it's fine to import
  that one action file directly — the bug is about *multiple* named Server Action exports
  landing in one client-imported module graph, not about using per-file actions at all.
- Keep the dispatcher's `switch` thin — it should only route, not contain business logic
  (business logic stays in the individual `get/post/put/delete` files from Step 4).

### 6. Find and update every other import site

- Search the whole repo for imports of the old file:
  ```bash
  grep -rn "from ['\"].*actions['\"]" --include='*.ts' --include='*.tsx' .
  ```
  and specifically for each old action name to catch renamed/aliased imports.
- For every match in a **Client Component**, rewrite the import to pull the domain's
  `runXAction` dispatcher (Step 5) and update call sites to pass `{ type, payload }`
  instead of calling the old named function directly, preserving any `as` aliases.
- For every match in a **Server Component, route handler, or other server-only file**,
  it's fine (and simpler) to import the specific action directly from its new
  `get/post/put/delete` file path — the dispatcher is only required for Client Components.
- Don't forget non-component call sites: route handlers, other server actions calling
  each other, tests, and `revalidatePath`/`redirect` wrapper utilities.

### 7. Remove the old file and verify

- Delete the original `actions.ts` once every export has a new home and every import site
  is updated — unless the user wants it kept temporarily as a re-export shim
  (`export * from "./profiles/get/getProfile"` etc.) for a gradual migration; ask if
  unsure.
- Run the project's type checker / linter if available (`tsc --noEmit`, `next lint`) to
  catch any missed import or a function that used a sibling function from the same file
  (which now needs an explicit import).
- Summarize for the user: how many actions were moved, the final folder tree, and every
  file whose imports were updated.

## Notes

- Never change action logic, validation, or return shapes during this refactor — it's a
  pure move/split. If you spot a real bug while reading, mention it separately instead of
  fixing it inline.
- Keep folder/file names in the same casing convention the project already uses
  (camelCase file names are typical for Next.js action files, but match what's there).
- If the project uses barrel files (`index.ts`) per domain today, keep that pattern
  consistent for the new `get/post/put/delete` subfolders too.