import {type Express} from 'express'

import {linkWarningContents} from '../html/linkWarningContents.js'
import {linkWarningLayout} from '../html/linkWarningLayout.js'

export default function (app: Express) {
  if (process.env.NODE_ENV !== 'development') return app

  return app.get('/_dev/link-warning', (req, res) => {
    const type = req.query.type === 'warn' ? 'warn' : 'block'

    res.setHeader('Cache-Control', 'no-store')
    res.type('html').send(
      linkWarningLayout(
        type === 'block' ? 'Blocked Link Warning' : 'Malicious Link Warning',
        linkWarningContents(req, {
          type,
          link: 'https://example.com/suspicious-link',
        }),
      ),
    )
  })
}
