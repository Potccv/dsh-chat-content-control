/** Browser-persisted settings for the chat content control plugin. */
import { DEFAULT_SESSION_LIMIT, type SessionLimitMode, applySessionLimit } from './session-limit.ts'

export interface PluginSettings {
  /** Chat content column width in px; the default matches ui-conversation. */
  chatWidth: number
  /** When true, the composer stats line stops truncating long text. */
  showFullStats: boolean
  /** How many session rows the sidebar shows per workspace before overflow. */
  sessionLimitMode: SessionLimitMode
  /** Custom session row count, used when sessionLimitMode is `custom`. */
  sessionLimitCount: number
}

export const DEFAULT_SETTINGS: PluginSettings = {
  chatWidth: 864,
  showFullStats: false,
  sessionLimitMode: 'default',
  sessionLimitCount: DEFAULT_SESSION_LIMIT,
}

const STORAGE_KEY = 'dsh-chat-content-control.settings'
const STYLE_ID = 'dsh-chat-content-control-style'
const MIN_WIDTH = 480
const MAX_WIDTH = 1920
const MIN_SESSION_LIMIT = 1
const MAX_SESSION_LIMIT = 999

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Read and validate persisted settings, falling back to defaults. */
export function loadSettings(): PluginSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return { ...DEFAULT_SETTINGS }
    const width = typeof parsed.chatWidth === 'number' && Number.isFinite(parsed.chatWidth)
      ? Math.round(parsed.chatWidth)
      : DEFAULT_SETTINGS.chatWidth
    const mode = parsed.sessionLimitMode === 'default' || parsed.sessionLimitMode === 'all' || parsed.sessionLimitMode === 'custom'
      ? parsed.sessionLimitMode
      : DEFAULT_SETTINGS.sessionLimitMode
    const count = typeof parsed.sessionLimitCount === 'number' && Number.isFinite(parsed.sessionLimitCount)
      ? Math.round(parsed.sessionLimitCount)
      : DEFAULT_SETTINGS.sessionLimitCount
    return {
      chatWidth: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)),
      showFullStats: parsed.showFullStats === true,
      sessionLimitMode: mode,
      sessionLimitCount: Math.min(MAX_SESSION_LIMIT, Math.max(MIN_SESSION_LIMIT, count)),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** Persist settings to localStorage. */
export function saveSettings(settings: PluginSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable (private mode); the in-memory apply still works.
  }
}

function styleElement(): HTMLStyleElement {
  let element = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (element === null) {
    element = document.createElement('style')
    element.id = STYLE_ID
    document.head.appendChild(element)
  }
  return element
}

/** Apply settings to the live page: width via the shared CSS variable and an
 * optional full-stats override for the composer stats line. */
export function applySettings(settings: PluginSettings): void {
  const fullStatsCss = settings.showFullStats
    ? `
      [data-slot="conversation.composer.dock"] > div {
        max-width: none !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
    `
    : ''
  styleElement().textContent = `
    [data-phase] {
      --dsh-chat-content-width: ${settings.chatWidth}px !important;
    }
    ${fullStatsCss}
  `
  applySessionLimit(settings)
}

/** Apply the stored settings once at client boot. */
export function applyStoredSettings(): void {
  applySettings(loadSettings())
}
