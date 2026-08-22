# dsh-chat-content-control

DeepSeek Harness 浏览器插件：调整聊天内容列宽、关闭统计信息超长自动隐藏、自定义侧边栏会话显示数量、在输入框下方统计行末尾追加输入/输出 Token 比值。

## 功能

1. **自定义 `--dsh-chat-content-width`**
   - 在“设置 → 插件 → 聊天内容控制”中修改“聊天内容宽度 (px)”。
   - 点击“保存”后立即生效，并写入 `localStorage`；刷新网页后仍保持该宽度。
   - “恢复默认”将宽度重置为 864px。

2. **取消统计信息超长自动隐藏**
   - 在“设置 → 插件 → 聊天内容控制”中打开“取消统计信息超长自动隐藏”开关后保存。
   - 开启后，输入框下方的统计行不再省略号截断，超长内容会完整换行显示。

3. **输入/输出 Token 比值**
   - 追加在输入框下方统计行（`conversation.composer.dock` 中 StatsLine root）的**最后**。
   - 显示格式为 `|输入/输出 tok：N:1`，并复用当前统计行已有的分隔符 class：

     ```html
     <span class="wVzo3G_sep" aria-hidden="true">|</span>
     <span>输入/输出 tok：12.5:1</span>
     ```

   - 分隔符会动态复制 StatsLine 中已有分隔符的 `className`，因此不写死 hash 类名，也不使用内联样式。
   - 与内置统计行读取同一个 `tokenUsage` projection（`uncachedInputTokens + cacheReadTokens + cacheWriteTokens` 作为输入，`outputTokens` 作为输出），所以比值与前面显示的输入/输出数值一致；没有 usage 数据时不显示。

4. **自定义侧边栏会话显示数量**
   - 在“设置 → 插件 → 聊天内容控制”中设置“侧边栏会话显示数量”。
   - 默认仍为 5；可选“全部”或“自定义”数量（1–999）。
   - 选择“全部”后，左侧工作区的每个工作区都会直接展示全部会话，不再显示“展开其余”按钮。
   - 选择“自定义 N”后，每个工作区展示前 N 个会话，并保留“展开其余 X 个会话”按钮用于临时查看剩余会话；再次点击“收起”回到前 N 个。
   - 即使某个工作区会话总数不足 6（此时内置界面原本不会显示“展开其余”按钮），插件也会自动补一个同款按钮并应用自定义数量。
   - 实现方式：插件通过 DOM 观察器将内置工作区树保持为“已展开”状态，再由插件隐藏超出数量的行；不修改 DeepSeek Harness 上游源码。

## 设置入口

- 通过 **设置 → 插件 → 聊天内容控制** 卡片进行设置。

设置保存在浏览器 `localStorage` 的 `dsh-chat-content-control.settings` 键中，结构包含：

```ts
interface PluginSettings {
  chatWidth: number            // 默认 864
  showFullStats: boolean       // 默认 false
  sessionLimitMode: 'default' | 'all' | 'custom'  // 默认 'default'
  sessionLimitCount: number    // 默认 5
}
```

Host 侧注册了 `chat-content-control` settings namespace，用于让“设置 → 插件”页面发现该卡片。

## 安装方法

走 DSH 标准 profile 安装（与 dsh-meter 一致）。安装后代码位于 profile 的 pnpm 管理目录；源码安装使用 `file:` 将源码复制进该目录，不创建指向源码目录的软链接。

### 方式一：通过 tarball 安装（推荐，对方不需要构建）

```bash
dsh plugin --profile web add ./dsh-chat-content-control-0.0.2.tgz
```

验证并启动：

```bash
dsh --profile web --dump-config
dsh --profile web
```

> tarball 内已经包含预构建的 `lib/` 和 `cordis.patch.yml`，安装时不需要构建。

### 方式二：通过源码安装

在插件目录先构建：

```bash
cd /path/to/dsh-chat-content-control
npm run build
npm run build:client
```

然后在 DeepSeek Harness 源码根目录安装：

```bash
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add file:/path/to/dsh-chat-content-control
pnpm dsh --profile web
```

本机示例：

```bash
cd /root/deepseek-harness/Workfile/dsh-chat-content-control
npm run build
npm run build:client

cd /root/deepseek-harness
pnpm dsh plugin --profile web add file:/root/deepseek-harness/Workfile/dsh-chat-content-control
pnpm dsh --profile web
```

### 方式三：开发时用超级模组注入器（仅限当前开发环境）

```text
dev_build_plugin /root/deepseek-harness/Workfile/dsh-chat-content-control
dev_inject_plugin /root/deepseek-harness/Workfile/dsh-chat-content-control
```

## 构建产物

```text
dsh-chat-content-control-0.0.2.tgz
```
