import {type StyleProp, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useDialogControl} from '#/components/Dialog'
import type * as bsky from '#/types/bsky'
import {SupportInterstitial} from './SupportInterstitial'
import {SupportPill} from './SupportPill'

/**
 * The tappable Support button for viewers: the pill plus the disclosure sheet
 * it always opens. Never navigates directly - the interstitial is the only
 * way out.
 */
export function SupportButton({
  uri,
  creator,
  showProvider = false,
  size = 'large',
  fullWidth = false,
  onPress,
  style,
}: {
  uri: string
  creator?: bsky.profile.AnyProfileView
  /** Read "Support on Ko-fi" instead of just "Support". */
  showProvider?: boolean
  size?: 'small' | 'large'
  fullWidth?: boolean
  /** Fires before the interstitial opens, e.g. for feed interaction tracking. */
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const playHaptic = useHaptics()
  const control = useDialogControl()
  const domain = toNiceDomain(uri)

  return (
    <>
      <SupportPill
        uri={uri}
        label={l`Support ${creator?.handle ?? domain}`}
        showProvider={showProvider}
        size={size}
        fullWidth={fullWidth}
        style={style}
        onPress={() => {
          playHaptic('Light')
          onPress?.()
          control.open()
        }}
      />
      <SupportInterstitial control={control} uri={uri} creator={creator} />
    </>
  )
}
