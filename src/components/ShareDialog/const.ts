import {tokens} from '#/alf'
import {IS_LIQUID_GLASS} from '#/env'

/**
 * The share sheet's side padding, matching `Dialog.ScrollableInner`.
 * Horizontal rows use it as a negative margin so they scroll edge to edge
 * while their first item lines up with the rest of the sheet.
 */
export const SHEET_GUTTER = IS_LIQUID_GLASS
  ? tokens.space._2xl
  : tokens.space.xl
