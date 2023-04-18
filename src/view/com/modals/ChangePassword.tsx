import React, {useCallback} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'

export const snapPoints = ['100%']

interface Props {
  onChanged: () => void
}

export function Component({onChanged}: Props) {
  const pal = usePalette('default')
  const store = useStores()

  const onCancel = useCallback(() => {
    store.shell.closeModal()
  }, [store.shell])

  return (
    <View style={[s.flex1, pal.view]}>
      <View style={[styles.title, pal.border]}>
        <View style={styles.titleLeft}>
          <TouchableOpacity onPress={onCancel}>
            <Text type="lg" style={pal.textLight}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
        <Text type="2xl-bold" style={[styles.titleMiddle, pal.text]}>
          Change password
        </Text>
        <View style={styles.titleRight}>
          {/* {isProcessing ? (
            <ActivityIndicator />
          ) : error && !serviceDescription ? (
            <TouchableOpacity
              testID="retryConnectButton"
              onPress={onPressRetryConnect}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                Retry
              </Text>
            </TouchableOpacity>
          ) : canSave ? ( */}
          <TouchableOpacity
          // onPress={onPressSave}
          >
            <Text type="lg-bold" style={pal.link}>
              Save
            </Text>
          </TouchableOpacity>
          {/* ) : undefined} */}
        </View>
      </View>
      <Text type="lg" style={[pal.text, styles.instructions]}>
        Enter the email you used to create your account. We'll send you a "reset
        code" so you can set a new password.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  instructions: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  titleLeft: {},
  titleMiddle: {
    fontSize: 21,
  },
  titleRight: {},
})
