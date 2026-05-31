import slugify from 'slugify'

import {getEntries} from '#/logger/logDump'
import {Sentry} from '#/logger/sentry/lib'

export function sendErrorReport({
  title,
  description,
  handle,
}: {
  title: string
  description: string
  handle: string
}) {
  const name = slugify(title, {lower: true, strict: true}).slice(0, 32)
  Sentry.withScope(scope => {
    scope.addAttachment({
      filename: name + '.json',
      data: JSON.stringify(getEntries()),
      contentType: 'application/json',
      // mimetype: 'application/json', // need to update Sentry
    })
    scope.setExtras({
      title,
      description,
      handle,
    })
    scope.captureMessage(`[USER REPORT] ${handle} ${name}`, 'error')
  })
}
