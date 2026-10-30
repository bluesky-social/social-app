import {type ComposerImage} from '#/state/gallery'
import {
  cleanAltText,
  getGeneratedAltTextOutcomes,
  isGeneratedAltText,
} from './utils'

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

describe('cleanAltText', () => {
  it('strips an echoed language code or label', () => {
    expect(cleanAltText('en: A dog on a beach.', 'en')).toBe(
      'A dog on a beach.',
    )
    expect(cleanAltText('[en] A dog on a beach.', 'en')).toBe(
      'A dog on a beach.',
    )
    expect(cleanAltText('PT-BR: Um cão na praia.', 'pt-BR')).toBe(
      'Um cão na praia.',
    )
    expect(cleanAltText('Alt text: A dog on a beach.', 'en')).toBe(
      'A dog on a beach.',
    )
  })

  it('strips surrounding quotes', () => {
    expect(cleanAltText('"A dog on a beach."', 'en')).toBe('A dog on a beach.')
    expect(cleanAltText('en: “A dog on a beach.”', 'en')).toBe(
      'A dog on a beach.',
    )
  })

  it('leaves text that only starts like a label alone', () => {
    expect(cleanAltText('Entrance to a station.', 'en')).toBe(
      'Entrance to a station.',
    )
    expect(cleanAltText('Alternative rock band on stage.', 'en')).toBe(
      'Alternative rock band on stage.',
    )
    expect(cleanAltText('En-suite bathroom.', 'en')).toBe('En-suite bathroom.')
  })
})
