import React from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useEmail} from '#/lib/hooks/useEmail'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {useModalControls} from '#/state/modals'
import {useSetMinimalShellMode} from '#/state/shell'
import {MyLists} from '#/view/com/lists/MyLists'
import {Button} from '#/view/com/util/forms/Button'
import {SimpleViewHeader} from '#/view/com/util/SimpleViewHeader'
import {Text} from '#/view/com/util/text/Text'
import {useDialogControl} from '#/components/Dialog'
import {VerifyEmailDialog} from '#/components/dialogs/VerifyEmailDialog'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export function ModerationModlistsScreen({}: Props) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isMobile} = useWebMediaQueries()
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
      <SimpleViewHeader
        showBackButton={isMobile}
        style={
          !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
        }>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: '600'}]}>
            <Trans>Moderation Lists</Trans>
          </Text>
          <Text style={pal.textLight}>
            <Trans>
              Public, shareable lists of users to mute or block in bulk.
            </Trans>
          </Text>
        </View>
        <View style={[{marginLeft: 18}, isMobile && {marginLeft: 12}]}>
          <Button
            testID="newModListBtn"
            type="default"
            onPress={onPressNewList}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <FontAwesomeIcon icon="plus" color={pal.colors.text} />
            <Text type="button" style={pal.text}>
              <Trans>New</Trans>
            </Text>
          </Button>
        </View>
      </SimpleViewHeader>
      <MyLists filter="mod" style={s.flexGrow1} />
      <VerifyEmailDialog
        reasonText={_(
          msg`Before creating a list, you must first verify your email.`,
        )}
        control={control}
      />
    </Layout.Screen>
  )
}
