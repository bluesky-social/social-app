import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {type ConvoState} from '#/state/messages/convo/types'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Text} from '#/components/Typography'

export function MessagesListInfoPanel({convoState}: {convoState: ConvoState}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const {currentAccount} = useSession()

  const groupName = convoState.getGroupInfo?.()?.name

  const members = (convoState?.convo?.members ?? []).filter(
    profile => profile.did !== currentAccount?.did,
  )

  let names: React.ReactNode | null = null
  if (members.length === 1) {
    names = <Trans>New chat with {members[0].displayName}</Trans>
  }
  if (members.length === 2) {
    names = (
      <Trans>
        New chat with {members[0].displayName} and {members[1].displayName}
      </Trans>
    )
  }
  if (members.length > 2) {
    names = (
      <Trans>
        New chat with {members[0].displayName}, {members[1].displayName}, and{' '}
        <Plural
          value={members.length - 2}
          one={`${members.length - 2} more`}
          other={`${members.length - 2} more`}
        />
        .
      </Trans>
    )
  }

  return (
    <View style={[a.align_center, a.justify_center]}>
      <AvatarBubbles animate={true} profiles={members} />
      {groupName ? (
        <Text style={[a.text_2xl, a.font_bold, a.mt_lg, t.atoms.text]}>
          {groupName}
        </Text>
      ) : null}
      {names ? (
        <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_high]}>
          {names}
        </Text>
      ) : null}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.gap_sm,
          a.mt_lg,
          a.mb_4xl,
        ]}>
        <Button
          color="secondary"
          size="small"
          label={l`Click here to add people to this group chat`}
          onPress={() => {}}>
          <ButtonIcon icon={PersonPlusIcon} />
          <ButtonText>
            <Trans>Add people</Trans>
          </ButtonText>
        </Button>
        <Button
          color="secondary"
          size="small"
          label={l`Click here to view or create an invite link for this group chat`}
          onPress={() => {}}>
          <ButtonIcon icon={ChainLinkIcon} />
          <ButtonText>
            <Trans>Invite link</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
