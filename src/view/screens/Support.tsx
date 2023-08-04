import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'

import {CenteredView} from 'view/com/util/Views'
import React from 'react'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {s} from 'lib/styles'
import {useFocusEffect} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>
export const SupportScreen = (_props: Props) => {
  const store = useStores()
  const pal = usePalette('default')

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Support" />
      <CenteredView>
        <Text type="title-xl" style={[pal.text, s.p20, s.pb5]}>
          Support
        </Text>
        <Text style={[pal.text, s.p20]}>
          If you need help, email us at{' '}
          <TextLink
            href="mailto:support@solarplex.xyz"
            text="support@solarplex.xyz"
            style={pal.link}
          />{' '}
          with a description of your issue and information about how we can help
          you.
        </Text>
      </CenteredView>
    </View>
  )
}
