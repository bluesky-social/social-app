export function formatCount(count: number) {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
    // `1,953` shouldn't be rounded up to 2k, it should be truncated.
    // @ts-ignore
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#roundingmode
    roundingMode: 'trunc',
  }).format(count)
}
