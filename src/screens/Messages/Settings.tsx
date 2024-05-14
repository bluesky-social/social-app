import React, {useCallback} from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {UseQueryResult} from '@tanstack/react-query'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {useUpdateActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {RadioGroup} from '#/view/com/util/forms/RadioGroup'
import * as Toast from '#/view/com/util/Toast'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {ClipClopGate} from './gate'

type AllowIncoming = 'all' | 'none' | 'following'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>
export function MessagesSettingsScreen({}: Props) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({
    did: currentAccount!.did,
  }) as UseQueryResult<AppBskyActorDefs.ProfileViewDetailed, Error>

  const {mutate: updateDeclaration} = useUpdateActorDeclaration({
    onError: () => {
      Toast.show(_(msg`Failed to update settings`))
    },
  })

  const onSelectItem = useCallback(
    (key: string) => {
      updateDeclaration(key as AllowIncoming)
    },
    [updateDeclaration],
  )

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  return (
    <CenteredView sideBorders>
      <ViewHeader title={_(msg`Settings`)} showOnDesktop showBorder />
      <View style={[a.p_lg, a.gap_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Allow messages from</Trans>
        </Text>
        <RadioGroup
          initialSelection={
            profile?.associated?.chat?.allowIncoming ?? 'following'
          }
          items={
            [
              {label: _(msg`Everyone`), key: 'all'},
              {label: _(msg`Follows only`), key: 'following'},
              {label: _(msg`No one`), key: 'none'},
            ] satisfies Array<{label: string; key: AllowIncoming}>
          }
          onSelect={onSelectItem}
        />
      </View>
    </CenteredView>
  )
}
