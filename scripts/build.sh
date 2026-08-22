#!/bin/bash
# Build: compile src/ → lib/ with the dsh checkout's tsc, then the client
# bundle is produced separately by `npm run build:client` (tsdown).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Fresh output: stale files from earlier iterations must not ship in the tarball.
rm -rf lib

# DSH_CHECKOUT 探测：环境变量 → 本仓库（源码目录）→ 常见目录名 → 受限 find → 用户手动输入
CHECKOUT="${DSH_CHECKOUT:-}"
if [ -z "$CHECKOUT" ] && [ -d "$ROOT/../../packages" ]; then
  CHECKOUT="$(cd "$ROOT/../.." && pwd)"
fi

probe_candidate() {
  if [ -z "$CHECKOUT" ] && [ -d "$1/packages" ]; then
    CHECKOUT="$1"
  fi
}

if [ -z "$CHECKOUT" ]; then
  for base in "$HOME" "$HOME/code" "$HOME/projects" "$HOME/dev" "$HOME/src" /opt /srv /workspace; do
    [ -n "$base" ] || continue
    for name in dsh deepseek-harness deepseekharness DeepSeek-Harness DeepSeekHarness deepseek_harness; do
      probe_candidate "$base/$name"
      [ -n "$CHECKOUT" ] && break
    done
    [ -n "$CHECKOUT" ] && break
  done
fi

if [ -z "$CHECKOUT" ] && [ -d "$HOME" ]; then
  CHECKOUT="$(find "$HOME" -maxdepth 4 -type d \( -name 'deepseek-harness' -o -name 'deepseekharness' -o -name 'DeepSeek-Harness' -o -name 'DeepSeekHarness' -o -name 'dsh' \) -exec test -d '{}/packages' \; -print -quit 2>/dev/null || true)"
fi

if [ -z "$CHECKOUT" ]; then
  if [ -t 0 ]; then
    read -r -p "未自动探测到 DeepSeek Harness checkout，请输入其路径: " CHECKOUT
  else
    echo "build: 未自动探测到 DSH checkout，且当前为非交互环境；请通过 DSH_CHECKOUT 环境变量指定" >&2
    exit 1
  fi
fi

if [ -z "$CHECKOUT" ] || [ ! -d "$CHECKOUT/packages" ]; then
  echo "build: 无效的 DSH checkout 路径（缺少 packages/ 目录）: ${CHECKOUT:-<空>}" >&2
  exit 1
fi

TSC="$CHECKOUT/node_modules/.bin/tsc"
if [ ! -x "$TSC" ] && [ ! -f "$TSC.cmd" ]; then
  echo "build: tsc not found at $TSC" >&2
  exit 1
fi

echo "=== Generating build tsconfig (checkout: $CHECKOUT) ==="
DSH_CHECKOUT="$CHECKOUT" node scripts/generate-tsconfig.mjs

echo "=== Compiling src → lib ==="
"$TSC" -p tsconfig.build.json
echo "=== Build complete ==="
