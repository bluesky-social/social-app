import {useLingui} from '@lingui/react/macro'

import {useRequireAuth, useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {useTheme} from '#/alf'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Menu from '#/components/Menu'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'

export interface RepostButtonProps {
  isReposted: boolean
  repostCount?: number
  onRepost: () => void
  onQuote: () => void
  big?: boolean
  embeddingDisabled: boolean
  longPressToQuote?: boolean
}

export function RepostButtonMenu({
  isReposted,
  repostCount,
  onRepost,
  onQuote,
  big,
  embeddingDisabled,
  longPressToQuote = false,
}: RepostButtonProps): React.ReactNode {
  const t = useTheme()
  const {t: l} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()
  const formatPostStatCount = useFormatPostStatCount()

  return hasSession ? (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={l`Repost or quote post`}>
          {({props}) => (
            <PostControlButton
              testID="repostBtn"
              active={isReposted}
              activeColor={t.palette.positive_500}
              label={props.accessibilityLabel}
              big={big}
              {...props}
              onLongPress={
                longPressToQuote
                  ? () =>
                      requireAuth(() => {
                        if (embeddingDisabled) {
                          props.onPress()
                        } else {
                          onQuote()
                        }
                      })
                  : undefined
              }>
              <PostControlButtonIcon icon={RepostIcon} />
              {typeof repostCount !== 'undefined' && repostCount > 0 && (
                <PostControlButtonText testID="repostCount">
                  {formatPostStatCount(repostCount)}
                </PostControlButtonText>
              )}
            </PostControlButton>
          )}
        </Menu.Trigger>
        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Item
            label={
              isReposted
                ? l`Undo repost`
                : l({message: `Repost`, context: 'action'})
            }
            testID="repostDropdownRepostBtn"
            onPress={onRepost}>
            <Menu.ItemText>
              {isReposted
                ? l`Undo repost`
                : l({message: `Repost`, context: 'action'})}
            </Menu.ItemText>
            <Menu.ItemIcon icon={RepostIcon} position="right" />
          </Menu.Item>
          <Menu.Item
            disabled={embeddingDisabled}
            label={embeddingDisabled ? l`Quote posts disabled` : l`Quote post`}
            testID="repostDropdownQuoteBtn"
            onPress={onQuote}>
            <Menu.ItemText>
              {embeddingDisabled ? l`Quote posts disabled` : l`Quote post`}
            </Menu.ItemText>
            <Menu.ItemIcon icon={QuoteIcon} position="right" />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : (
    <PostControlButton
      onPress={() => requireAuth(() => {})}
      active={isReposted}
      activeColor={t.palette.positive_500}
      label={l`Repost or quote post`}
      big={big}>
      <PostControlButtonIcon icon={RepostIcon} />
      {typeof repostCount !== 'undefined' && repostCount > 0 && (
        <PostControlButtonText testID="repostCount">
          {formatPostStatCount(repostCount)}
        </PostControlButtonText>
      )}
    </PostControlButton>
  )
}
