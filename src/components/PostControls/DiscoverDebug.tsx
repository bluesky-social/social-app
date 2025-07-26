import {Pressable} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {t} from '@lingui/macro'

import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import {useGate} from '#/lib/statsig/statsig'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_INTERNAL} from '#/env'

export function DiscoverDebug({
  feedContext,
}: {
  feedContext: string | undefined
}) {
  const {currentAccount} = useSession()
  const {gtMobile} = useBreakpoints()
  const gate = useGate()
  const isDiscoverDebugUser =
    IS_INTERNAL ||
    DISCOVER_DEBUG_DIDS[currentAccount?.did || ''] ||
    gate('debug_show_feedcontext')
  const theme = useTheme()

  return (
    isDiscoverDebugUser &&
    feedContext && (
      <Pressable
        accessible={false}
        hitSlop={10}
        style={[
          a.absolute,
          a.bottom_0,
          {zIndex: 1000},
          gtMobile ? a.right_0 : a.left_0,
        ]}
        onPress={e => {
          e.stopPropagation()
          Clipboard.setStringAsync(feedContext)
          Toast.show(t`Copied to clipboard`, 'clipboard-check')
        }}>
        <Text
          style={{
            color: theme.palette.contrast_400,
            fontSize: 7,
          }}>
          {feedContext}
        </Text>
      </Pressable>
    )
  )
}
