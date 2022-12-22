import {LikelyType, getLinkMeta, getLikelyType} from '../../src/lib/link-meta'

const exampleComHtml = `<!doctype html>
<html>
<head>
    <title>Example Domain</title>
    <meta name="description" content="An example website">

    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;

    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        div {
            margin: 0 auto;
            width: auto;
        }
    }
    </style>
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div>
</body>
</html>`

describe('getLinkMeta', () => {
  const inputs = [
    '',
    'httpbadurl',
    'https://example.com',
    'https://example.com/index.html',
    'https://example.com/image.png',
    'https://example.com/video.avi',
    'https://example.com/audio.ogg',
    'https://example.com/text.txt',
    'https://example.com/javascript.js',
    'https://bsky.app/index.html',
  ]
  const outputs = [
    {
      error: 'Invalid URL',
      likelyType: LikelyType.Other,
      url: '',
    },
    {
      error: 'Invalid URL',
      likelyType: LikelyType.Other,
      url: 'httpbadurl',
    },
    {
      likelyType: LikelyType.HTML,
      url: 'https://example.com',
      title: 'Example Domain',
      description: 'An example website',
    },
    {
      likelyType: LikelyType.HTML,
      url: 'https://example.com/index.html',
      title: 'Example Domain',
      description: 'An example website',
    },
    {
      likelyType: LikelyType.Image,
      url: 'https://example.com/image.png',
    },
    {
      likelyType: LikelyType.Video,
      url: 'https://example.com/video.avi',
    },
    {
      likelyType: LikelyType.Audio,
      url: 'https://example.com/audio.ogg',
    },
    {
      likelyType: LikelyType.Text,
      url: 'https://example.com/text.txt',
    },
    {
      likelyType: LikelyType.Other,
      url: 'https://example.com/javascript.js',
    },
    {
      likelyType: LikelyType.AtpData,
      url: '/index.html',
      title: 'Not found',
    },
    {
      likelyType: LikelyType.Other,
      url: '',
      title: '',
    },
  ]
  it('correctly handles a set of text inputs', async () => {
    for (let i = 0; i < inputs.length; i++) {
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return new Promise((resolve, _reject) => {
          resolve({
            ok: true,
            status: 200,
            text: () => exampleComHtml,
          })
        })
      })
      const input = inputs[i]
      const output = await getLinkMeta(input)
      expect(output).toEqual(outputs[i])
    }
  })
})

describe('getLikelyType', () => {
  it('correctly handles non-parsed url', async () => {
    const output = await getLikelyType('https://example.com')
    expect(output).toEqual(LikelyType.HTML)
  })

  it('handles non-string urls without crashing', async () => {
    const output = await getLikelyType('123')
    expect(output).toEqual(LikelyType.Other)
  })
})
