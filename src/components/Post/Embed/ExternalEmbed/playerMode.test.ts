import {type PlayerMode, playerModeAfterFullscreenChange} from './playerMode'

describe('playerModeAfterFullscreenChange', () => {
  it.each<[PlayerMode, boolean, PlayerMode]>([
    ['inline', true, 'fullscreen'],
    ['fullscreen', false, 'inline'],
    ['fullscreen', true, 'fullscreen'],
    ['inline', false, 'inline'],
  ])('%s + isFullscreen=%s -> %s', (mode, isFullscreen, expected) => {
    expect(playerModeAfterFullscreenChange(mode, isFullscreen)).toBe(expected)
  })

  it.each([true, false])(
    'ignores isFullscreen=%s while inactive',
    isFullscreen => {
      expect(playerModeAfterFullscreenChange('inactive', isFullscreen)).toBe(
        'inactive',
      )
    },
  )
})
