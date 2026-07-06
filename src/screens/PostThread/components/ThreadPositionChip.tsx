import {type ThreadPostPosition} from '#/screens/PostThread/reader'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/**
 * Position indicator shown at the end of a post's text when it is part of a
 * self-thread in linear view, e.g. "(2/12)". Rendered inline via RichText's
 * `trailing` prop so it flows with the last line of text. Not translated: it
 * is purely numeric.
 */
export function ThreadPositionChip({
  threadPosition,
}: {
  threadPosition: ThreadPostPosition
}) {
  const t = useTheme()

  return (
    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
      {` (${threadPosition.position}/${threadPosition.postCount})`}
    </Text>
  )
}
