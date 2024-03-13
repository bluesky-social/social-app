import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {UserAvatar} from '../util/UserAvatar'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSession} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'

export function ComposePrompt({onPressCompose}: {onPressCompose: () => void}) {
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isDesktop} = useWebMediaQueries()
  return (
    <TouchableOpacity
      testID="replyPromptBtn"
      style={[pal.view, pal.border, styles.prompt]}
      onPress={() => onPressCompose()}
      accessibilityRole="button"
      accessibilityLabel={_(msg`Compose reply`)}
      accessibilityHint={_(msg`Opens composer`)}>
      <UserAvatar avatar={profile?.avatar} size={38} />
      <Text
        type="xl"
        style={[
          pal.text,
          isDesktop ? styles.labelDesktopWeb : styles.labelMobile,
        ]}>
        <Trans>Write your reply</Trans>
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  prompt: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  labelMobile: {
    paddingLeft: 12,
  },
  labelDesktopWeb: {
    paddingLeft: 12,
  },
})
