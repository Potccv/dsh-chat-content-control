/** Shared token-ratio helper for the chat content control plugin. */

/** Format an input/output ratio as `N:1`; null when there is no output. */
export function formatIoRatio(input: number, output: number): string | null {
  if (output <= 0) return null
  const ratio = Math.max(0, input) / output
  const shown = ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10
  return `${shown}:1`
}
