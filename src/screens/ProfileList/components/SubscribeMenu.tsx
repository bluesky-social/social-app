import {type AppBskyGraphDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {useListBlockMutation, useListMuteMutation} from '#/state/queries/list'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {PersonX_Stroke2_Corner0_Rounded as PersonXIcon} from '#/components/icons/Person'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'

export function SubscribeMenu({list}: {list: AppBskyGraphDefs.ListView}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const subscribeMutePromptControl = Prompt.usePromptControl()
  const subscribeBlockPromptControl = Prompt.usePromptControl()

  const {mutateAsync: muteList, isPending: isMutePending} =
    useListMuteMutation()
  const {mutateAsync: blockList, isPending: isBlockPending} =
    useListBlockMutation()

  const isPending = isMutePending || isBlockPending

  const onSubscribeMute = async () => {
    try {
      await muteList({uri: list.uri, mute: true})
      Toast.show(l({message: 'List muted', context: 'toast'}))
      ax.metric('moderation:subscribedToList', {listType: 'mute'})
    } catch {
      Toast.show(
        l`There was an issue. Please check your internet connection and try again.`,
        {type: 'error'},
      )
    }
  }

  const onSubscribeBlock = async () => {
    try {
      await blockList({uri: list.uri, block: true})
      Toast.show(l({message: 'List blocked', context: 'toast'}))
      ax.metric('moderation:subscribedToList', {listType: 'block'})
    } catch {
      Toast.show(
        l`There was an issue. Please check your internet connection and try again.`,
        {type: 'error'},
      )
    }
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={l`Subscribe to this list`}>
          {({props}) => (
            <Button
              label={props.accessibilityLabel}
              testID="subscribeBtn"
              size="small"
              color="primary_subtle"
              style={[a.rounded_full]}
              disabled={isPending}
              {...props}>
              {isPending && <ButtonIcon icon={Loader} />}
              <ButtonText>
                <Trans>Subscribe</Trans>
              </ButtonText>
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            <Menu.Item
              label={l`Mute accounts`}
              onPress={subscribeMutePromptControl.open}>
              <Menu.ItemText>
                <Trans>Mute accounts</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon position="right" icon={MuteIcon} />
            </Menu.Item>
            <Menu.Item
              label={l`Block accounts`}
              onPress={subscribeBlockPromptControl.open}>
              <Menu.ItemText>
                <Trans>Block accounts</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon position="right" icon={PersonXIcon} />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
      <Prompt.Basic
        control={subscribeMutePromptControl}
        title={l`Mute these accounts?`}
        description={l`Muting is private. Muted accounts can interact with you, but you will not see their posts or receive notifications from them.`}
        onConfirm={onSubscribeMute}
        confirmButtonCta={l`Mute list`}
      />
      <Prompt.Basic
        control={subscribeBlockPromptControl}
        title={l`Block these accounts?`}
        description={l`Blocking is public. Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`}
        onConfirm={onSubscribeBlock}
        confirmButtonCta={l`Block list`}
        confirmButtonColor="negative"
      />
    </>
  )
}
