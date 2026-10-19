# Sidebar Icon Performance

## Methodology

Benchmarks run via `scripts/bench-sidebar-icons.sh` (Vitest:
`src/infra/persistence/WorkspaceIconCache.bench.test.ts`).

1. Build N synthetic workspace fixtures, each with `public/favicon.png`.
2. Compare resolve strategies:
   - **no-cache**: clear `FaviconHelper` before every resolve (full scan each time).
   - **icon-cache**: resolve through `WorkspaceIconCache` (cold fill, then warm hits).
3. Count `fs.statSync` / `fs.readdirSync` via a Vitest `fs` mock.
4. Assert remount avoidance: `ViewProvider.buildLocalResourceRoots` path identity is
   stable across refreshes, and the provider keeps one roots instance for its lifetime.

Also included: `retainContextWhenHidden`, one-shot `localResourceRoots` lock, template
prefetch, embedded initial payload + webview state restore, and `detectIcons` hot-path
guards.

## Metrics

Measured on 2026-09-13 (local Darwin / Node 24 / Vitest 5).

| Label      |   N | Cold ms | Warm ms | Cold stat | Warm stat | Cold readdir | Warm readdir |
| ---------- | --: | ------: | ------: | --------: | --------: | -----------: | -----------: |
| no-cache   |  25 |   2.447 |   1.421 |        50 |        50 |           25 |           25 |
| icon-cache |  25 |   2.245 |   0.113 |        50 |        25 |           25 |            0 |
| no-cache   | 100 |   8.554 |   6.738 |       200 |       200 |          100 |          100 |
| icon-cache | 100 |  10.432 |   0.748 |       200 |       100 |          100 |            0 |

Remount avoidance:

| Check                                             | Result |
| ------------------------------------------------- | ------ |
| Stable `localResourceRoots` paths across rebuilds | yes    |
| Same roots instance on provider for lifetime      | yes    |

## Interpretation

- Warm N=100 resolve latency drops from **6.738 ms → 0.748 ms** (~9.0×).
- Warm `readdirSync` drops from **100 → 0**; warm `statSync` halves (usability checks only).
- Stable icon cache directory + locked roots eliminate remount bugs that left the sidebar
  stuck on loading when roots changed per refresh.

## PR recommendation: YES

Ship `feature/sidebar-icon-performance`. The wins are material under realistic N (100
workspaces), remount avoidance is covered by unit tests, and the changes stay scoped to
performance/caching with `detectIcons` (not progressive streaming or unrelated branding).
