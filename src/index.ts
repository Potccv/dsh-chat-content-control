import type { Context } from 'cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

export const name = 'dsh-chat-content-control'

/** Settings namespace served to the browser Settings > Plugins surface. */
export const CHAT_CONTENT_CONTROL_NS = settingsNamespace('chat-content-control')

export interface Config {
  chatWidth: number
  showFullStats: boolean
}

export const Config = z.object({
  chatWidth: z.number().min(480).max(1920).default(864),
  showFullStats: z.boolean().default(false),
})

export function apply(ctx: Context, config: Config): void {
  // The host does not consume these values itself; the namespace exists so the
  // Settings > Plugins tab discovers and renders the browser card. The browser
  // card persists to localStorage, which is also what the header controls use.
  installSettingsSection(ctx, CHAT_CONTENT_CONTROL_NS, Config, config, {
    setSource: () => {},
    onChange: () => {},
  })
}
