import assert from 'node:assert'
import {test} from 'node:test'

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
