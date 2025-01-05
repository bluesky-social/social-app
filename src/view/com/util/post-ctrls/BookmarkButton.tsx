import React, {memo} from 'react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useRequireAuth} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Bookmark_Stroke2_Corner0_Rounded as Bookmark} from '#/components/icons/Bookmark'

interface Props {
  isBookmarked: boolean
  onBookmark: () => void
  big?: boolean
}

let BookmarkButton = ({
  isBookmarked,
  onBookmark,
  big,
}: Props): React.ReactNode => {
  const t = useTheme()
  const requireAuth = useRequireAuth()
  const dialogControl = Dialog.useDialogControl()
  const playHaptic = useHaptics()
  const color = React.useMemo(
    () => ({
      color: isBookmarked ? t.palette.positive_600 : t.palette.contrast_500,
    }),
    [isBookmarked, t.palette.positive_600, t.palette.contrast_500],
  )
  return (
    <>
      <Button
        testID="bookmarkBtn"
        onPress={() => {
          playHaptic('Light')
          requireAuth(() => dialogControl.open())
        }}
        onLongPress={() => {
          playHaptic('Heavy')
          requireAuth(() => onBookmark())
        }}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_xs,
          a.bg_transparent,
          {padding: 5},
        ]}
        label="Bookmark"
        hoverStyle={t.atoms.bg_contrast_25}
        shape="round"
        variant="ghost"
        color="secondary"
        hitSlop={POST_CTRL_HITSLOP}>
        <Bookmark style={color} width={big ? 22 : 18} />
      </Button>
    </>
  )
}
BookmarkButton = memo(BookmarkButton)
export {BookmarkButton}
