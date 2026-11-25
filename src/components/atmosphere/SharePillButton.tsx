import {View} from 'react-native'

import {shareUrl} from '#/lib/sharing'
import {atoms as a, useTheme} from '#/alf'
import {useCardPillColor} from '#/components/atmosphere/cardSurface'
import {Button} from '#/components/Button'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/Arrow'
import {IS_WEB} from '#/env'

/**
 * A share button sized and colored like `LikeButton`'s pill. It opens the
 * share sheet: on web the browser's own where it has one, otherwise the link
 * is copied.
 */
export function SharePillButton({
  url,
  label,
  onShare,
  testID,
}: {
  url: string
  label: string
  /** Called before the share sheet opens. */
  onShare?: () => void
  testID?: string
}) {
  const t = useTheme()
  const pillColor = useCardPillColor()
  return (
    <Button
      testID={testID}
      label={label}
      accessibilityHint=""
      hitSlop={4}
      style={[a.rounded_full]}
      onPress={() => {
        onShare?.()
        shareLink(url)
      }}>
      {({hovered, focused, pressed}) => {
        const active = hovered || focused || pressed
        return (
          <View
            style={[
              a.rounded_full,
              {paddingVertical: 8, paddingHorizontal: 14},
              active
                ? {backgroundColor: t.palette.primary_50}
                : {backgroundColor: pillColor},
            ]}>
            <ShareIcon
              size="md"
              fill={
                active
                  ? t.palette.primary_700
                  : t.atoms.text_contrast_medium.color
              }
            />
          </View>
        )
      }}
    </Button>
  )
}

function shareLink(url: string) {
  if (IS_WEB && typeof navigator?.share === 'function') {
    // Must be called synchronously in the press handler, or browsers block it
    navigator.share({url}).catch((e: unknown) => {
      // Dismissing the sheet is fine; otherwise copying still shares the link
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        void shareUrl(url)
      }
    })
    return
  }
  void shareUrl(url)
}
