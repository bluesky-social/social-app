import {describe, it, expect} from '@jest/globals'

import {findSuggestionMatch, parsePunctuationFromTag} from '../utils'

describe('findSuggestionMatch', () => {
  it(`finds tag`, () => {
    const match = findSuggestionMatch({
      text: 'a #tag',
      cursorPosition: 6,
    })

    expect(match).toEqual({
      range: {
        from: 2,
        to: 6,
      },
      query: 'tag',
      text: ' #tag',
    })
  })

  it(`validates tag length`, () => {
    expect(
      findSuggestionMatch({
        text: '#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        cursorPosition: 65,
      }),
    ).toEqual({
      range: {
        from: 0,
        to: 65,
      },
      query: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      text: '#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    })

    expect(
      findSuggestionMatch({
        text: '#xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxo',
        cursorPosition: 66,
      }),
    ).toEqual(null)
  })

  it(`reports tag with trailing punctuation`, () => {
    const match = findSuggestionMatch({
      text: '#tag!!!',
      cursorPosition: 7,
    })

    expect(match).toEqual({
      range: {
        from: 0,
        to: 7,
      },
      query: 'tag!!!',
      text: '#tag!!!',
    })
  })
})

describe('parsePunctuationFromTag', () => {
  it(`parses with punctuation`, () => {
    expect(parsePunctuationFromTag('tag!')).toEqual({
      tag: 'tag',
      punctuation: '!',
    })
    expect(parsePunctuationFromTag('tag!!!')).toEqual({
      tag: 'tag',
      punctuation: '!!!',
    })
  })

  it(`parses without punctuation`, () => {
    expect(parsePunctuationFromTag('tag')).toEqual({
      tag: 'tag',
      punctuation: '',
    })
  })
})
