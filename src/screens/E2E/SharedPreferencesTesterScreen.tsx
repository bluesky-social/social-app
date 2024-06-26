import React from 'react'
import {View} from 'react-native'

import {ScrollView} from 'view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {SharedPrefs} from '../../../modules/expo-bluesky-swiss-army'

export function SharedPreferencesTesterScreen() {
  const [currentTestOutput, setCurrentTestOutput] = React.useState<string>('')

  return (
    <ScrollView contentContainerStyle={{backgroundColor: 'red'}}>
      <View style={[a.flex_1]}>
        <View>
          <Text testID="testOutput">{currentTestOutput}</Text>
        </View>
        <View style={[a.flex_wrap]}>
          <Button
            label="btn"
            testID="setStringBtn"
            style={[a.self_center]}
            variant="solid"
            color="primary"
            size="xsmall"
            onPress={async () => {
              await SharedPrefs.removeValueAsync('testerString')
              await SharedPrefs.setValueAsync('testerString', 'Hello')
              const res = await SharedPrefs.getStringAsync('testerString')
              setCurrentTestOutput(`${res}`)
            }}>
            <ButtonText>Set String</ButtonText>
          </Button>
          <Button
            label="btn"
            testID="removeStringBtn"
            style={[a.self_center]}
            variant="solid"
            color="primary"
            size="xsmall"
            onPress={async () => {
              await SharedPrefs.removeValueAsync('testerString')
              const res = await SharedPrefs.getStringAsync('testerString')
              setCurrentTestOutput(`${res}`)
            }}>
            <ButtonText>Remove String</ButtonText>
          </Button>
          <Button
            label="btn"
            testID="setBoolBtn"
            style={[a.self_center]}
            variant="solid"
            color="primary"
            size="xsmall"
            onPress={async () => {
              await SharedPrefs.removeValueAsync('testerBool')
              await SharedPrefs.setValueAsync('testerBool', true)
              const res = await SharedPrefs.getBoolAsync('testerBool')
              setCurrentTestOutput(`${res}`)
            }}>
            <ButtonText>Set Bool</ButtonText>
          </Button>
          <Button
            label="btn"
            testID="setNumberBtn"
            style={[a.self_center]}
            variant="solid"
            color="primary"
            size="xsmall"
            onPress={async () => {
              await SharedPrefs.removeValueAsync('testerNumber')
              await SharedPrefs.setValueAsync('testerNumber', 123)
              const res = await SharedPrefs.getNumberAsync('testerNumber')
              setCurrentTestOutput(`${res}`)
            }}>
            <ButtonText>Set Number</ButtonText>
          </Button>
          <Button
            label="btn"
            testID="addToSetBtn"
            style={[a.self_center]}
            variant="solid"
            color="primary"
            size="xsmall"
            onPress={async () => {
              await SharedPrefs.removeFromSetAsync('testerSet', 'Hello!')
              await SharedPrefs.addToSetAsync('testerSet', 'Hello!')
              const res = await SharedPrefs.setContainsAsync(
                'testerSet',
                'Hello!',
              )
              setCurrentTestOutput(`${res}`)
            }}>
            <ButtonText>Add to Set</ButtonText>
          </Button>
          <Button
            label="btn"
            testID="removeFromSetBtn"
            style={[a.self_center]}
            variant="solid"
            color="primary"
            size="xsmall"
            onPress={async () => {
              await SharedPrefs.removeFromSetAsync('testerSet', 'Hello!')
              const res = await SharedPrefs.setContainsAsync(
                'testerSet',
                'Hello!',
              )
              setCurrentTestOutput(`${res}`)
            }}>
            <ButtonText>Remove from Set</ButtonText>
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}
