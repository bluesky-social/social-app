import React from 'react'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {useModalControls} from '#/state/modals'
import {useSetMinimalShellMode} from '#/state/shell'
import {MyLists} from '#/view/com/lists/MyLists'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export function ModerationModlistsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const navigation = useNavigation<NavigationProp>()
  const {openModal} = useModalControls()
  const requireEmailVerification = useRequireEmailVerification()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressNewList = React.useCallback(() => {
    openModal({
      name: 'create-or-edit-list',
      purpose: 'app.bsky.graph.defs#modlist',
      onSave: (uri: string) => {
        try {
          const urip = new AtUri(uri)
          navigation.navigate('ProfileList', {
            name: urip.hostname,
            rkey: urip.rkey,
          })
        } catch {}
      },
    })
  }, [openModal, navigation])

  const wrappedOnPressNewList = requireEmailVerification(onPressNewList, {
    instructions: [
      <Trans key="modlist">
        Before creating a list, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <Layout.Screen testID="moderationModlistsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Moderation Lists</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          label={_(msg`New list`)}
          testID="newModListBtn"
          color="secondary"
          variant="solid"
          size="small"
          onPress={wrappedOnPressNewList}>
          <ButtonIcon icon={PlusIcon} />
          <ButtonText>
            <Trans context="action">New</Trans>
          </ButtonText>
        </Button>
      </Layout.Header.Outer>
      <MyLists filter="mod" style={a.flex_grow} />
    </Layout.Screen>
  )
}
