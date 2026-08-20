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
      display: flex;
      flex-direction: column;
      gap: 10px;
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
