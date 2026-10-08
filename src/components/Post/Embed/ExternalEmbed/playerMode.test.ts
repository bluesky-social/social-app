import {
  type PlayerMode,
  playerModeAfterActivate,
  playerModeAfterFullscreenChange,
  shouldWatchVisibility,
} from './playerMode'

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

describe('playerModeAfterActivate', () => {
  it.each<[PlayerMode, PlayerMode]>([
    ['inactive', 'inline'],
    ['inline', 'inline'],
    ['fullscreen', 'fullscreen'],
  ])('%s -> %s', (mode, expected) => {
    expect(playerModeAfterActivate(mode)).toBe(expected)
  })
})

describe('shouldWatchVisibility', () => {
  it.each<[PlayerMode, boolean]>([
    ['inactive', false],
    ['inline', true],
    ['fullscreen', false],
  ])('%s -> %s', (mode, expected) => {
    expect(shouldWatchVisibility(mode)).toBe(expected)
  })
})
