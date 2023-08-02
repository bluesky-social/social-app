import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {ModerationUI} from '@atproto/api'
import {Text} from '../text/Text'
import {InfoCircleIcon} from 'lib/icons'
import {describeModerationCause} from 'lib/moderation'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'

export function ContentHider({
  testID,
  moderation,
  ignoreMute,
  style,
  childContainerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  moderation: ModerationUI
  ignoreMute?: boolean
  style?: StyleProp<ViewStyle>
  childContainerStyle?: StyleProp<ViewStyle>
}>) {
  const store = useStores()
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)

  if (!moderation.blur || (ignoreMute && moderation.cause?.type === 'muted')) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  const desc = describeModerationCause(moderation.cause, 'content')
  return (
    <View testID={testID} style={style}>
      <Pressable
        onPress={() => {
          if (!moderation.noOverride) {
            setOverride(v => !v)
          }
        }}
        accessibilityRole="button"
        accessibilityHint={override ? 'Hide the content' : 'Show the content'}
        accessibilityLabel=""
        style={[styles.cover, pal.viewLight]}>
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
          <InfoCircleIcon size={18} style={pal.text} />
        </Pressable>
        <Text type="lg" style={pal.text}>
          {desc.name}
        </Text>
        {!moderation.noOverride && (
          <View style={styles.showBtn}>
            <Text type="xl" style={pal.link}>
              {override ? 'Hide' : 'Show'}
            </Text>
          </View>
        )}
      </Pressable>
      {override && <View style={childContainerStyle}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  cover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: isDesktopWeb ? 18 : 22,
  },
  showBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
})
