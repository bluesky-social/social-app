import {extractHtmlMeta} from '../../src/lib/extractHtmlMeta'
import {exampleComHtml} from './__mocks__/exampleComHtml'
import {youtubeHTML} from './__mocks__/youtubeHtml'
import {tiktokHtml} from './__mocks__/tiktokHtml'

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

  it('extracts title and description from a Tiktok HTML page', () => {
    const input = tiktokHtml
    const expectedOutput = {
      title:
        'Coca-Cola and Mentos! Super Reaction! #cocacola #mentos #reaction #bal... | TikTok',
      description:
        '5.5M Likes, 20.8K Comments. TikTok video from Power Vision Tests (@_powervision_): &quot;Coca-Cola and Mentos! Super Reaction! #cocacola #mentos #reaction #balloon #sciencemoment #scienceexperiment #experiment #test #amazing #pvexp&quot;.  оригинальный звук - Power Vision Tests.',
    }
    const output = extractHtmlMeta({html: input, hostname: 'tiktok.com'})
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

  it('extracts username from the url a twitter profile page', () => {
    const expectedOutput = {
      title: '@bluesky on Twitter',
    }
    const output = extractHtmlMeta({
      hostname: 'twitter.com',
      pathname: '/bluesky',
    })
    expect(output).toEqual(expectedOutput)
  })

  it('extracts username from the url a tweet', () => {
    const expectedOutput = {
      title: 'Tweet by @bluesky',
    }
    const output = extractHtmlMeta({
      hostname: 'twitter.com',
      pathname: '/bluesky/status/1582437529969917953',
    })
    expect(output).toEqual(expectedOutput)
  })

  it("does not extract username from the url when it's not a tweet or profile page", () => {
    const expectedOutput = {
      title: 'Twitter',
    }
    const output = extractHtmlMeta({
      hostname: 'twitter.com',
      pathname: '/i/articles/follows/-1675653703?time_window=24',
    })
    expect(output).toEqual(expectedOutput)
  })
})
