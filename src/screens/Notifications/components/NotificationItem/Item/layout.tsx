import {createContext, useContext} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'

import {atoms as a} from '#/alf'

/**
 * Which design the notification rows use. `default` is the original
 * Notifications v2 design. `classic` is the conservative one, behind the
 * `notifications_v2:classic_layout:enable` gate: v1-style icons in the left
 * column of reaction rows, and the gutters, left column and quote cards of a
 * post in a feed.
 */
export type RowLayout = 'default' | 'classic'

const RowLayoutContext = createContext<RowLayout>('default')

/**
 * Sets the layout for every row beneath it.
 */
export const RowLayoutProvider = RowLayoutContext.Provider

export function useRowLayout() {
  return useContext(RowLayoutContext)
}

export function useIsClassicLayout() {
  return useRowLayout() === 'classic'
}

/*
 * The classic layout uses the horizontal metrics of a post in a feed
 * (`PostFeedItem`), so that a row's left column and text line up with the
 * posts around it in the app.
 */

/**
 * The padding before a row's left column, and after its content.
 */
export const CLASSIC_PADDING_LEFT = 10
export const CLASSIC_PADDING_RIGHT = 15

/**
 * A post's left column: its avatar, with space before and after it.
 */
export const CLASSIC_AVATAR_SIZE = 42
export const CLASSIC_AVATAR_INSET = 8
export const CLASSIC_AVATAR_GAP = 10
export const CLASSIC_LEAD_WIDTH =
  CLASSIC_AVATAR_INSET + CLASSIC_AVATAR_SIZE + CLASSIC_AVATAR_GAP

/**
 * Where a row's text starts, measured from the row's edge. Posts put theirs
 * here too.
 */
export const CLASSIC_CONTENT_START = CLASSIC_PADDING_LEFT + CLASSIC_LEAD_WIDTH

/**
 * The padding and spacing of an `Item.Root`. In the classic layout the left
 * column carries its own padding, so there is no gap after it.
 */
export function useRowGutterStyle(): StyleProp<ViewStyle> {
  return useIsClassicLayout()
    ? {
        paddingLeft: CLASSIC_PADDING_LEFT,
        paddingRight: CLASSIC_PADDING_RIGHT,
      }
    : [a.gap_lg, a.px_lg]
}

/**
 * The horizontal padding of a section header, which lines its text up with
 * the avatars of the rows below it.
 */
export function useHeaderGutterStyle(): StyleProp<ViewStyle> {
  return useIsClassicLayout()
    ? {
        paddingLeft: CLASSIC_PADDING_LEFT + CLASSIC_AVATAR_INSET,
        paddingRight: CLASSIC_PADDING_RIGHT,
      }
    : a.px_lg
}
