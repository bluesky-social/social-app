import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import {type GapRowStatus, gapRowStatusAfterFill} from './gapRowStatus'
import {type GapFillOutcome} from './queries/postFeed'

/**
 * The row at a gap in Following, where some posts between the ones above it
 * and the ones below haven't been loaded. While the gap is open it offers to
 * load them with `onFill`, and once it's filled it stays, empty.
 */
export function GapRow({
  isOpen,
  onFill,
  hideTopBorder = false,
}: {
  isOpen: boolean
  onFill: () => Promise<GapFillOutcome>
  /** For the first row of a feed, as posts do. */
  hideTopBorder?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [status, setStatus] = useState<GapRowStatus>('idle')
  const isFilling = status === 'filling'

  const onPress = async () => {
    if (isFilling) {
      return
    }
    setStatus('filling')
    setStatus(gapRowStatusAfterFill(await onFill()))
  }

  return (
    /*
     * One host view in every state, which is never flattened away, as
     * VirtualizedList does for its header with `collapsable={false}`. The list
     * may be anchored on this row when its gap is filled, so it stays, empty,
     * rather than going: iOS could otherwise reuse its native view for a new
     * row in the same commit, and `maintainVisibleContentPosition` would take
     * that row's frame for the anchor's and jump.
     */
    <View collapsable={false}>
      {isOpen && (
        <Button
          testID="followingGapBtn"
          label={
            isFilling
              ? l`Loading more posts`
              : status === 'failed'
                ? l`Couldn’t load more posts. Try again`
                : l`Show more posts`
          }
          accessibilityHint={l`Loads the posts missing between here and the posts below`}
          aria-busy={isFilling}
          disabled={isFilling}
          onPress={() => void onPress()}
          style={[
            a.gap_sm,
            a.px_lg,
            a.py_lg,
            !hideTopBorder && a.border_t,
            t.atoms.border_contrast_low,
          ]}>
          {({hovered, pressed}) => (
            <>
              <SubtleHover hover={(hovered || pressed) && !isFilling} native />
              {isFilling && <Loader size="sm" />}
              <Text
                style={[
                  a.text_md,
                  a.font_semi_bold,
                  isFilling ? t.atoms.text_contrast_medium : t.atoms.text_link,
                ]}>
                {status === 'failed' ? (
                  <Trans>Couldn’t load more posts. Try again</Trans>
                ) : (
                  <Trans>Show more posts</Trans>
                )}
              </Text>
            </>
          )}
        </Button>
      )}
    </View>
  )
}
