import {useCallback} from 'react'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useEmail} from '#/lib/hooks/useEmail'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {type NavigationProp} from '#/lib/routes/types'
import {useSetMinimalShellMode} from '#/state/shell'
import {MyLists} from '#/view/com/lists/MyLists'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {CreateOrEditListDialog} from '#/components/dialogs/lists/CreateOrEditListDialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export function ModerationModlistsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const navigation = useNavigation<NavigationProp>()
  const {needsEmailVerification} = useEmail()
  const verifyEmailDialogControl = useDialogControl()
  const createListDialogControl = useDialogControl()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressNewList = useCallback(() => {
    if (needsEmailVerification) {
      verifyEmailDialogControl.open()
    } else {
      createListDialogControl.open()
    }
  }, [
    needsEmailVerification,
    verifyEmailDialogControl,
    createListDialogControl,
  ])

  const onCreateList = useCallback(
    (uri: string) => {
      try {
        const urip = new AtUri(uri)
        navigation.navigate('ProfileList', {
          name: urip.hostname,
          rkey: urip.rkey,
        })
      } catch {}
    },
    [navigation],
  )

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
        control={verifyEmailDialogControl}
      />

      <CreateOrEditListDialog
        purpose="app.bsky.graph.defs#modlist"
        control={createListDialogControl}
        onSave={onCreateList}
      />
    </Layout.Screen>
  )
}
