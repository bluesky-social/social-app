/** Hover only exists on web; native renders the children as is. */
export function HoverTooltip({
  children,
}: {
  label: string
  color?: 'default' | 'primary'
  children: React.ReactNode
}) {
  return children
}
