import React from 'react'
import {StyleSheet, TouchableOpacity} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import hairlineWidth = StyleSheet.hairlineWidth

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
      <UserAvatar
        avatar={profile?.avatar}
        size={38}
        type={profile?.associated?.labeler ? 'labeler' : 'user'}
      />
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
    borderTopWidth: hairlineWidth,
  },
  labelMobile: {
    paddingLeft: 12,
  },
  labelDesktopWeb: {
    paddingLeft: 12,
  },
})
