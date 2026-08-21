# AI_MEMORY.md

> 本项目约定：以后任何需要保存的项目记忆、代码要点、已完成工作、用户偏好，统一写入本文件 `AI_MEMORY.md`（位于项目根目录）。不要散落到其他临时文件。

## 项目概况

- 插件名：`dsh-chat-content-control`
- 包名：`dsh-chat-content-control`
- 版本：`0.0.1`
- GitHub 仓库：https://github.com/Potccv/dsh-chat-content-control
- 默认分支：`main`
- 当前 tag：`v0.0.1`
- Release：https://github.com/Potccv/dsh-chat-content-control/releases/tag/v0.0.1
- tarball：`dsh-chat-content-control-0.0.1.tgz`
- 下载地址：https://github.com/Potccv/dsh-chat-content-control/releases/download/v0.0.1/dsh-chat-content-control-0.0.1.tgz

## 功能

1. 自定义聊天内容宽度：修改 `--dsh-chat-content-width`，保存到 `localStorage`，刷新后仍生效。
2. 取消统计信息超长自动隐藏：开启后输入框下方统计行不再省略号截断。
3. 在输入框下方统计行（StatsLine root）末尾追加 `|输入/输出 tok：N:1`。

## 重要实现事实

### 设置存储

- 浏览器 `localStorage` key：`dsh-chat-content-control.settings`
- 设置结构：
  ```ts
  interface PluginSettings {
    chatWidth: number      // 默认 864，范围 480-1920
    showFullStats: boolean // 默认 false
  }
  ```

### Host 侧

- `src/index.ts`
- 注册 settings namespace：`chat-content-control`
- 用途：让“设置 → 插件”页面能发现本插件的配置卡片。
- 插件行 id：`dsh-chat-content-control`
- Host 本身不消费这些设置值，真正持久化在浏览器 localStorage。

### Client 侧

- `src/client/index.ts`
  - `inject = ['slots']`
  - 注册 `conversation.composer.dock` 的 `ComposerDockRatio`
  - 注册 `settings.plugin.item` 的 `SettingsCard`，key = `chat-content-control`
- `src/client/settings.ts`
  - 读写 localStorage
  - 应用 CSS：
    - 宽度：`[data-phase] { --dsh-chat-content-width: ${width}px !important; }`
    - 完整统计：`[data-slot="conversation.composer.dock"] > div { ... }`
- `src/client/SettingsCard.tsx`
  - 设置卡片，样式对齐 `PluginCard`（终端/Agent 循环等卡片）
  - 使用 `card-style.ts` 注入统一 CSS class（`dsh-ccc-*`）
  - 不使用内联样式来模拟卡片外观
- `src/client/ComposerDockRatio.tsx`
  - 在 StatsLine root 末尾追加 `|输入/输出 tok：N:1`
  - 分隔符 `|` 会复制 StatsLine 中已有分隔符的 `className`（例如 `wVzo3G_sep`），不写死 hash 类名，也不使用内联样式
  - 数据源使用 `useProjection('tokenUsage')`：
    - 输入 = `uncachedInputTokens + cacheReadTokens + cacheWriteTokens`
    - 输出 = `outputTokens`
  - 必须与内置统计行的输入/输出数值一致，不能自己从 `chat.legacy.nodes` 聚合
  - 顺序保持：插件节点不是 StatsLine React children，React 后续插入新分组时会跑到插件节点后面；用 `MutationObserver` 监听 StatsLine root 的 `childList`，在 React 变更后把插件节点重新 `append` 到末尾，同时监听 slot wrapper 以处理 StatsLine 根节点出现/消失
- `src/client/usage.ts`
  - `formatIoRatio(input, output)` 生成 `N:1`
- `src/client/card-style.ts`
  - 注入设置卡片样式

### 已删除/不要恢复

- 不要重新在 `conversation.session.header.utilities` 注入“显示设置”或“完整统计：开/关”按钮。
- 用户明确要求主页右上角不注入任何本插件内容。
- 旧包名 `@dsh-external/dsh-chat-content-control` 已废弃，统一使用 `dsh-chat-content-control`。

## 构建

```bash
npm run build          # host 侧 tsc 编译，输出 lib/
npm run build:client   # 浏览器侧 tsdown 打包，输出 lib/client.js
```

- `scripts/build.sh` 会清理 `lib/` 后重新编译。
- 构建产物 tarball：`dsh-chat-content-control-0.0.1.tgz`。
- `scripts/build.sh` 不再创建任何 `node_modules` 软链接，也不再依赖 `$HOME/dsh-harness` 软链接。
- 构建时由 `scripts/generate-tsconfig.mjs` 生成 `tsconfig.build.json`，通过 TypeScript `paths` 指向 checkout 内已构建的 `.d.ts` 声明文件来解析依赖。
- 探测顺序：`DSH_CHECKOUT` → 当前仓库父目录 → `$HOME` 下常见目录名（`dsh`、`deepseek-harness`、`deepseekharness`、`DeepSeek-Harness`、`DeepSeekHarness`、`deepseek_harness`）→ 受限 `find` → 用户手动输入。
- 若为非交互环境且未探测到，会报错提示设置 `DSH_CHECKOUT`。
- `tsconfig.build.json` 是生成文件，已加入 `.gitignore`，不要提交。
- 注意：`dev_build_plugin` 工具自身的探测可能仍需要 `DSH_CHECKOUT` 或常见路径；本项目的 `build.sh` 和 `npm run build:client` 已支持直接构建。

## 安装方法

### 方式一：tarball

```bash
dsh plugin --profile web add ./dsh-chat-content-control-0.0.1.tgz
```

> **已修复（2026-08-20）**：旧版 tarball 在全新 profile 中安装后重启会报
> `Cannot find package 'schemastery'`，因为 profile 的 `pnpm-workspace.yaml` 设置了
> `autoInstallPeers: false`，而插件把 `schemastery` 和 `@deepseek-ai/dsh-settings` 声明为 peerDependencies。
> 现在已把这两个运行时依赖移到 `dependencies`，重新打包 tarball；在 `192.168.1.201` 上验证：
> 清空 profile 后仅执行 `dsh plugin --profile web add ./dsh-chat-content-control-0.0.1.tgz` 即可成功加载，无需额外手动补依赖。
> 进一步在彻底删除 dsh 后重新部署，tarball 安装和源码安装（`pnpm dsh plugin --profile web add /path/to/Workfile/dsh-chat-content-control`）均验证成功。
> GitHub Release `v0.0.1` 已删除旧产物并重新创建，tag 已移动到修复 commit，下载 tarball 为修复后版本。

### 方式二：源码（DeepSeek Harness 源码运行）

```bash
cd <deepseek-harness>/Workfile/dsh-chat-content-control
npm run build
npm run build:client

pnpm dsh plugin --profile web add /path/to/deepseek-harness/Workfile/dsh-chat-content-control
pnpm dsh --profile web
```

### 方式三：开发环境注入

```text
dev_build_plugin /root/deepseek-harness/Workfile/dsh-chat-content-control
dev_inject_plugin /root/deepseek-harness/Workfile/dsh-chat-content-control
```

## Bundle 打包

- `package.json` 声明：
  ```json
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" }
  }
  ```
- `cordis.patch.yml`：
  ```yaml
  - insert:
      - id: dsh-chat-content-control
        name: 'dsh-chat-content-control'
  ```

## 用户偏好 / 注意事项

- 设置卡片必须与“设置 → 插件”里终端、Agent 循环等卡片样式一致。
- 分隔符不要用内联样式；应复用 StatsLine 已有的分隔符 class，方便前端统一管理。
- 输入/输出比值必须与内置统计行使用同一个 `tokenUsage` projection。
- 如果要求保存记忆，统一写入 `AI_MEMORY.md`。
