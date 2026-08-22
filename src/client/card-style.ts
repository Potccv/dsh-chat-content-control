/** Injected CSS for the Settings > Plugins card, mirroring the shared PluginCard chrome. */

const STYLE_ID = 'dsh-chat-content-control-card-style'

let injected = false

/** Ensure the card stylesheet is present in the document (idempotent). */
export function ensureCardStyle(): void {
  if (injected || typeof document === 'undefined') return
  injected = true
  if (document.getElementById(STYLE_ID) !== null) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .dsh-ccc-card {
      list-style: none;
      border: 1px solid var(--dsw-alias-border-l2);
      border-radius: 12px;
      background: var(--dsw-alias-bg-layer-3);
      transition: border-color .16s, background .16s;
    }
    .dsh-ccc-card:hover {
      border-color: var(--dsw-alias-label-dimmed);
    }
    .dsh-ccc-card-open {
      background: var(--dsw-alias-bg-layer-2);
      border-color: var(--dsw-alias-label-dimmed);
    }
    .dsh-ccc-header {
      width: 100%;
      appearance: none;
      border: 0;
      background: none;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
    }
    .dsh-ccc-header:focus-visible {
      outline: 2px solid var(--dsw-alias-brand-primary);
      outline-offset: -2px;
    }
    .dsh-ccc-head-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dsh-ccc-name {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--dsw-alias-label-primary);
    }
    .dsh-ccc-description {
      font-size: 13px;
      line-height: 1.5;
      color: var(--dsw-alias-label-tertiary);
    }
    .dsh-ccc-chevron {
      flex: none;
      color: var(--dsw-alias-label-tertiary);
      transition: transform .16s;
    }
    .dsh-ccc-chevron-open {
      transform: rotate(180deg);
    }
    .dsh-ccc-body {
      border-top: 1px solid var(--dsw-alias-border-l2);
      margin: 0 16px;
      padding-bottom: 8px;
    }
    .dsh-ccc-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 0;
    }
    .dsh-ccc-field + .dsh-ccc-field {
      border-top: 1px solid var(--dsw-alias-border-l2);
    }
    .dsh-ccc-field-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dsh-ccc-field-label {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--dsw-alias-label-primary);
    }
    .dsh-ccc-input {
      box-sizing: border-box;
      width: 100%;
      height: 34px;
      padding: 0 12px;
      border: 1px solid var(--dsw-alias-border-l2);
      border-radius: 8px;
      background: var(--dsw-alias-bg-layer-3);
      font: inherit;
      font-size: 13px;
      line-height: 1.5;
      color: var(--dsw-alias-label-primary);
    }
    .dsh-ccc-input:focus-visible {
      outline: none;
      border-color: var(--dsw-alias-brand-primary);
    }
    .dsh-ccc-field-hint {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: var(--dsw-alias-label-tertiary);
    }
    .dsh-ccc-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--dsw-alias-label-primary);
    }
    .dsh-ccc-switch-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      font: inherit;
      color: var(--dsw-alias-label-primary);
      cursor: pointer;
      text-align: left;
    }
    .dsh-ccc-switch-row:focus-visible {
      outline: 2px solid var(--dsw-alias-brand-primary);
      outline-offset: 2px;
      border-radius: 8px;
    }
    .dsh-ccc-switch-track {
      position: relative;
      flex: none;
      width: 36px;
      height: 20px;
      border-radius: 999px;
      background: var(--dsw-alias-border-l2);
      transition: background-color 120ms var(--ds-ease-in-out);
    }
    .dsh-ccc-switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--dsw-alias-bg-layer-1);
      transition: transform 120ms var(--ds-ease-in-out);
    }
    .dsh-ccc-switch-track[data-on='true'] {
      background: var(--dsw-alias-state-business-primary);
    }
    .dsh-ccc-switch-track[data-on='true'] .dsh-ccc-switch-thumb {
      transform: translateX(16px);
    }
    .dsh-ccc-switch-label {
      font-size: 13px;
      line-height: 1.5;
      color: var(--dsw-alias-label-primary);
    }
    .dsh-ccc-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 0 4px;
      border-top: 1px solid var(--dsw-alias-border-l2);
    }
    .dsh-ccc-discard,
    .dsh-ccc-save {
      appearance: none;
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 5px 14px;
      font: inherit;
      font-size: 13px;
      line-height: 1.5;
      cursor: pointer;
    }
    .dsh-ccc-discard {
      border-color: var(--dsw-alias-border-l2);
      background: none;
      color: var(--dsw-alias-label-secondary);
    }
    .dsh-ccc-discard:hover:not(:disabled) {
      color: var(--dsw-alias-label-primary);
      border-color: var(--dsw-alias-label-dimmed);
    }
    .dsh-ccc-save {
      background: var(--dsw-alias-label-primary);
      color: var(--dsw-alias-bg-layer-3);
    }
    .dsh-ccc-discard:focus-visible,
    .dsh-ccc-save:focus-visible {
      outline: 2px solid var(--dsw-alias-brand-primary);
      outline-offset: 1px;
    }
  `
  document.head.appendChild(style)
}
