/**
 * Session-list display limit control.
 *
 * The sidebar's built-in Workspace browser hard-codes five visible sessions
 * per workspace before an overflow button. This module re-implements that
 * limit from the outside (no upstream patch): it expands every workspace
 * group once, then hides session rows after the configured count. The
 * overflow button is preserved and becomes a plugin-owned toggle so the
 * user can still reveal the remaining sessions without the built-in React
 * state collapsing back to five.
 *
 * The implementation is intentionally DOM-based because the limit is a
 * compile-time constant in ui-workspace and is not exposed through slots or
 * settings. It uses stable ARIA/tree structure rather than hashed CSS class
 * names, and a MutationObserver keeps the effect applied after React
 * re-renders.
 */
import type { PluginSettings } from './settings.ts'

/** The upstream default that the plugin leaves untouched when in `default` mode. */
export const DEFAULT_SESSION_LIMIT = 5

export type SessionLimitMode = 'default' | 'all' | 'custom'

interface GroupInfo {
  group: HTMLElement
  /** Built-in overflow button, or a plugin-injected one; absent when no overflow exists yet. */
  button: HTMLButtonElement | null
  rows: HTMLElement[]
}

const listeners = new WeakMap<HTMLButtonElement, (event: MouseEvent) => void>()

/** True while a MutationObserver-driven enforce is already queued. */
let enforceQueued = false

/** The latest settings this module should enforce. */
let currentMode: SessionLimitMode = 'default'
let currentCount = DEFAULT_SESSION_LIMIT

const INJECTED_BUTTON_CLASS = 'dsh-ccc-session-overflow-button'
const INJECTED_STYLE_ID = 'dsh-ccc-session-overflow-style'

/** Start observing the sidebar and enforce the current setting. */
export function setupSessionLimit(): () => void {
  if (typeof document === 'undefined') return () => {}
  ensureInjectedButtonStyle()
  const observer = new MutationObserver(() => scheduleEnforce())
  observer.observe(document.body, { childList: true, subtree: true })
  scheduleEnforce()
  return () => {
    observer.disconnect()
  }
}

/** Update the active limit configuration and apply it immediately. */
export function applySessionLimit(settings: PluginSettings): void {
  currentMode = settings.sessionLimitMode
  currentCount = Math.max(1, Math.round(settings.sessionLimitCount))
  scheduleEnforce()
}

function scheduleEnforce(): void {
  if (enforceQueued) return
  enforceQueued = true
  requestAnimationFrame(() => {
    enforceQueued = false
    enforce()
  })
}

/** Inject minimal styling for plugin-created overflow buttons. */
function ensureInjectedButtonStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(INJECTED_STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = INJECTED_STYLE_ID
  style.textContent = `
    .${INJECTED_BUTTON_CLASS} {
      width: 100%;
      height: 28px;
      border: none;
      border-radius: 8px;
      padding: 0 12px 0 28px;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-size: 12px;
      color: var(--dsw-alias-label-tertiary);
    }
    .${INJECTED_BUTTON_CLASS}:hover {
      color: var(--dsw-alias-label-secondary);
    }
  `
  document.head.appendChild(style)
}

/** Collect every workspace group section in the sidebar tree. */
function collectGroups(): GroupInfo[] {
  const groups: GroupInfo[] = []
  const trees = document.querySelectorAll<HTMLElement>('[role="tree"]')
  for (const tree of trees) {
    for (const group of Array.from(tree.children)) {
      if (!(group instanceof HTMLElement)) continue
      // A workspace group section contains a project header row carrying
      // aria-expanded. Flat/session trees and search results do not.
      const project = group.querySelector<HTMLElement>('[role="treeitem"][aria-expanded]')
      if (project === null) continue
      const rows = Array.from(group.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .filter(row => !row.hasAttribute('aria-expanded'))
      const button = group.querySelector<HTMLButtonElement>(':scope > button[aria-expanded]')
      groups.push({ group, button, rows })
    }
  }
  return groups
}

/** Total session count in a group, including rows not yet rendered. */
function totalSessions(button: HTMLButtonElement | null, rows: readonly HTMLElement[]): number {
  if (button === null) return rows.length
  if (button.getAttribute('aria-expanded') === 'true') return rows.length
  const text = button.textContent ?? ''
  const match = text.match(/\d+/)
  const remaining = match === null ? 0 : Number(match[0])
  return rows.length + (Number.isFinite(remaining) ? remaining : 0)
}

function usesChinese(button: HTMLButtonElement): boolean {
  const own = button.textContent ?? ''
  if (/[\u4e00-\u9fff]/.test(own)) return true
  // Newly injected buttons start empty; infer the UI language from an
  // existing overflow button or the document language.
  const template = document.querySelector<HTMLButtonElement>('[role="tree"] button[aria-expanded]')
  if (template !== null && template !== button && /[\u4e00-\u9fff]/.test(template.textContent ?? '')) return true
  return /^zh/i.test(document.documentElement.lang || '')
}

function expandLabel(button: HTMLButtonElement, count: number): string {
  return usesChinese(button)
    ? `展开其余 ${count} 个会话`
    : `Show ${count} more sessions`
}

function collapseLabel(button: HTMLButtonElement): string {
  return usesChinese(button) ? '收起' : 'Show less'
}

function ensureListener(button: HTMLButtonElement, group: HTMLElement): void {
  if (listeners.has(button)) return
  const onClick = (event: MouseEvent): void => {
    // Keep the built-in React state expanded; this button now toggles the
    // plugin-owned hidden rows only.
    event.preventDefault()
    event.stopPropagation()
    const expanded = group.dataset.dshCccCustomExpanded === 'true'
    group.dataset.dshCccCustomExpanded = String(!expanded)
    enforceGroup({ group, button, rows: Array.from(group.querySelectorAll<HTMLElement>('[role="treeitem"]')).filter(row => !row.hasAttribute('aria-expanded')) })
  }
  button.addEventListener('click', onClick, { capture: true })
  listeners.set(button, onClick)
}

function removeListener(button: HTMLButtonElement): void {
  const handler = listeners.get(button)
  if (handler !== undefined) {
    button.removeEventListener('click', handler, { capture: true })
    listeners.delete(button)
  }
}

/** Create an overflow button when the built-in one does not exist (total <= 5). */
function ensureInjectedButton(group: HTMLElement): HTMLButtonElement {
  const existing = group.querySelector<HTMLButtonElement>(':scope > button[aria-expanded]')
  if (existing !== null) return existing
  const button = document.createElement('button')
  button.type = 'button'
  // Reuse the built-in button class when another workspace group already has
  // one, so the injected button looks identical to the upstream control.
  const template = document.querySelector<HTMLButtonElement>('[role="tree"] button[aria-expanded]')
  button.className = template !== null && template !== button
    ? template.className
    : INJECTED_BUTTON_CLASS
  button.setAttribute('aria-expanded', 'true')
  button.dataset.dshCccInjected = 'true'
  group.appendChild(button)
  return button
}

function isInjectedButton(button: HTMLButtonElement): boolean {
  return button.dataset.dshCccInjected === 'true'
}

function resetGroup(info: GroupInfo): void {
  const { group, button, rows } = info
  if (button !== null) {
    removeListener(button)
    // If this group was expanded by the plugin through the built-in overflow
    // button, hand control back to the built-in React state by collapsing it.
    if (group.dataset.dshCccAutoExpanded === 'true' && !isInjectedButton(button)) {
      button.click()
    }
    if (isInjectedButton(button)) {
      button.remove()
    } else {
      button.style.display = ''
    }
  }
  delete group.dataset.dshCccAutoExpanded
  delete group.dataset.dshCccCustomExpanded
  for (const row of rows) row.style.display = ''
}

function enforceGroup(info: GroupInfo): void {
  const { group, button: existingButton, rows } = info
  const total = totalSessions(existingButton, rows)

  if (currentMode === 'default') {
    resetGroup(info)
    return
  }

  const wantAll = currentMode === 'all'
  const limit = wantAll ? total : currentCount

  // If the built-in overflow button exists and is still collapsed, expand it
  // first so all session rows are present in the DOM. The MutationObserver
  // will re-enter after React renders the full list.
  if (existingButton !== null
    && !isInjectedButton(existingButton)
    && existingButton.getAttribute('aria-expanded') !== 'true'
    && total > rows.length) {
    group.dataset.dshCccAutoExpanded = 'true'
    removeListener(existingButton)
    existingButton.click()
    return
  }

  // No overflow needed: every session already fits, or the group is fully
  // expanded in "all" mode. Show everything and hide/remove the overflow
  // control.
  if (wantAll || total <= limit) {
    for (const row of rows) row.style.display = ''
    if (existingButton !== null) {
      removeListener(existingButton)
      if (isInjectedButton(existingButton)) {
        existingButton.remove()
      } else {
        existingButton.style.display = 'none'
        group.dataset.dshCccAutoExpanded = 'true'
      }
    }
    return
  }

  // Custom count with remaining sessions: keep all rows in the DOM, hide the
  // tail, and turn the overflow button into a plugin-owned toggle.
  const button = existingButton ?? ensureInjectedButton(group)
  const customExpanded = group.dataset.dshCccCustomExpanded === 'true'
  const visibleCount = Math.max(1, Math.min(limit, total))
  rows.forEach((row, index) => {
    row.style.display = index < visibleCount || customExpanded ? '' : 'none'
  })
  button.style.display = ''
  // Keep aria-expanded aligned with the built-in React state (always expanded
  // once the plugin has taken over the group). The visible overflow state is
  // carried by data-dsh-ccc-custom-expanded and the button label instead.
  if (button.getAttribute('aria-expanded') !== 'true') {
    button.setAttribute('aria-expanded', 'true')
  }
  const label = customExpanded
    ? collapseLabel(button)
    : expandLabel(button, total - visibleCount)
  if (button.textContent !== label) button.textContent = label
  group.dataset.dshCccAutoExpanded = 'true'
  ensureListener(button, group)
}

function enforce(): void {
  if (currentMode === 'default') {
    for (const info of collectGroups()) resetGroup(info)
    return
  }
  for (const info of collectGroups()) enforceGroup(info)
}
