/**
 * dsh-chat-content-control — browser half.
 *
 * Features:
 * 1. A Settings > Plugins card adjusts --dsh-chat-content-width, toggles
 *    "show full stats", and configures the sidebar session display limit;
 *    saving writes localStorage and is applied on load.
 * 2. A composer-dock contribution appends input/output token counts at the end
 *    of the StatsLine root, matching the existing stats separator style.
 * 3. A DOM observer applies the configured session display limit to the
 *    sidebar workspace tree without modifying DeepSeek Harness upstream.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the conversation SlotMap declarations.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the settings.plugin.item SlotMap declaration.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { applyStoredSettings } from './settings.ts'
import { setupSessionLimit } from './session-limit.ts'
import { ComposerDockRatio } from './ComposerDockRatio.tsx'
import { SettingsCard } from './SettingsCard.tsx'

/** Settings namespace served by the host half; spelled here to avoid a host import. */
const SETTINGS_NS = 'chat-content-control'

export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  applyStoredSettings()

  // Watch the sidebar session tree so the configured session display limit
  // survives React re-renders. The observer lives for this fiber's lifetime.
  ctx.effect(() => setupSessionLimit(), 'chat-content-control: session limit observer')

  ctx.slots.inject(
    'conversation.composer.dock',
    () => ctx.slots.register({
      name: 'conversation.composer.dock',
      id: 'chat-content-control-io-ratio',
      order: 10,
    }, ComposerDockRatio),
  )

  ctx.slots.inject(
    'settings.plugin.item',
    () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: SETTINGS_NS,
    }, SettingsCard),
  )
}
