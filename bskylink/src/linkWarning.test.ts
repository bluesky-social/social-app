import assert from 'node:assert'
import {test} from 'node:test'

import {atoms, themes} from '@bsky.app/alf'
import {type Request} from 'express'

import {linkWarningContents} from './html/linkWarningContents.js'
import {linkWarningLayout} from './html/linkWarningLayout.js'

for (const type of ['block', 'warn'] as const) {
  void test(`escapes URLs and the title in the ${type} page`, () => {
    const req = {
      __: (message: string) => message,
    } as unknown as Request
    const link = 'https://example.com/?q="/><script>alert(1)</script>&x=1'
    const escapedLink =
      'https://example.com/?q=&quot;/&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;x=1'
    const html = linkWarningLayout(
      '</title><script>alert(1)</script>',
      linkWarningContents(req, {type, link}),
    )

    assert.ok(html.includes(`>${escapedLink}</p>`))
    assert.ok(
      html.includes(
        '<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>',
      ),
    )
    assert.doesNotMatch(html, /<script|&amp;lt;/)
    assert.match(html, /href="https:\/\/bsky.app"/)
    if (type === 'warn') {
      assert.ok(html.includes(`href="${escapedLink}"`))
      assert.match(html, /Continue Anyway/)
    } else {
      assert.doesNotMatch(html, /Continue Anyway/)
      assert.ok(!html.includes(`href="${escapedLink}"`))
    }
  })
}

void test('includes ALF styles with CSS units on every response', () => {
  const req = {__: (message: string) => message} as unknown as Request
  const render = () =>
    linkWarningLayout(
      'Blocked Link',
      linkWarningContents(req, {type: 'block', link: 'https://example.com'}),
    )
  const first = render()
  const second = render()
  const stylesheet = first.match(/<style>([\s\S]+)<\/style>/)?.[1]

  assert.ok(stylesheet)
  assert.strictEqual(first, second)
  assert.ok(stylesheet.includes('@media (min-width: 481px)'))
  assert.ok(stylesheet.includes(`font-size:${atoms.text_2xl.fontSize}px`))
  assert.ok(
    stylesheet.includes(`border-radius:${atoms.rounded_md.borderRadius}px`),
  )
  assert.ok(stylesheet.includes(`padding:${atoms.p_xl.padding}px`))
  assert.ok(
    stylesheet.includes(`background-color:${themes.light.palette.primary_500}`),
  )
})
