import {space} from '#/alf/tokens'
import {getMessageComposerHorizontalPadding} from './messageComposerLayout'

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
