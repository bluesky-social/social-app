import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {UNREAD_LIMIT} from '#/state/queries/messages/list-conversations'
import {atoms as a} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {Inbox_Stroke2_Corner2_Rounded as InboxIcon} from '#/components/icons/Inbox'
import {Link} from '#/components/Link'

export function InboxRequests({
  count,
  more,
  variant,
}: {
  count: number
  more: boolean
  variant?: 'ghost' | 'solid'
}) {
  const {t: l} = useLingui()

  const unread = count > 0

  const label = !unread
    ? l({
        message: `Requests`,
        comment: 'Incoming message requests',
      })
    : count >= UNREAD_LIMIT && more
      ? l({
          message: `${count}+ requests`,
          comment: 'Displayed when the number of requests is greater than 20',
        })
      : plural(count, {
          one: '# request',
          other: '# requests',
        })

  switch (variant) {
    case 'ghost': {
      return (
        <Link
          label={label}
          to="/messages/inbox"
          size="small"
          variant={unread ? 'solid' : 'ghost'}
          color={unread ? 'primary_subtle' : 'secondary'}
          shape={unread ? 'default' : 'round'}
          style={[a.justify_center, unread && [a.gap_sm, a.pl_lg, a.pr_md]]}>
          <ButtonIcon icon={InboxIcon} size="lg" />
          {unread && (
            <ButtonText style={[a.text_md, a.font_bold]}>
              {count >= UNREAD_LIMIT && more
                ? l({
                    message: `${count}+`,
                    comment:
                      'Displayed when the number of requests is greater than 20',
                  })
                : count}
            </ButtonText>
          )}
        </Link>
      )
    }
    case 'solid': {
      return (
        <Link
          label={label}
          to="/messages/inbox"
          color={unread ? 'primary_subtle' : 'secondary'}
          size="small">
          <ButtonIcon icon={InboxIcon} />
          <ButtonText>{label}</ButtonText>
        </Link>
      )
    }
  }
}
