import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {ModerationUI} from '@atproto/api'
import {Text} from '../text/Text'
import {InfoCircleIcon} from 'lib/icons'
import {describeModerationCause} from 'lib/strings/moderation'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'

const HIT_SLOP = {top: 16, left: 40, bottom: 16, right: 16}

export function ContentHider({
  testID,
  moderation,
  showIcon,
  style,
  childContainerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  moderation: ModerationUI
  showIcon?: boolean
  style?: StyleProp<ViewStyle>
  childContainerStyle?: StyleProp<ViewStyle>
}>) {
  const store = useStores()
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)

  if (!moderation.blur) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  const desc = describeModerationCause(moderation.cause)
  return (
    <View testID={testID} style={style}>
      <View style={[styles.cover, pal.viewLight]}>
        {showIcon && <InfoCircleIcon size={24} style={pal.text} />}
        <Pressable
          onPress={() => {
            store.shell.openModal({
              name: 'moderation-details',
              context: 'content',
              moderation,
            })
          }}
          accessibilityRole="button"
          accessibilityLabel="Learn more about this warning"
          accessibilityHint="">
          <Text type="lg" style={pal.text}>
            {desc.name}
          </Text>
          <Text type="md" style={pal.textLight}>
            Learn more
          </Text>
        </Pressable>
        {!moderation.noOverride && (
          <Pressable
            style={styles.showBtn}
            onPress={() => {
              if (!moderation.noOverride) {
                setOverride(v => !v)
              }
            }}
            accessibilityRole="button"
            accessibilityHint={
              override ? 'Hide the content' : 'Show the content'
            }
            accessibilityLabel=""
            hitSlop={HIT_SLOP}>
            <Text type="xl" style={pal.link}>
              {override ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>
      {override && <View style={childContainerStyle}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 8,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: isDesktopWeb ? 18 : 22,
  },
  showBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
})
