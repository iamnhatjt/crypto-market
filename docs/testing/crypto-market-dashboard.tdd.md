# TDD Evidence Report — Crypto Market Dashboard

**Source plan:** none on disk. Journeys were derived during this run from
`docs/INTERVIEW_TASK.md` and the plan agreed in conversation (React + CRA,
Tailwind, axios, Playwright as the only test runner).

**Test runner:** Playwright 1.62.1 (`npm run test:e2e`). Package manager: npm 11.17.0.
Node 26.5.0. No Jest/RTL — the CRA scaffolding for it was removed deliberately.

**Branch:** `main`. All checkpoint commits below are reachable from `HEAD`.

---

## User journeys

| # | Journey | Spec |
|---|---|---|
| 1 | As a crypto watcher, I want to see the top 20 coins by market cap with icon, name, symbol, price and 24h change, so that I can scan the market at a glance. | `e2e/dashboard.spec.ts` |
| 2 | As a crypto watcher, I want to filter by typing a coin name or symbol, so that I can find one coin without scrolling. | `e2e/search-sort.spec.ts` |
| 3 | As a crypto watcher, I want to sort by price or 24h change in either direction, so that I can see the biggest movers and the most valuable coins. | `e2e/search-sort.spec.ts` |
| 4 | As a crypto watcher on a flaky connection, I want clear loading, error and empty states with a way to retry, so that I am never left staring at a blank screen. | `e2e/edge-cases.spec.ts` |
| 5 | As a crypto watcher on any device, I want the grid to reflow to my screen width, so that it is usable on a phone and dense on a desktop. | `e2e/responsive.spec.ts` |
| 6 | As a crypto watcher, I want to switch between light and dark themes and have my choice remembered. | `e2e/theme.spec.ts` |
| 7 | As a crypto watcher, I want repeat visits to reuse recently fetched data, so that the dashboard is instant and does not get rate-limited — while still being able to force a refresh. | `e2e/caching.spec.ts` |
| 8 | As a crypto watcher, I want to page beyond the top 20, so that I can look further down the market without loading thousands of coins at once. | `e2e/pagination.spec.ts` |
| 9 | As a crypto watcher, I want sorting by market cap to reorder the whole market rather than just the rows on screen, so that "lowest market cap" means the actual bottom of the market. | `e2e/sort-order.spec.ts` |
| 10 | As a crypto watcher, I want to choose how many coins a page shows, so that I can scan a short list or a long one. | `e2e/page-size.spec.ts` |
| 11 | As a crypto watcher sorting to the bottom of the market, I want coins with no rank to display sensibly, so that the dashboard does not show placeholder junk or contradict itself. | `e2e/unranked-coins.spec.ts` |

---

## Task report

### Task 1 — Scaffold CRA + TypeScript + Tailwind

Infrastructure only; no business logic, so no RED gate applies.

- **Command:** `CI=true npm run build`
- **Output:** `Compiled successfully.` — `60.01 kB` JS, `1.68 kB` CSS gzipped
- **Also verified:** the emitted CSS contains Tailwind utilities
  (`grep -o 'min-h-screen\|text-3xl\|font-bold\|bg-slate-100'` matched all four)
- **Guarantees:** `react-scripts` 5.0.1 compiles on Node 26, and Tailwind is correctly
  wired through `postcss.config.js`.
- **Commit:** `e449607 chore: scaffold CRA + typescript + tailwind`

Notes worth recording: `create-react-app@5.0.1` refuses to run when a newer release
exists, so `5.1.0` was used (it prints a deprecation notice, then scaffolds). The
template pinned `typescript@4.9.5` on its own, which resolved the peer-dependency risk
identified in planning.

### Task 2 — Write the failing suite (RED)

- **Command:** `npx playwright test --project=desktop-chromium --timeout=8000`
- **Output:**
  ```
  Running 43 tests using 4 workers
    43 failed
  ```
- **Failure reason:** `element(s) not found` waiting for `[data-testid=coin-card]` — the
  missing implementation. The dev server compiled and served, and the tests navigated
  and executed, so this is a genuine runtime RED and not broken setup.
- **Commit:** `a26ca25 test: add playwright e2e suite covering all dashboard journeys (RED)`

### Task 3 — Implement the dashboard (GREEN)

- **Command:** `npx playwright test`
- **Output:** `81 passed, 5 skipped (13.4s)`
- **Also verified:** `npx tsc --noEmit` clean; `CI=true npm run build` compiled.
- **Guarantees:** all seven journeys above.
- **Commit:** `106ba78 feat: implement the crypto market dashboard (GREEN)`

One test was corrected during this task rather than accommodated by the implementation:
`never leaks NaN, undefined or null` used `not.toContain('nan')`, which fails on the
correct output because "Bi**nan**ce Coin" contains that substring. Tightened to
`/\bnan\b/`. This was a test defect, not a relaxation of the guarantee.

One implementation detail was changed to serve the test contract: the decorative ▲/▼
arrow moved out of the `coin-change` element so that test id reads the percentage alone.

### Task 4 — Live-API verification, which found a bug

Every spec mocks the network, so the app was additionally driven against the real
CoinGecko endpoint in a headless browser.

- **Result:** 1 network request, 20 cards, real data (`Bitcoin / BTC / $80,819.00 / +4.68%`)
- **Bug found:** stablecoins report changes like `-0.0004%`, which rendered as a red
  `▼ -0.00%` — a loss the user can see did not happen.
- **Second issue found:** several coins ship white-on-transparent logos (XRP, WhiteBIT),
  invisible against the white card in light mode and the dark card in dark mode.

### Task 5 — Fix the rounding bug (RED → GREEN)

- **RED command:** `npx playwright test e2e/dashboard.spec.ts --project=desktop-chromium`
- **RED output:** `3 failed, 10 passed`
  - failed: tiny-negative (`-0.0004`), tiny-positive (`0.0004`), exactly-zero
  - the fourth new test (`-0.006` → `-0.01%`, trend `down`) passed immediately, which
    confirms the new tests bracket the bug rather than restating existing behaviour
- **Fix:** `formatPercent` and `trendOf` both derive from the value rounded to display
  precision, so anything that displays as zero is unsigned and neutral.
- **GREEN command:** `npx playwright test`
- **GREEN output:** `89 passed, 5 skipped (14.6s)`
- **Commit:** `caae21d fix: treat a 24h change that rounds to zero as flat, not a loss`

### Task 6 — Environment configuration (refactor, no RED gate)

Extracting the base URL, page size, cache TTL, request timeout and an optional API key
into `src/config/env.ts` is behaviour-preserving at default config: there is no new
user-visible behaviour, so there is no honest RED state to show. This is the refactor
stage of the cycle, and the bar is that the suite stays green.

Instead of a fabricated RED, three regression guards were added on the outgoing request
(`e2e/api-request.spec.ts`). They passed on first run, which is the expected result for a
guard over existing behaviour — recorded here as such rather than presented as a TDD
cycle.

- **Command:** `npx playwright test`
- **Output:** `95 passed, 5 skipped (14.4s)`
- **Also verified:** `npx tsc --noEmit` clean; `Compiled successfully.`

Because CRA inlines `REACT_APP_*` at build time, non-default values cannot be exercised
from the committed suite without a rebuild. They were verified by running a second dev
server with overrides and inspecting the real outgoing request:

| Env override | Observed | Verdict |
|---|---|---|
| `REACT_APP_COINS_PER_PAGE=5` | request sent `per_page=5`; 5 cards rendered | applied |
| `REACT_APP_COINGECKO_API_KEY=test-key-abc123` | request carried `x-cg-demo-api-key: test-key-abc123` | applied |
| `REACT_APP_COINS_PER_PAGE=not-a-number` | request sent `per_page=20` | fell back, no `NaN` |
| *(key unset, shipped default)* | no `x-cg-demo-api-key` header present at all | correct |

The last two matter most: a malformed number must not reach the API as `per_page=NaN`,
and an empty key must not be sent as an empty header, because CoinGecko rejects that
rather than ignoring it.

A note on process, recorded because it cost a debugging cycle: an intermediate run
reported `95 failed`. The cause was running `npx playwright test` twice back to back —
the second run could not bind port 3000 while the first run's CRA dev server was still
shutting down, so nothing was being served. No application defect; the same suite passed
immediately against a stable server. Worth knowing when reading CI logs.

### Task 7 — Dead-code cleanup (refactor, no RED gate)

Ran `npx knip@5` to find unused code rather than eyeballing it.

- **Unused files:** none. **Unused dependencies:** none. **Unresolved imports:** none.
- **Unused exports:** 8, all cleaned by dropping the `export` keyword — they were
  consumed inside their own module, not by anything else:
  `DEFAULT_BASE_URL`, `DEFAULT_PER_PAGE`, `DEFAULT_CACHE_TTL_MS`,
  `DEFAULT_REQUEST_TIMEOUT_MS`, `AppConfig` (`src/config/env.ts`),
  `CACHE_TTL_MS` (`src/lib/cache.ts`), `THEME_STORAGE_KEY` and
  `resolveInitialTheme` (`src/hooks/useTheme.ts`).

Two files have no inbound reference but were deliberately kept:
`src/react-app-env.d.ts` is recreated by `react-scripts` on every start, and
`public/robots.txt` is fetched by crawlers at its URL rather than imported.

`THEME_STORAGE_KEY` deserved more than deletion. The same literal is hardcoded in
`public/index.html`, whose pre-paint script cannot import a constant because it runs
before any bundle loads. Deleting the constant would have removed the only in-code
record of that coupling, so instead both sides now cross-reference each other and a
regression guard pins the literal — renaming it now fails a test rather than silently
reintroducing the light-mode flash.

- **Command:** `npx playwright test`
- **Output:** `97 passed, 5 skipped (17.3s)`
- **Also verified:** `npx tsc --noEmit` clean; `Compiled successfully.`; `knip` reports
  nothing.

### Task 8 — Server-side pagination (RED → GREEN)

The first change since the initial build with genuinely new user-visible behaviour, so a
real RED gate applies.

- **RED command:** `npx playwright test e2e/pagination.spec.ts --project=desktop-chromium`
- **RED output:** `Running 13 tests` → `13 failed`, all `element(s) not found` on the
  pager controls. Committed at `2c0f2a4` before any implementation existed.
- **Implementation:** `fetchCoins(page)` with a per-page in-flight map and a per-page
  cache key; `useCoins(page)` gaining `hasNextPage`; a new `Pagination` component; `App`
  owning page state and scrolling to top on change.
- **GREEN output:** `17 passed` on the spec, `131 passed, 5 skipped` on the full suite.
- **Commit:** see below.

A second RED→GREEN cycle followed inside the same task, again found by looking at the
rendered page rather than the tests: with page 2 on screen the header still read
"Top 20 cryptocurrencies" and the pager only said "Showing 20 coins".

- **RED:** 4 failed / 13 passed — rank-range summary absent, header still claimed "Top 20"
- **Fix:** the pager now reports `Ranks 21–40 by market cap`, derived from the fetched
  coins' `marketCapRank` rather than from `page * perPage`, because arithmetic would
  misreport a short final page. The header only claims "Top N" on page 1.
- **GREEN:** `17 passed`

One test was corrected rather than accommodated: `locator('header')` hit a strict-mode
violation across 21 elements, because every `CoinCard` renders its own `<header>`.
Retargeted at the `banner` landmark. Test defect, not a weakened guarantee.

Two fixture exports (`coinsPage2Fixture`, `coinsPage3Fixture`) were flagged by knip after
this task and made module-internal; they are consumed through `pagedFixtures`.

**Live verification.** Paging was driven against the real CoinGecko API:

| Step | Observed |
|---|---|
| Page 1 | first coin Bitcoin, rank #1 |
| Next | first coin Bitcoin Cash, rank #21 — correct continuation |
| Previous | back to Bitcoin, and pages requested were `1, 2` — no repeat request |

### Task 9 — API-backed market cap sorting (RED → GREEN)

The API was probed **before** writing any code, because the obvious implementation is a
trap. CoinGecko's `order` accepts `market_cap_asc|desc`, `volume_*` and `id_*`, but for
price and 24h change it returns **200 with plain market-cap ordering** instead of an error:

| `order` sent | HTTP | First three coins | Verdict |
|---|---|---|---|
| `market_cap_desc` | 200 | bitcoin, ethereum, tether | honoured |
| `market_cap_asc` | 200 | namecoin, primecoin, whitecoin | honoured |
| `volume_desc` | 200 | tether, bitcoin, usd-coin | honoured |
| `price_desc` | 200 | bitcoin, ethereum, tether | **ignored** |
| `price_asc` | 200 | bitcoin first | **ignored** |
| `percent_change_24h_desc` | 200 | bitcoin, ethereum, tether | **ignored** |

Wiring all three sort fields to the API would have shipped two silently broken sorts. So
market cap goes to the API; price and 24h change stay local; `MarketsOrder` is narrowed to
the two working values so an ignored one cannot be sent by accident; and the UI labels the
scope.

- **RED:** `8 failed, 4 passed` (`1a8e5f6`). The 4 passes are pre-existing guarantees —
  price/change already never hit the API because `order` was hardcoded — kept in the spec
  because they must continue to hold.
- **GREEN:** `12 passed` on the spec, `155 passed, 5 skipped` overall (`408cadd`).

### Task 10 — Page-size selector (RED → GREEN), plus a nullable-rank bug

- **RED:** `13 failed` (`8fc5aed`) — no `page-size` control existed.
- **Implementation:** `per_page` threaded through `fetchCoins`/`useCoins`, included in
  both the cache key and the in-flight key, with page reset on change.

Driving it against the live API then exposed a **typing bug**:

```
order=market_cap_asc&per_page=3
  namecoin   market_cap_rank=None  market_cap=0.0
  primecoin  market_cap_rank=None  market_cap=0.0
```

`CoinMarketResponse` declared `market_cap_rank: number`. Two visible defects followed: a
dangling `#` on every card, and the pager reading *"No coins on this page."* above 50
rendered coins.

- **RED:** `3 failed, 4 passed` (`083278f`)
- **Fix:** the rank is `number | null` in both the wire and domain types, the mapping
  guards it, the badge renders only when a rank exists, and `Pagination` now distinguishes
  an empty page from a page whose coins carry no rank.
- **GREEN:** `20 passed` across both specs, `195 passed, 5 skipped` overall (`1ea0fcc`).

### Task 11 — Move the page-size control into the pager (RED → GREEN)

Feedback: the selector belonged with the pagination controls, not crowding the search and
sort row.

- **RED:** `2 failed, 13 passed` — placement and accessible-name assertions.
- **GREEN:** `15 passed` on the spec, `199 passed, 5 skipped` overall.

Two helper interfaces flagged by knip after this task were made module-internal.

---

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | One card renders per coin returned by the API | `dashboard.spec.ts:renders one card per coin` | e2e | PASS |
| 2 | Every card shows icon, name, symbol, price and 24h change | `dashboard.spec.ts:each card shows an icon…` | e2e | PASS |
| 3 | Prices ≥ $1 use thousands separators and two decimals | `dashboard.spec.ts:formats prices at or above one dollar` | e2e | PASS |
| 4 | Sub-dollar prices keep precision instead of collapsing to $0.00 | `dashboard.spec.ts:keeps sub-dollar prices readable` | e2e | PASS |
| 5 | 24h change is signed to two decimals | `dashboard.spec.ts:shows a signed, two-decimal percentage` | e2e | PASS |
| 6 | A gain renders green (green channel dominates computed colour) | `dashboard.spec.ts:renders a positive 24h change in green` | e2e | PASS |
| 7 | A loss renders red (red channel dominates computed colour) | `dashboard.spec.ts:renders a negative 24h change in red` | e2e | PASS |
| 8 | A null 24h change renders "—", never NaN | `dashboard.spec.ts:renders a placeholder instead of NaN` | e2e | PASS |
| 9 | No `NaN`/`undefined`/`null` reaches the DOM | `dashboard.spec.ts:never leaks NaN, undefined or null` | e2e | PASS |
| 10 | A change rounding to zero is unsigned and neutral (3 cases) | `dashboard.spec.ts:changes that round to zero` | e2e | PASS |
| 11 | A change surviving rounding is still signed and coloured | `dashboard.spec.ts:still signs a change that survives rounding` | e2e | PASS |
| 12 | Search filters by unique name | `search-sort.spec.ts:filters to a single coin` | e2e | PASS |
| 13 | Search returns every name match ("bitcoin" → 2) | `search-sort.spec.ts:returns every coin whose name contains` | e2e | PASS |
| 14 | Search matches symbol when the name does not ("bnb") | `search-sort.spec.ts:matches on symbol` | e2e | PASS |
| 15 | Search ignores case and surrounding whitespace | `search-sort.spec.ts:ignores case` / `ignores surrounding whitespace` | e2e | PASS |
| 16 | Clearing the query restores the full list | `search-sort.spec.ts:restores the full list` | e2e | PASS |
| 17 | Price sorts correctly in both directions | `search-sort.spec.ts:orders by price descending` / `ascending` | e2e | PASS |
| 18 | 24h change sorts correctly in both directions | `search-sort.spec.ts:orders by 24h change descending` / `ascending` | e2e | PASS |
| 19 | Coins with a null change sort last in both directions | `search-sort.spec.ts:keeps coins with a missing 24h change last` | e2e | PASS |
| 20 | Market cap is the default order | `search-sort.spec.ts:falls back to market cap order` | e2e | PASS |
| 21 | Search and sort compose | `search-sort.spec.ts:search and sort apply together` | e2e | PASS |
| 22 | Skeletons show while the request is in flight | `edge-cases.spec.ts:shows skeleton placeholders` | e2e | PASS |
| 23 | Skeletons are replaced by real cards on arrival | `edge-cases.spec.ts:replaces the skeletons with real cards` | e2e | PASS |
| 24 | A 500 yields an error state with a retry action and no cards | `edge-cases.spec.ts:shows an error state with a retry action` | e2e | PASS |
| 25 | A 429 rate-limit yields the error state | `edge-cases.spec.ts:shows the error state when the API rate-limits` | e2e | PASS |
| 26 | Retry actually recovers and renders the grid | `edge-cases.spec.ts:recovers and renders the grid when retry succeeds` | e2e | PASS |
| 27 | A dropped connection yields the error state | `edge-cases.spec.ts:shows the error state when the connection drops` | e2e | PASS |
| 28 | No search match yields the empty state, not an error | `edge-cases.spec.ts:shows an empty state, not an error` | e2e | PASS |
| 29 | The empty state echoes the query back | `edge-cases.spec.ts:echoes the query back` | e2e | PASS |
| 30 | Clearing the query leaves the empty state | `edge-cases.spec.ts:leaves the empty state when the query is cleared` | e2e | PASS |
| 31 | Grid is 1/2/3/4 columns at 390/768/1024/1440px | `responsive.spec.ts:lays out N column(s)` | e2e | PASS |
| 32 | No horizontal overflow at 320px | `responsive.spec.ts:never scrolls horizontally` | e2e | PASS |
| 33 | Exactly one request on first load | `caching.spec.ts:fetches the market list exactly once` | e2e | PASS |
| 34 | A reload inside the TTL is served from cache | `caching.spec.ts:serves a reload from cache` | e2e | PASS |
| 35 | Refresh bypasses the cache | `caching.spec.ts:refresh bypasses the cache` | e2e | PASS |
| 36 | An expired cache entry triggers a re-fetch | `caching.spec.ts:re-fetches once the cached entry has expired` | e2e | PASS |
| 37 | Theme toggles to dark and back | `theme.spec.ts:toggles the document into dark mode` / `back to light` | e2e | PASS |
| 38 | Theme survives a reload | `theme.spec.ts:remembers the chosen theme across a reload` | e2e | PASS |
| 39 | The request carries vs_currency=usd, market_cap_desc, per_page=20, page=1, sparkline=false | `api-request.spec.ts:requests the top 20 USD markets` | e2e | PASS |
| 40 | `per_page` is always a positive integer, never NaN | `api-request.spec.ts:sends a numeric per_page` | e2e | PASS |
| 41 | No API key header is sent when no key is configured | `api-request.spec.ts:omits the API key header entirely` | e2e | PASS |
| 42 | The theme is stored under the exact key the pre-paint script reads | `theme.spec.ts:persists the theme under the key the pre-paint script reads` | e2e | PASS |
| 43 | The pager renders with page 1 active and previous disabled | `pagination.spec.ts:controls` | e2e | PASS |
| 44 | Next requests `page=N` and swaps in that page's coins | `pagination.spec.ts:requests the next page` / `sends the requested page number` | e2e | PASS |
| 45 | A short final page disables Next | `pagination.spec.ts:disables the next-page control on a short final page` | e2e | PASS |
| 46 | Pages cache independently; 1→2→1 issues exactly two requests | `pagination.spec.ts:caches each page separately` | e2e | PASS |
| 47 | A failing later page shows the error state and recovers on retry | `pagination.spec.ts:shows the error state when a later page fails` | e2e | PASS |
| 48 | Search and sort apply to the loaded page; the query survives a page change; the empty state names the page | `pagination.spec.ts:interaction with search and sort` | e2e | PASS |
| 49 | The pager reports the true market-cap rank range, including on a short page | `pagination.spec.ts:rank range summary` | e2e | PASS |
| 50 | Changing page scrolls back to the top | `pagination.spec.ts:scrolls back to the top` | e2e | PASS |
| 51 | `order=market_cap_desc` is sent on first load | `sort-order.spec.ts:sends order=market_cap_desc on first load` | e2e | PASS |
| 52 | Switching to low-to-high sends `order=market_cap_asc` | `sort-order.spec.ts:sends order=market_cap_asc` | e2e | PASS |
| 53 | The API's ordering is rendered, not re-sorted locally | `sort-order.spec.ts:renders the order the API returned` | e2e | PASS |
| 54 | Changing the global order resets to page 1 | `sort-order.spec.ts:goes back to page 1` | e2e | PASS |
| 55 | Each order caches separately | `sort-order.spec.ts:caches each order separately` | e2e | PASS |
| 56 | Price and 24h change never trigger a request | `sort-order.spec.ts:does not hit the API when switching to price` / `to 24h change` | e2e | PASS |
| 57 | No `order` value the API silently ignores is ever sent | `sort-order.spec.ts:never sends an order value the API silently ignores` | e2e | PASS |
| 58 | Switching from market cap to a local field does not refetch | `sort-order.spec.ts:keeps the fetched pool` | e2e | PASS |
| 59 | The UI states whether a sort is market-wide or page-scoped | `sort-order.spec.ts:the UI says which scope applies` | e2e | PASS |
| 60 | The page-size control defaults to the configured size, sits with the pager, and is labelled | `page-size.spec.ts:the control` | e2e | PASS |
| 61 | Changing the size sends the new `per_page` and renders that many coins | `page-size.spec.ts:requests the new size` / `renders as many coins` / `shrinks the list` | e2e | PASS |
| 62 | Changing the size returns to page 1 | `page-size.spec.ts:returns to page 1` | e2e | PASS |
| 63 | Each size caches separately | `page-size.spec.ts:caches each size separately` | e2e | PASS |
| 64 | Paging and end-of-data respect the chosen size | `page-size.spec.ts:pages at the chosen size` / `detects the last page` | e2e | PASS |
| 65 | Rank range, heading and search follow the chosen size | `page-size.spec.ts:reports the rank range` / `the rest of the UI keeps up` | e2e | PASS |
| 66 | A coin with no rank renders no badge and no dangling `#` | `unranked-coins.spec.ts:renders no rank badge` | e2e | PASS |
| 67 | A ranked coin still shows its badge on a partially ranked page | `unranked-coins.spec.ts:a ranked coin still shows its rank badge` | e2e | PASS |
| 68 | The pager reports a coin count when no coin carries a rank, and the ranks that exist when some do | `unranked-coins.spec.ts:the pager summary` | e2e | PASS |
| 69 | An unranked page leaks no NaN/undefined/null | `unranked-coins.spec.ts:leaks no NaN` | e2e | PASS |

---

## Coverage and known gaps

No line-coverage number is reported. Playwright is a black-box browser runner, and
`react-scripts` provides no instrumentation hook for it without ejecting or adding a
second runner — which would defeat the single-runner decision. Coverage is instead stated
as behavioural coverage: the 69 guarantees above map onto every numbered requirement in
`docs/INTERVIEW_TASK.md`, including all four listed edge cases.

**Deliberate gaps:**

- **No unit tests over `lib/format.ts` and `lib/sort.ts`.** Their behaviour is asserted
  through the DOM. A Vitest layer would pin edge cases faster than a browser round trip;
  it is the first thing I would add next.
- **No test for the retry interceptor's backoff timing.** The suite proves retry
  *recovers*; it does not assert the 300ms/600ms schedule.
- **Live API is not exercised by the suite.** By design — a live call cannot be asked for
  a 500 or a dropped connection, and would flake on rate limits. Live behaviour was
  verified manually instead, and that is what found the `-0.00%` bug.
- **Coin detail page is not implemented**, so it is untested. It is a bonus item in the
  brief and called out in the README. Pagination *is* now implemented and covered.
- **The page number is not in the URL**, so a page cannot be linked or survive a refresh.
  Untested because unimplemented; noted in the README.
- **Search is scoped to the loaded page**, by design. The suite asserts that scoping and
  that the UI states it, rather than asserting a global search that does not exist.

**No skipped or disabled tests.** The 5 reported skips are `responsive.spec.ts` opting out
of the mobile project via `test.skip(({ isMobile }) => …)`, because those tests set their
own viewports and only need to run once.

---

## Merge evidence

If these checkpoint commits are squashed, this is the summary to carry forward:

- **RED:** 43/43 Playwright tests failed on `[data-testid=coin-card]` not found, before
  any feature code existed (`a26ca25`).
- **GREEN:** 199 passed / 5 skipped after implementation, the rounding fix, the
  environment-configuration refactor, the dead-code cleanup, server-side pagination,
  API-backed market cap sorting and the page-size selector — with `tsc --noEmit` clean,
  `npm run build` compiling and `knip` reporting no unused files, exports or dependencies.
- **Second bug found by looking at the rendered page, fixed under test:** the header
  claimed "Top 20" while showing ranks 21-40 (`RED 4 failed -> GREEN 17 passed`).
- **Third bug, found by driving the live API:** `market_cap_rank` is nullable at the
  bottom of the market, producing a dangling `#` on every card and a pager claiming an
  empty page above 50 coins (`RED 3 failed -> GREEN 20 passed`).
- **A trap avoided by probing the API before coding:** CoinGecko silently ignores
  `order=price_*` and `order=percent_change_24h_*`, answering 200 with market-cap order.
  Only market cap is sent server-side; the type system now makes the alternative
  unrepresentable.
- **Bug found and fixed under test:** 24h changes that round to zero rendered as red
  losses; found by driving the live API, fixed RED→GREEN (`caae21d`).
