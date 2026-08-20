import { useEffect, useState } from 'react'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the settings.plugin.item SlotMap declaration.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import { ensureCardStyle } from './card-style.ts'
import {
  DEFAULT_SETTINGS, applySettings, loadSettings, saveSettings,
} from './settings.ts'

type Props = PropsRuntime<'settings.plugin.item'>

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
  lineHeight: 1.5,
}

const inputStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  padding: '5px 10px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 8,
  background: 'var(--dsw-alias-bg-base)',
  color: 'inherit',
  fontSize: 13,
  lineHeight: 1.5,
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

  useEffect(() => {
    ensureCardStyle()
  }, [])

  const handleSave = (): void => {
    const width = Number(widthText)
    if (!Number.isFinite(width)) return
    const settings = {
      chatWidth: Math.min(1920, Math.max(480, Math.round(width))),
      showFullStats,
    }
    saveSettings(settings)
    applySettings(settings)
    setWidthText(String(settings.chatWidth))
  }

  const handleReset = (): void => {
    saveSettings(DEFAULT_SETTINGS)
    applySettings(DEFAULT_SETTINGS)
    setWidthText(String(DEFAULT_SETTINGS.chatWidth))
    setShowFullStats(DEFAULT_SETTINGS.showFullStats)
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
          <span className="dsh-ccc-description">聊天内容宽度与统计信息显示</span>
        </span>
        <span className={open ? 'dsh-ccc-chevron dsh-ccc-chevron-open' : 'dsh-ccc-chevron'}>
          <IconChevronDownOutline14 />
        </span>
      </button>
      {open && (
        <div className="dsh-ccc-body">
          <label style={labelStyle}>
            <span>聊天内容宽度 (px)</span>
            <input
              type="number"
              min={480}
              max={1920}
              step={8}
              value={widthText}
              style={inputStyle}
              onChange={event => {
                setWidthText(event.target.value)
              }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showFullStats}
              onChange={event => {
                setShowFullStats(event.target.checked)
              }}
            />
            <span>取消统计信息超长自动隐藏</span>
          </label>
          <div className="dsh-ccc-footer">
            <button type="button" className="dsh-ccc-discard" onClick={handleReset}>恢复默认</button>
            <button type="button" className="dsh-ccc-save" onClick={handleSave}>保存</button>
          </div>
        </div>
      )}
    </li>
  )
}
