import {useMemo} from 'react'
import {View} from 'react-native'
import psl from 'psl'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function splitApexDomain(hostname: string): [string, string] {
  const hostnamep = psl.parse(hostname)
  if (hostnamep.error || !hostnamep.listed || !hostnamep.domain) {
    return ['', hostname]
  }
  return [
    hostnamep.subdomain ? `${hostnamep.subdomain}.` : '',
    hostnamep.domain,
  ]
}

export default function LinkBox({href}: {href: string}) {
  const t = useTheme()
  const [scheme, hostname, rest] = useMemo(() => {
    try {
      const urlp = new URL(href)
      const [subdomain, apexdomain] = splitApexDomain(urlp.hostname)
      return [
        urlp.protocol + '//' + subdomain,
        apexdomain,
        urlp.pathname.replace(/\/$/, '') + urlp.search + urlp.hash,
      ]
    } catch {
      return ['', href, '']
    }
  }, [href])
  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        a.px_md,
        {paddingVertical: 10},
        a.rounded_sm,
        a.border,
      ]}>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        {scheme}
        <Text
          style={[a.text_md, a.leading_snug, t.atoms.text, a.font_semi_bold]}>
          {hostname}
        </Text>
        {rest}
      </Text>
    </View>
  )
}
