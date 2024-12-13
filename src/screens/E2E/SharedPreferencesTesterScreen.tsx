import React from 'react'
import {View} from 'react-native'

import {ScrollView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {SharedPrefs} from '../../../modules/expo-bluesky-swiss-army'

export function SharedPreferencesTesterScreen() {
  const [currentTestOutput, setCurrentTestOutput] = React.useState<string>('')

  return (
    <Layout.Screen>
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
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerString')
                SharedPrefs.setValue('testerString', 'Hello')
                const str = SharedPrefs.getString('testerString')
                console.log(JSON.stringify(str))
                setCurrentTestOutput(`${str}`)
              }}>
              <ButtonText>Set String</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="removeStringBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerString')
                const str = SharedPrefs.getString('testerString')
                setCurrentTestOutput(`${str}`)
              }}>
              <ButtonText>Remove String</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="setBoolBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerBool')
                SharedPrefs.setValue('testerBool', true)
                const bool = SharedPrefs.getBool('testerBool')
                setCurrentTestOutput(`${bool}`)
              }}>
              <ButtonText>Set Bool</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="setNumberBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeValue('testerNumber')
                SharedPrefs.setValue('testerNumber', 123)
                const num = SharedPrefs.getNumber('testerNumber')
                setCurrentTestOutput(`${num}`)
              }}>
              <ButtonText>Set Number</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="addToSetBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeFromSet('testerSet', 'Hello!')
                SharedPrefs.addToSet('testerSet', 'Hello!')
                const contains = SharedPrefs.setContains('testerSet', 'Hello!')
                setCurrentTestOutput(`${contains}`)
              }}>
              <ButtonText>Add to Set</ButtonText>
            </Button>
            <Button
              label="btn"
              testID="removeFromSetBtn"
              style={[a.self_center]}
              variant="solid"
              color="primary"
              size="small"
              onPress={async () => {
                SharedPrefs.removeFromSet('testerSet', 'Hello!')
                const contains = SharedPrefs.setContains('testerSet', 'Hello!')
                setCurrentTestOutput(`${contains}`)
              }}>
              <ButtonText>Remove from Set</ButtonText>
            </Button>
          </View>
        </View>
      </ScrollView>
    </Layout.Screen>
  )
}
