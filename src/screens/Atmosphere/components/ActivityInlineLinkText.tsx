import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'

export function ActivityInlineLinkText({
  children,
  label,
  to,
  disableMismatchWarning,
}: React.PropsWithChildren<{
  label: string
  to: string
  disableMismatchWarning?: boolean
}>) {
  const t = useTheme()
  return (
    <InlineLinkText
      label={label}
      to={to}
      disableMismatchWarning={disableMismatchWarning}
      style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]}
      emoji>
      {children}
    </InlineLinkText>
  )
}
