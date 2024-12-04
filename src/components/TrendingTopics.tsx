import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Link as InternalLink, LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Grid({topics}: {topics: string[]}) {
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.px_sm, a.py_sm]}>
      {topics.map(topic => (
        <Item key={topic} topic={topic} />
      ))}
    </View>
  )
}

export function Item({topic}: {topic: string}) {
  return (
    <Link topic={topic}>
      <Card topic={topic} />
    </Link>
  )
}

export function Card({topic}: {topic: string}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        a.gap_xs,
        a.px_md,
        a.py_md,
        a.border,
        t.atoms.border_contrast_medium,
        a.rounded_md,
      ]}>
      <Topic topic={topic} />
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

export function Topic({topic}: {topic: string}) {
  return (
    <View style={[a.flex_1]}>
      <Text
        emoji
        style={[a.text_md, a.font_bold, a.leading_snug, a.self_start]}
        numberOfLines={1}>
        {topic}
      </Text>
    </View>
  )
}
