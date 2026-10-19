#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
WRITE_PERF_DOCS=1 npx vitest run src/infra/persistence/WorkspaceIconCache.bench.test.ts
