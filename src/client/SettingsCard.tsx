import { useEffect, useState, type ReactNode } from 'react'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the settings.plugin.item SlotMap declaration.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { ensureCardStyle } from './card-style.ts'
import {
  DEFAULT_SETTINGS, applySettings, loadSettings, saveSettings,
} from './settings.ts'
import type { SessionLimitMode } from './session-limit.ts'

type Props = PropsRuntime<'settings.plugin.item'>

/** One settings field in the same label/input/hint layout as built-in plugin cards. */
function Field({ label, hint, children }: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="dsh-ccc-field">
      <div className="dsh-ccc-field-head">
        <label className="dsh-ccc-field-label">{label}</label>
      </div>
      {children}
      {hint !== undefined ? <p className="dsh-ccc-field-hint">{hint}</p> : null}
    </div>
  )
}

/**
 * Settings > Plugins card for the chat content control plugin. It uses the
 * same visual chrome as the shell/agent-loop plugin cards, while keeping the
 * settings in localStorage.
 */
export function SettingsCard(_props: Props) {
  const [open, setOpen] = useState(false)
  const [widthText, setWidthText] = useState(() => String(loadSettings().chatWidth))
  const [showFullStats, setShowFullStats] = useState(() => loadSettings().showFullStats)
  const [sessionLimitMode, setSessionLimitMode] = useState<SessionLimitMode>(() => loadSettings().sessionLimitMode)
  const [sessionLimitCountText, setSessionLimitCountText] = useState(() => String(loadSettings().sessionLimitCount))

  useEffect(() => {
    ensureCardStyle()
  }, [])

  const handleSave = (): void => {
    const width = Number(widthText)
    if (!Number.isFinite(width)) return
    const count = Number(sessionLimitCountText)
    const settings = {
      chatWidth: Math.min(1920, Math.max(480, Math.round(width))),
      showFullStats,
      sessionLimitMode,
      sessionLimitCount: Number.isFinite(count)
        ? Math.min(999, Math.max(1, Math.round(count)))
        : DEFAULT_SETTINGS.sessionLimitCount,
    }
    saveSettings(settings)
    applySettings(settings)
    setWidthText(String(settings.chatWidth))
    setSessionLimitCountText(String(settings.sessionLimitCount))
  }

  const handleReset = (): void => {
    saveSettings(DEFAULT_SETTINGS)
    applySettings(DEFAULT_SETTINGS)
    setWidthText(String(DEFAULT_SETTINGS.chatWidth))
    setShowFullStats(DEFAULT_SETTINGS.showFullStats)
    setSessionLimitMode(DEFAULT_SETTINGS.sessionLimitMode)
    setSessionLimitCountText(String(DEFAULT_SETTINGS.sessionLimitCount))
  }

  return (
    <li className={open ? 'dsh-ccc-card dsh-ccc-card-open' : 'dsh-ccc-card'}>
      <button
        type="button"
        className="dsh-ccc-header"
        aria-expanded={open}
        onClick={() => { setOpen(current => !current) }}
      >
        <span className="dsh-ccc-head-text">
          <span className="dsh-ccc-name">聊天内容控制</span>
          <span className="dsh-ccc-description">聊天内容宽度、统计信息与会话显示</span>
        </span>
        <span className={open ? 'dsh-ccc-chevron dsh-ccc-chevron-open' : 'dsh-ccc-chevron'}>
          <IconChevronDownOutline14 />
        </span>
      </button>
      {open && (
        <div className="dsh-ccc-body">
          <Field label="聊天内容宽度 (px)" hint="480–1920，默认 864">
            <input
              className="dsh-ccc-input"
              type="text"
              inputMode="numeric"
              value={widthText}
              onChange={event => {
                setWidthText(event.target.value)
              }}
            />
          </Field>
          <div className="dsh-ccc-field">
            <button
              type="button"
              role="switch"
              aria-checked={showFullStats}
              className="dsh-ccc-switch-row"
              onClick={() => { setShowFullStats(current => !current) }}
            >
              <span className="dsh-ccc-switch-label">取消统计信息超长自动隐藏</span>
              <span className="dsh-ccc-switch-track" data-on={showFullStats || undefined} aria-hidden="true">
                <span className="dsh-ccc-switch-thumb" />
              </span>
            </button>
          </div>
          <Field label="侧边栏会话显示数量" hint="默认 5，可选全部或自定义 1–999">
            <select
              className="dsh-ccc-input"
              value={sessionLimitMode}
              onChange={event => {
                setSessionLimitMode(event.target.value as SessionLimitMode)
              }}
            >
              <option value="default">默认（5）</option>
              <option value="all">全部</option>
              <option value="custom">自定义</option>
            </select>
          </Field>
          {sessionLimitMode === 'custom' && (
            <Field label="自定义显示数量" hint="1–999">
              <input
                className="dsh-ccc-input"
                type="text"
                inputMode="numeric"
                value={sessionLimitCountText}
                onChange={event => {
                  setSessionLimitCountText(event.target.value)
                }}
              />
            </Field>
          )}
          <div className="dsh-ccc-footer">
            <button type="button" className="dsh-ccc-discard" onClick={handleReset}>恢复默认</button>
            <button type="button" className="dsh-ccc-save" onClick={handleSave}>保存</button>
          </div>
        </div>
      )}
    </li>
  )
}
