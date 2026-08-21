import { useLayoutEffect, useMemo, useRef } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the conversation SlotMap declaration for the composer dock seat.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the tokenUsage projection key and its value type.
import type {} from '@deepseek-ai/dsh-token-meter/client'
import { formatIoRatio } from './usage.ts'

type Props = PropsRuntime<'conversation.composer.dock'>

/**
 * Composer-dock entry that appends `|输入/输出 tok：N:1` at the end of the
 * StatsLine root. It reads the same durable `tokenUsage` projection that the
 * built-in stats line uses, so the ratio always matches the displayed input
 * and output token counts. The separator span reuses the existing separator
 * class from the stats row; the anchor span is invisible.
 *
 * The appended nodes are not part of StatsLine's React children list, so React
 * may later insert new built-in groups after them. A MutationObserver watches
 * StatsLine's root and re-appends our nodes whenever React changes the row,
 * keeping the ratio visually at the end.
 */
export function ComposerDockRatio({ useProjection }: Props) {
  const usage = useProjection('tokenUsage')
  const ratio = useMemo(() => {
    if (usage === undefined) return null
    const input = usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
    return formatIoRatio(input, usage.outputTokens)
  }, [usage])

  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const childRef = useRef<HTMLSpanElement[]>([])

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (anchor === null) return
    const wrapper = anchor.parentElement
    if (wrapper === null) return

    let root: HTMLElement | null = null
    let rootObserver: MutationObserver | null = null
    let wrapperObserver: MutationObserver | null = null

    const findRoot = (): HTMLElement | null => {
      const candidates = [...wrapper.querySelectorAll<HTMLElement>(':scope > div')]
      return candidates.find(element => getComputedStyle(element).textAlign === 'center') ?? candidates[0] ?? null
    }

    /** Create if needed, attach to the current root, and keep the pair last. */
    const syncNodes = () => {
      if (root === null) return
      if (childRef.current.length === 0) {
        const existingSeparator = root.querySelector<HTMLElement>('span[aria-hidden="true"]')
        const separator = document.createElement('span')
        separator.setAttribute('aria-hidden', 'true')
        separator.textContent = '|'
        if (existingSeparator !== null) separator.className = existingSeparator.className

        const content = document.createElement('span')
        content.dataset.dshIoRatio = ''

        childRef.current = [separator, content]
      }

      const [separator, content] = childRef.current
      if (separator.parentElement !== root || content.parentElement !== root) {
        root.append(separator, content)
      }
      if (root.lastElementChild !== content) {
        root.append(separator, content)
      }

      if (ratio === null) {
        separator.style.display = 'none'
        content.style.display = 'none'
        content.textContent = ''
      } else {
        separator.style.display = ''
        content.style.display = ''
        content.textContent = `输入/输出 tok：${ratio}`
      }
    }

    const handleRootMutation: MutationCallback = () => {
      syncNodes()
    }

    const attachRoot = (next: HTMLElement | null) => {
      if (rootObserver !== null) {
        rootObserver.disconnect()
        rootObserver = null
      }
      root = next
      if (root === null) return
      syncNodes()
      rootObserver = new MutationObserver(handleRootMutation)
      rootObserver.observe(root, { childList: true })
    }

    const handleWrapperMutation: MutationCallback = () => {
      const next = findRoot()
      if (next !== root) {
        attachRoot(next)
      } else if (root !== null) {
        // Same root but React may have removed/replaced our nodes.
        syncNodes()
      }
    }

    attachRoot(findRoot())
    wrapperObserver = new MutationObserver(handleWrapperMutation)
    wrapperObserver.observe(wrapper, { childList: true })

    return () => {
      wrapperObserver.disconnect()
      rootObserver?.disconnect()
      for (const element of childRef.current) element.remove()
      childRef.current = []
    }
  }, [ratio])

  return <span ref={anchorRef} data-dsh-io-ratio-anchor="" style={{ display: 'none' }} />
}
