import {
  composePronouns,
  parsePronouns,
  togglePronoun,
} from './pronounSuggestions'

const SUGGESTIONS = ['she/her', 'he/him', 'they/them']
const SHE = 0
const HE = 1
const THEY = 2

describe('parsePronouns', () => {
  it('treats empty text as nothing picked', () => {
    expect(parsePronouns('', SUGGESTIONS)).toEqual([])
    expect(parsePronouns('   ', SUGGESTIONS)).toEqual([])
  })

  it('matches a full form', () => {
    expect(parsePronouns('she/her', SUGGESTIONS)).toEqual([SHE])
    expect(parsePronouns('they/them', SUGGESTIONS)).toEqual([THEY])
  })

  it('matches combined subject forms in order', () => {
    expect(parsePronouns('she/they', SUGGESTIONS)).toEqual([SHE, THEY])
    expect(parsePronouns('they/she', SUGGESTIONS)).toEqual([THEY, SHE])
    expect(parsePronouns('she/he/they', SUGGESTIONS)).toEqual([SHE, HE, THEY])
  })

  it('ignores case and spacing', () => {
    expect(parsePronouns(' She/Her ', SUGGESTIONS)).toEqual([SHE])
    expect(parsePronouns('he / they', SUGGESTIONS)).toEqual([HE, THEY])
  })

  it('returns null for text the suggestions do not cover', () => {
    expect(parsePronouns('xe/xem', SUGGESTIONS)).toBeNull()
    expect(parsePronouns('she', SUGGESTIONS)).toBeNull()
    expect(parsePronouns('she/her/they', SUGGESTIONS)).toBeNull()
    expect(parsePronouns('she/she', SUGGESTIONS)).toBeNull()
    expect(parsePronouns('any pronouns', SUGGESTIONS)).toBeNull()
  })
})

describe('composePronouns', () => {
  it('uses the full form for a single pick', () => {
    expect(composePronouns([], SUGGESTIONS)).toBe('')
    expect(composePronouns([HE], SUGGESTIONS)).toBe('he/him')
  })

  it('joins subject forms for several picks', () => {
    expect(composePronouns([SHE, THEY], SUGGESTIONS)).toBe('she/they')
    expect(composePronouns([THEY, HE], SUGGESTIONS)).toBe('they/he')
  })

  it('handles suggestions without a slash', () => {
    expect(composePronouns([0, 1], ['ella', 'elle'])).toBe('ella/elle')
  })
})

describe('togglePronoun', () => {
  it('picks, combines, and removes in tap order', () => {
    let value = ''
    value = togglePronoun(value, SHE, SUGGESTIONS)
    expect(value).toBe('she/her')
    value = togglePronoun(value, THEY, SUGGESTIONS)
    expect(value).toBe('she/they')
    value = togglePronoun(value, HE, SUGGESTIONS)
    expect(value).toBe('she/they/he')
    value = togglePronoun(value, SHE, SUGGESTIONS)
    expect(value).toBe('they/he')
    value = togglePronoun(value, HE, SUGGESTIONS)
    expect(value).toBe('they/them')
    value = togglePronoun(value, THEY, SUGGESTIONS)
    expect(value).toBe('')
  })

  it('replaces custom text', () => {
    expect(togglePronoun('xe/xem', SHE, SUGGESTIONS)).toBe('she/her')
  })

  it('builds on typed combos', () => {
    expect(togglePronoun('He/They', SHE, SUGGESTIONS)).toBe('he/they/she')
  })
})
