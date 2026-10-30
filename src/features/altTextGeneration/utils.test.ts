import {type ComposerImage} from '#/state/gallery'
import {getGeneratedAltTextOutcomes, isGeneratedAltText} from './utils'

function createImage(alt: string, generatedAlt?: string): ComposerImage {
  return {
    alt,
    generatedAlt,
    source: {
      id: alt,
      path: 'file:///cache/image.jpg',
      width: 100,
      height: 100,
      mime: 'image/jpeg',
    },
  }
}

describe('isGeneratedAltText', () => {
  it('is true for an unedited suggestion', () => {
    expect(isGeneratedAltText(createImage('A dog', 'A dog'))).toBe(true)
  })

  it('is false once the suggestion is edited or cleared', () => {
    expect(isGeneratedAltText(createImage('A good dog', 'A dog'))).toBe(false)
    expect(isGeneratedAltText(createImage('', 'A dog'))).toBe(false)
  })

  it('is false for alt text the user wrote', () => {
    expect(isGeneratedAltText(createImage('A dog'))).toBe(false)
  })
})

describe('getGeneratedAltTextOutcomes', () => {
  it('is undefined when no image had a suggestion', () => {
    expect(
      getGeneratedAltTextOutcomes([createImage(''), createImage('A dog')]),
    ).toBeUndefined()
  })

  it('counts kept, edited and cleared suggestions', () => {
    expect(
      getGeneratedAltTextOutcomes([
        createImage('A dog', 'A dog'),
        createImage('A good dog', 'A dog'),
        createImage('', 'A cat'),
        createImage('My own alt text'),
      ]),
    ).toEqual({kept: 1, edited: 1, cleared: 1})
  })
})
