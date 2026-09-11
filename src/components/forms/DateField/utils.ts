// we need the date in the form yyyy-MM-dd to pass to the input
export function toSimpleDateString(date: Date | string): string {
  const _date = typeof date === 'string' ? new Date(date) : date
  return _date.toISOString().split('T')[0]
}

/**
 * Returns a Date at local midnight of the given calendar day. Use when a
 * native API resolves timestamps in the device time zone rather than UTC, so
 * the intended YYYY-MM-DD is preserved regardless of the device offset.
 */
export function toLocalMidnight(date: Date | string): Date {
  const [year, month, day] = toSimpleDateString(date).split('-').map(Number)
  return new Date(year, month - 1, day)
}
