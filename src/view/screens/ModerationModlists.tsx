import React from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ModerationModlists'>
export function ModerationModlistsScreen({}: Props) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isMobile} = useWebMediaQueries()
  const navigation = useNavigation<NavigationProp>()
  const {openModal} = useModalControls()

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

  return (
    <View style={s.hContentRegion} testID="moderationModlistsScreen">
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
    </View>
  )
}
