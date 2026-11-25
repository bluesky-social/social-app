/** Hover only exists on web; native renders the children as is. */
export function HoverTooltip({
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return children
}
