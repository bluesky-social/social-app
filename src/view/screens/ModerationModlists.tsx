import {useCallback} from 'react'
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
import {useSetMinimalShellMode} from '#/state/shell'
import {MyLists} from '#/view/com/lists/MyLists'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {CreateOrEditListDialog} from '#/components/dialogs/lists/CreateOrEditListDialog'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export function ModerationModlistsScreen({}: Props) {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()
  const createListDialogControl = useDialogControl()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressNewList = useCallback(() => {
    createListDialogControl.open()
  }, [createListDialogControl])

  const wrappedOnPressNewList = requireEmailVerification(onPressNewList, {
    instructions: [
      <Trans key="modlist">
        Before creating a list, you must first verify your email.
      </Trans>,
    ],
  })

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
          onPress={wrappedOnPressNewList}>
          <ButtonIcon icon={PlusIcon} />
          <ButtonText>
            <Trans context="action">New</Trans>
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <MyLists filter="mod" style={a.flex_grow} />

      <CreateOrEditListDialog
        purpose="app.bsky.graph.defs#modlist"
        control={createListDialogControl}
        onSave={onCreateList}
      />
    </Layout.Screen>
  )
}
