import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {Inbox_Stroke2_Corner2_Rounded as InboxIcon} from '#/components/icons/Inbox'
import {Link} from '#/components/Link'

// The server caps unreadRequestConvos at 11, where 11 means "any more than 10".
const REQUEST_COUNT_CAP = 11

export function InboxRequests({
  count,
  variant,
  action,
}: {
  count: number
  variant?: 'ghost' | 'solid'
  action?: 'push' | 'navigate'
}) {
  const {t: l} = useLingui()

  const unread = count > 0
  const overflow = count >= REQUEST_COUNT_CAP

  const label = !unread
    ? l({
        message: `Requests`,
        comment: 'Incoming message requests',
      })
    : overflow
      ? l({
          message: `${REQUEST_COUNT_CAP}+ requests`,
          comment: 'Displayed when the number of requests is greater than 10',
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
          action={action}
          size="small"
          variant={unread ? 'solid' : 'ghost'}
          color={unread ? 'primary_subtle' : 'secondary'}
          shape={unread ? 'default' : 'round'}
          style={[a.justify_center, unread && [a.gap_sm, a.pl_lg, a.pr_md]]}>
          <ButtonIcon icon={InboxIcon} size="lg" />
          {unread && (
            <ButtonText style={[a.text_md, a.font_bold]}>
              {overflow
                ? l({
                    message: `10+`,
                    comment:
                      'Displayed when the number of requests is greater than 10',
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
          action={action}
          color={unread ? 'primary_subtle' : 'secondary'}
          size="small">
          <ButtonIcon icon={InboxIcon} />
          <ButtonText>{label}</ButtonText>
        </Link>
      )
    }
  }
}
