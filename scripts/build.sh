#!/bin/bash
# Build: compile src/ → lib/ with the dsh checkout's tsc, then the client
# bundle is produced separately by `npm run build:client` (tsdown).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Fresh output: stale files from earlier iterations must not ship in the tarball.
rm -rf lib

# DSH_CHECKOUT 探测：环境变量 → 本仓库（Workfile 插件常见布局）→ 常见路径
CHECKOUT="${DSH_CHECKOUT:-}"
if [ -z "$CHECKOUT" ] && [ -d "$ROOT/../../packages" ]; then
  CHECKOUT="$(cd "$ROOT/../.." && pwd)"
fi
if [ -z "$CHECKOUT" ]; then
  for candidate in "$HOME/dsh-harness" "$HOME/dsh" "$HOME/.dsh/dsh-harness"; do
    if [ -d "$candidate/packages" ]; then CHECKOUT="$candidate"; break; fi
  done
fi
if [ -z "$CHECKOUT" ] || [ ! -d "$CHECKOUT/packages" ]; then
  echo "build: cannot locate the dsh checkout (set DSH_CHECKOUT)" >&2
  exit 1
fi

TSC="$CHECKOUT/node_modules/.bin/tsc"
if [ ! -x "$TSC" ] && [ ! -f "$TSC.cmd" ]; then
  echo "build: tsc not found at $TSC" >&2
  exit 1
fi

link_pkg() {
  local target="$CHECKOUT/$2"
  if [ ! -e "$target" ]; then
    echo "build: dependency target missing: $target" >&2
    exit 1
  fi
  node -e "
    const fs = require('fs');
    const path = require('path');
    const link = path.resolve(process.argv[1]);
    const target = path.resolve(process.argv[2]);
    fs.rmSync(link, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  " "node_modules/$1" "$target"
}

link_abs() {
  local target="$2"
  if [ ! -e "$target" ]; then
    echo "build: dependency target missing: $target" >&2
    exit 1
  fi
  node -e "
    const fs = require('fs');
    const path = require('path');
    const link = path.resolve(process.argv[1]);
    const target = path.resolve(process.argv[2]);
    fs.rmSync(link, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  " "node_modules/$1" "$target"
}

echo "=== Linking build dependencies (checkout: $CHECKOUT) ==="
mkdir -p node_modules/@deepseek-ai node_modules/@types
node -e "const fs=require('fs');fs.rmSync('node_modules/@standard-schema',{recursive:true,force:true})"
link_pkg cordis vendor/cordis
link_pkg cosmokit vendor/cosmokit
link_pkg schemastery vendor/schemastery
link_pkg @deepseek-ai/dsh-settings packages/settings/settings
link_pkg @deepseek-ai/dsh-token-meter packages/llm/token-meter
link_pkg @deepseek-ai/dsh-client-runtime packages/client/runtime
link_pkg @deepseek-ai/dsh-client-ui-slots packages/client/ui-slots
link_pkg @deepseek-ai/dsh-client-ui-conversation packages/client/ui-conversation
link_pkg @deepseek-ai/dsh-client-ui-settings packages/client/ui-settings
link_pkg @deepseek-ai/dsh-client-ui-settings-plugins packages/client/ui-settings-plugins
link_pkg @deepseek-ai/dsh-client-ui-primitives packages/client/ui-primitives
# @types/node（编译类型；checkout 自带）
link_pkg @types/node node_modules/@types/node

# React and its types live in the checkout's pnpm store, not as a workspace package.
link_abs react "$CHECKOUT/node_modules/.pnpm/react@18.3.1/node_modules/react"
link_abs @types/react "$CHECKOUT/node_modules/.pnpm/@types+react@18.3.31/node_modules/@types/react"

STD_SCHEMA=$(find "$CHECKOUT/node_modules/.pnpm" -maxdepth 1 -type d -iname '@standard-schema+spec@*' 2>/dev/null | head -1)
if [ -n "$STD_SCHEMA" ]; then
  node -e "
    const fs = require('fs');
    const path = require('path');
    fs.rmSync('node_modules/@standard-schema', { recursive: true, force: true });
    fs.mkdirSync('node_modules/@standard-schema', { recursive: true });
    fs.symlinkSync(path.resolve(process.argv[1]), path.resolve('node_modules/@standard-schema/spec'), process.platform === 'win32' ? 'junction' : 'dir');
  " "$STD_SCHEMA/node_modules/@standard-schema/spec"
fi

echo "=== Compiling src → lib ==="
"$TSC" -p tsconfig.json
echo "=== Build complete ==="
