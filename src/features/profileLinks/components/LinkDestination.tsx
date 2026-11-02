import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/**
 * The full destination of a link, with the domain in bold so a misleading
 * title can't hide where it goes.
 */
export function LinkDestination({url}: {url: string}) {
  const t = useTheme()
  let host = url
  let rest = ''
  try {
    const parsed = new URL(url)
    host = parsed.hostname.replace(/^www\./, '')
    rest = parsed.pathname.replace(/\/$/, '') + parsed.search
  } catch {}
  return (
    <Text
      numberOfLines={2}
      style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
      <Text style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]}>
        {host}
      </Text>
      {rest}
    </Text>
  )
}
