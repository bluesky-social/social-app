import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequireAuth} from '#/state/session'
import {useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {formatCount} from '#/view/com/util/numeric/format'
import {useTheme} from '#/alf'
import {CloseQuote_Stroke2_Corner1_Rounded as Quote} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'
import * as Menu from '#/components/Menu'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'

interface Props {
  isReposted: boolean
  repostCount?: number
  onRepost: () => void
  onQuote: () => void
  big?: boolean
  embeddingDisabled: boolean
}

export const RepostButton = ({
  isReposted,
  repostCount,
  onRepost,
  onQuote,
  big,
  embeddingDisabled,
}: Props) => {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()

  return hasSession ? (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Repost or quote post`)}>
          {({props}) => {
            return (
              <PostControlButton
                testID="repostBtn"
                active={isReposted}
                activeColor={t.palette.positive_600}
                label={props.accessibilityLabel}
                big={big}
                {...props}>
                <PostControlButtonIcon icon={Repost} />
                {typeof repostCount !== 'undefined' && repostCount > 0 && (
                  <PostControlButtonText testID="repostCount">
                    {formatCount(i18n, repostCount)}
                  </PostControlButtonText>
                )}
              </PostControlButton>
            )
          }}
        </Menu.Trigger>
        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Item
            label={isReposted ? _(msg`Undo repost`) : _(msg`Repost`)}
            testID="repostDropdownRepostBtn"
            onPress={onRepost}>
            <Menu.ItemText>
              {isReposted ? _(msg`Undo repost`) : _(msg`Repost`)}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Repost} position="right" />
          </Menu.Item>
          <Menu.Item
            disabled={embeddingDisabled}
            label={
              embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)
            }
            testID="repostDropdownQuoteBtn"
            onPress={onQuote}>
            <Menu.ItemText>
              {embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Quote} position="right" />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : (
    <PostControlButton
      onPress={() => requireAuth(() => {})}
      active={isReposted}
      activeColor={t.palette.positive_600}
      label={_(msg`Repost or quote post`)}
      big={big}>
      <PostControlButtonIcon icon={Repost} />
      {typeof repostCount !== 'undefined' && repostCount > 0 && (
        <PostControlButtonText testID="repostCount">
          {formatCount(i18n, repostCount)}
        </PostControlButtonText>
      )}
    </PostControlButton>
  )
}
