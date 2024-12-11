import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useGutters, useTheme, ViewStyleProp} from '#/alf'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Topic({topic, style}: {topic: string} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_sm,
        a.px_md,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_medium,
        style,
      ]}>
      <Text style={[a.text_md, a.font_bold, a.leading_snug]} numberOfLines={1}>
        {topic}
      </Text>
    </View>
  )
}

export function Link({
  topic,
  children,
  style,
  ...rest
}: {
  topic: string
} & Omit<LinkProps, 'to' | 'label'>) {
  const {_} = useLingui()
  return (
    <InternalLink
      label={_(msg`Search posts that include ${topic}`)}
      to={{
        screen: 'Search',
        params: {q: topic},
      }}
      style={[a.flex_col, style]}
      {...rest}>
      {children}
    </InternalLink>
  )
}

export function Grid({topics}: {topics: string[]}) {
  const t = useTheme()
  const gutters = useGutters([0, 'compact'])
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm, gutters]}>
      {topics.map(topic => (
        <Link key={topic} topic={topic}>
          {({hovered}) => (
            <Topic
              topic={topic}
              style={[
                hovered && [
                  t.atoms.border_contrast_high,
                  t.atoms.bg_contrast_25,
                ],
              ]}
            />
          )}
        </Link>
      ))}
    </View>
  )
}
