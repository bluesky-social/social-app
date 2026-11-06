import {
  getDuoCompactHeaderLayout,
  isDuoFoldedDisplay,
} from './duoFoldedNavigation'

describe('Duo display selection', () => {
  it.each([
    [466, 678],
    [678, 466],
  ])('uses the outer display at %s x %s', (width, height) => {
    expect(isDuoFoldedDisplay(width, height)).toBe(true)
  })
  it.each([
    [951, 669],
    [669, 951],
    [0, 678],
    [466, 0],
    [800, 678],
  ])('excludes inner and invalid displays at %s x %s', (width, height) => {
    expect(isDuoFoldedDisplay(width, height)).toBe(false)
  })
})

describe('compact folded headers', () => {
  const folded = {enabled: true, width: 466, height: 678, topInset: 82}

  it('fits the row into the existing status height without placing controls underneath the status cluster', () => {
    const layout = getDuoCompactHeaderLayout(folded)!
    expect(layout.topPadding + layout.headerHeight).toBe(folded.topInset)
    expect(layout.headerHeight).toBe(48)
    const contentWidth = folded.width - 64
    expect(contentWidth - layout.headerRightPadding).toBeLessThanOrEqual(
      folded.width - 250,
    )
  })

  it.each([
    {enabled: false},
    {width: 678, height: 466, topInset: 0},
    {topInset: 0},
    {topInset: 48},
  ])('keeps the normal header for %o', overrides => {
    expect(getDuoCompactHeaderLayout({...folded, ...overrides})).toBeNull()
  })

  it('accounts for the safe area already reserved inside the rail', () => {
    expect(
      getDuoCompactHeaderLayout({...folded, rightInset: 20})!
        .headerRightPadding,
    ).toBe(166)
  })
})

it('reserves the whole status exclusion for full-screen media without a rail', () => {
  const layout = getDuoCompactHeaderLayout({
    enabled: true,
    width: 466,
    height: 678,
    topInset: 82,
    railWidth: 0,
  })!
  expect(layout.headerRightPadding).toBe(250)
  expect(466 - layout.headerRightPadding).toBe(216)
})
