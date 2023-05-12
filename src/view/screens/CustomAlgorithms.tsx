import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {Text} from 'view/com/util/text/Text'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomAlgorithms'>

const CustomAlgorithms = withAuthRequired(
  observer((props: Props) => {
    const pal = usePalette('default')
    return (
      <View>
        <ViewHeader title="Custom Algorithms" showOnDesktop />
        <Text>CustomAlgorithms</Text>
      </View>
    )
  }),
)

export default CustomAlgorithms

const styles = StyleSheet.create({})
