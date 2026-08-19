/**
 * Pull a list out of whatever envelope the API returns.
 *
 * The admin endpoints have shipped several shapes over time — a bare array,
 * `{ items }`, `{ data: { items } }` — and each page previously hard-coded one,
 * so any change produced a blank screen instead of a list.
 */
export function unwrapList<T>(payload: unknown): T[] {
  const seen = new Set<unknown>()
  let node: unknown = payload

  while (node && typeof node === 'object' && !Array.isArray(node) && !seen.has(node)) {
    seen.add(node)
    const record = node as Record<string, unknown>
    node = record.items ?? record.data ?? record.result ?? null
  }

  return Array.isArray(node) ? (node as T[]) : []
}
