import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {UNREAD_LIMIT} from '#/state/queries/messages/list-conversations'
import {atoms as a} from '#/alf'
import {InlineLinkText} from '#/components/Link'

export function InboxRequests({count, more}: {count: number; more: boolean}) {
  const {t: l} = useLingui()

  if (count < 1) return null

  const label =
    count >= UNREAD_LIMIT && more
      ? l({
          message: `${count}+ requests`,
          comment: 'Displayed when the number of requests is greater than 20',
        })
      : plural(count, {
          one: '# request',
          other: '# requests',
        })

  return (
    <InlineLinkText
      label={label}
      to="/messages/inbox"
      style={[a.text_md, a.font_medium]}>
      {label}
    </InlineLinkText>
  )
}
