import {extractHtmlMeta} from '../../src/lib/extractHtmlMeta'
import {exampleComHtml} from './__mocks__/exampleComHtml'
import {youtubeHTML} from './__mocks__/youtubeHtml'

describe('extractHtmlMeta', () => {
  const cases = [
    ['', {}],
    ['nothing', {}],
    ['<title>title</title>', {title: 'title'}],
    ['<title> aSd!@#AC </title>', {title: 'aSd!@#AC'}],
    ['<title>\n  title\n  </title>', {title: 'title'}],
    ['<meta name="title" content="meta title">', {title: 'meta title'}],
    [
      '<meta name="description" content="meta description">',
      {description: 'meta description'},
    ],
    ['<meta property="og:title" content="og title">', {title: 'og title'}],
    [
      '<meta property="og:description" content="og description">',
      {description: 'og description'},
    ],
    [
      '<meta property="og:image" content="https://ogimage.com/foo.png">',
      {image: 'https://ogimage.com/foo.png'},
    ],
    [
      '<meta property="twitter:title" content="twitter title">',
      {title: 'twitter title'},
    ],
    [
      '<meta property="twitter:description" content="twitter description">',
      {description: 'twitter description'},
    ],
    [
      '<meta property="twitter:image" content="https://twitterimage.com/foo.png">',
      {image: 'https://twitterimage.com/foo.png'},
    ],
    ['<meta\n  name="title"\n  content="meta title"\n>', {title: 'meta title'}],
  ]

  it.each(cases)(
    'given the html tag %p, returns %p',
    (input, expectedResult) => {
      const output = extractHtmlMeta({html: input as string, hostname: ''})
      expect(output).toEqual(expectedResult)
    },
  )

  it('extracts title and description from a generic HTML page', () => {
    const input = exampleComHtml
    const expectedOutput = {
      title: 'Example Domain',
      description: 'An example website',
    }
    const output = extractHtmlMeta({html: input, hostname: 'example.com'})
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
    const output = extractHtmlMeta({html: input, hostname: 'youtube.com'})
    expect(output).toEqual(expectedOutput)
  })
})
