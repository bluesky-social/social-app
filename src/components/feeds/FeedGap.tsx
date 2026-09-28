import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

/**
 * Marks where posts are missing from a feed: everything above it is newer
 * than everything below it, but some posts between the two have not been
 * loaded. Pressing it loads them, which is up to `onPress`.
 */
export function FeedGap({
  onPress,
  isLoading = false,
  hasFailed = false,
  hideTopBorder = false,
}: {
  onPress: () => void
  /** While the missing posts are being fetched: shows progress, disabled. */
  isLoading?: boolean
  /** The last attempt to load them failed, and pressing it tries again. */
  hasFailed?: boolean
  /** For the first row of a feed, as posts do. */
  hideTopBorder?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Button
      testID="feedGapBtn"
      label={hasFailed ? l`Couldn’t load posts. Try again` : l`Show more posts`}
      accessibilityHint={l`Loads the posts missing between here and the posts below`}
      disabled={isLoading}
      onPress={onPress}
      style={[
        a.gap_sm,
        a.px_lg,
        a.py_lg,
        !hideTopBorder && a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      {({hovered, pressed}) => (
        <>
          <SubtleHover hover={(hovered || pressed) && !isLoading} native />
          {isLoading && <Loader size="sm" />}
          <Text
            style={[
              a.text_md,
              a.font_semi_bold,
              isLoading ? t.atoms.text_contrast_medium : t.atoms.text_link,
            ]}>
            {hasFailed ? (
              <Trans>Couldn’t load posts. Try again</Trans>
            ) : (
              <Trans>Show more posts</Trans>
            )}
          </Text>
        </>
      )}
    </Button>
  )
}
