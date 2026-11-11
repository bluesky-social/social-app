import {space} from '#/alf/tokens'
import {
  getMessageComposerHorizontalPadding,
  getMessageComposerKeyboardOffsets,
} from './messageComposerLayout'

it('uses the expanded padding when the closed composer has no safe-area inset', () => {
  expect(getMessageComposerHorizontalPadding(0)).toEqual([space.md, space.md])
})

it.each([8, 20, 34])(
  'preserves an existing bottom safe-area inset of %s',
  inset => {
    expect(getMessageComposerHorizontalPadding(inset)).toEqual([
      inset,
      space.md,
    ])
  },
)

it.each([
  [0, 0, 0],
  [8, 8, 0],
  [16, 16, 0],
  [34, 16, 18],
])(
  'keeps a minimum closed bottom gap and matching chat offsets at inset %s',
  (bottomInset, expectedClosedOffset, expectedScrollOffset) => {
    const offsets = getMessageComposerKeyboardOffsets(bottomInset)

    expect(offsets.stickyViewClosedOffset).toBe(expectedClosedOffset)
    expect(offsets.chatScrollOffset).toBe(expectedScrollOffset)
    expect(bottomInset - offsets.stickyViewClosedOffset + space.lg).toBe(
      Math.max(bottomInset, space.lg),
    )
  },
)

it('sits the closed composer at a custom bottom gap', () => {
  // iPhone Duo: level with the vertical bar's rail, inside the bottom inset
  const offsets = getMessageComposerKeyboardOffsets(34, 24)

  expect(offsets.stickyViewClosedOffset).toBe(26)
  expect(offsets.chatScrollOffset).toBe(8)
  expect(34 - offsets.stickyViewClosedOffset + space.lg).toBe(24)
})
