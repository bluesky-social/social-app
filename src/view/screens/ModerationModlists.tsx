import React from 'react'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useEmail} from '#/lib/hooks/useEmail'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {useModalControls} from '#/state/modals'
import {useSetMinimalShellMode} from '#/state/shell'
import {MyLists} from '#/view/com/lists/MyLists'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export function ModerationModlistsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const navigation = useNavigation<NavigationProp>()
  const {openModal} = useModalControls()
  const {needsEmailVerification} = useEmail()
  const control = useDialogControl()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressNewList = React.useCallback(() => {
    if (needsEmailVerification) {
      control.open()
      return
    }

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
  }, [needsEmailVerification, control, openModal, navigation])

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
          onPress={onPressNewList}>
          <ButtonIcon icon={PlusIcon} />
          <ButtonText>
            <Trans context="action">New</Trans>
          </ButtonText>
        </Button>
      </Layout.Header.Outer>
      <MyLists filter="mod" style={a.flex_grow} />
      <VerifyEmailDialog
        reasonText={_(
          msg`Before creating a list, you must first verify your email.`,
        )}
        control={control}
      />
    </Layout.Screen>
  )
}
