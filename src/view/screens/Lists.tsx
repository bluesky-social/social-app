import React from 'react'
import {StyleSheet, View} from 'react-native'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Trans} from '@lingui/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {useModalControls} from '#/state/modals'
import {useSetMinimalShellMode} from '#/state/shell'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {NavigationProp} from 'lib/routes/types'
import {s} from 'lib/styles'
import {MyLists} from '#/view/com/lists/MyLists'
import {Button} from 'view/com/util/forms/Button'
import {SimpleViewHeader} from 'view/com/util/SimpleViewHeader'
import {Text} from 'view/com/util/text/Text'
import hairlineWidth = StyleSheet.hairlineWidth

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lists'>
export function ListsScreen({}: Props) {
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
      purpose: 'app.bsky.graph.defs#curatelist',
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
    <View style={s.hContentRegion} testID="listsScreen">
      <SimpleViewHeader
        showBackButton={isMobile}
        style={[
          pal.border,
          isMobile
            ? {borderBottomWidth: hairlineWidth}
            : {borderLeftWidth: hairlineWidth, borderRightWidth: hairlineWidth},
        ]}>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: 'bold'}]}>
            <Trans>User Lists</Trans>
          </Text>
          <Text style={pal.textLight}>
            <Trans>Public, shareable lists which can drive feeds.</Trans>
          </Text>
        </View>
        <View style={[{marginLeft: 18}, isMobile && {marginLeft: 12}]}>
          <Button
            testID="newUserListBtn"
            type="default"
            onPress={onPressNewList}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <FontAwesomeIcon icon="plus" color={pal.colors.text} />
            <Text type="button" style={pal.text}>
              <Trans context="action">New</Trans>
            </Text>
          </Button>
        </View>
      </SimpleViewHeader>
      <MyLists filter="curate" style={s.flexGrow1} />
    </View>
  )
}
