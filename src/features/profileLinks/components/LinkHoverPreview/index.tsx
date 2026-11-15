/** Hover only exists on web; on native, long press shows the destination. */
export function LinkHoverPreview({
  children,
}: {
  url: string
  children: React.ReactNode
}) {
  return children
}
