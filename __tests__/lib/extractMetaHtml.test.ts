import {extractHtmlMeta} from '../../src/lib/extractHtmlMeta'
import {exampleComHtml} from './__mocks__/exampleComHtml'
import {youtubeHTML} from './__mocks__/youtubeHtml'

describe('extractHtmlMeta', () => {
  const inputs = [
    '',
    'nothing',
    '<title>title</title>',
    '<title> aSd!@#AC </title>',
    '<title>\n  title\n  </title>',
    '<meta name="title" content="meta title">',
    '<meta name="description" content="meta description">',
    '<meta property="og:title" content="og title">',
    '<meta property="og:description" content="og description">',
    '<meta property="og:image" content="https://ogimage.com/foo.png">',
    '<meta property="twitter:title" content="twitter title">',
    '<meta property="twitter:description" content="twitter description">',
    '<meta property="twitter:image" content="https://twitterimage.com/foo.png">',
    '<meta\n  name="title"\n  content="meta title"\n>',
  ]
  const outputs = [
    {},
    {},
    {title: 'title'},
    {title: 'aSd!@#AC'},
    {title: 'title'},
    {title: 'meta title'},
    {description: 'meta description'},
    {title: 'og title'},
    {description: 'og description'},
    {image: 'https://ogimage.com/foo.png'},
    {title: 'twitter title'},
    {description: 'twitter description'},
    {image: 'https://twitterimage.com/foo.png'},
    {title: 'meta title'},
  ]
  it('correctly handles a set of text inputs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = extractHtmlMeta(input)
      expect(output).toEqual(outputs[i])
    }
  })

  // TODO: This file is too large. Split it up.
  it('extracts title and description from a generic HTML page', () => {
    const input = exampleComHtml
    const expectedOutput = {
      title: 'Example Domain',
      description: 'An example website',
    }
    const output = extractHtmlMeta(input)
    expect(output).toEqual(expectedOutput)
  })

  it('extracts title and description from a generic youtube page', () => {
    const input = youtubeHTML
    const expectedOutput = {
      title: 'HD Video (1080p) with Relaxing Music of Native American Shamans',
      description:
        'Stunning HD Video ( 1080p ) of Patagonian Nature with Relaxing Native American Shamanic Music. HD footage used from ',
      image: 'https://i.ytimg.com/vi/x6UITRjhijI/sddefault.jpg',
    }
    const output = extractHtmlMeta(input)
    expect(output).toEqual(expectedOutput)
  })
})
