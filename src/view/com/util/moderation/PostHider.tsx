import React, {ComponentProps} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {addStyle} from 'lib/styles'
import {ModerationBehaviorCode, ModerationBehavior} from 'lib/labeling/types'

interface Props extends ComponentProps<typeof Link> {
  // testID?: string
  // href?: string
  // style: StyleProp<ViewStyle>
  moderation: ModerationBehavior
}

export function PostHider({
  testID,
  href,
  moderation,
  style,
  children,
  ...props
}: Props) {
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)
  const bg = override ? pal.viewLight : pal.view

  if (moderation.behavior === ModerationBehaviorCode.Hide) {
    return null
  }

  if (moderation.behavior === ModerationBehaviorCode.Warn) {
    return (
      <>
        <View style={[styles.description, bg, pal.border]}>
          <FontAwesomeIcon
            icon={['far', 'eye-slash']}
            style={[styles.icon, pal.text]}
          />
          <Text type="md" style={pal.textLight}>
            {moderation.reason || 'Content warning'}
          </Text>
          <TouchableOpacity
            style={styles.showBtn}
            onPress={() => setOverride(v => !v)}
            accessibilityRole="button">
            <Text type="md" style={pal.link}>
              {override ? 'Hide' : 'Show'} post
            </Text>
          </TouchableOpacity>
        </View>
        {override && (
          <View style={[styles.childrenContainer, pal.border, bg]}>
            <Link
              testID={testID}
              style={addStyle(style, styles.child)}
              href={href}
              noFeedback>
              {children}
            </Link>
          </View>
        )}
      </>
    )
  }

  // NOTE: any further label enforcement should occur in ContentContainer
  return (
    <Link
      testID={testID}
      style={style}
      href={href}
      noFeedback
      accessible={false}
      {...props}>
      {children}
    </Link>
  )
}

const styles = StyleSheet.create({
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  showBtn: {
    marginLeft: 'auto',
  },
  childrenContainer: {
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  child: {
    borderWidth: 1,
    borderRadius: 12,
  },
})
