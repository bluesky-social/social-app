import React from 'react'
import {View} from 'react-native'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AtUri} from '@atproto/api'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ListsList} from 'view/com/lists/ListsList'
import {Text} from 'view/com/util/text/Text'
import {Button} from 'view/com/util/forms/Button'
import {NavigationProp} from 'lib/routes/types'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {SimpleViewHeader} from 'view/com/util/SimpleViewHeader'
import {s} from 'lib/styles'
import {useSetMinimalShellMode} from '#/state/shell'
import {useModalControls} from '#/state/modals'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Lists'>
export const ListsScreen = withAuthRequired(
  function ListsScreenImpl({}: Props) {
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
          style={
            !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
          }>
          <View style={{flex: 1}}>
            <Text type="title-lg" style={[pal.text, {fontWeight: 'bold'}]}>
              User Lists
            </Text>
            <Text style={pal.textLight}>
              Public, shareable lists which can drive feeds.
            </Text>
          </View>
          <View>
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
                New
              </Text>
            </Button>
          </View>
        </SimpleViewHeader>
        <ListsList filter="curate" style={s.flexGrow1} />
      </View>
    )
  },
)
