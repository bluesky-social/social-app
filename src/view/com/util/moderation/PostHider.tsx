import React, {ComponentProps} from 'react'
import {StyleSheet, Pressable, View} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {usePalette} from 'lib/hooks/usePalette'
import {Link} from '../Link'
import {Text} from '../text/Text'
import {addStyle} from 'lib/styles'
import {describeModerationCause} from 'lib/strings/moderation'
import {InfoCircleIcon} from 'lib/icons'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'

const HIT_SLOP = {top: 16, left: 40, bottom: 16, right: 16}

interface Props extends ComponentProps<typeof Link> {
  // testID?: string
  // href?: string
  // style: StyleProp<ViewStyle>
  moderation: ModerationUI
}

export function PostHider({
  testID,
  href,
  moderation,
  style,
  children,
  ...props
}: Props) {
  const store = useStores()
  const pal = usePalette('default')
  const [override, setOverride] = React.useState(false)

  if (!moderation.blur) {
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

  const desc = describeModerationCause(moderation.cause)
  return (
    <>
      <View style={[styles.description, pal.viewLight]}>
        <InfoCircleIcon size={24} style={pal.text} />
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
      {override && (
        <View style={[styles.childrenContainer, pal.border, pal.viewLight]}>
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

const styles = StyleSheet.create({
  description: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: isDesktopWeb ? 18 : 22,
    marginTop: 1,
  },
  showBtn: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  childrenContainer: {
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  child: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderRadius: 8,
  },
})
