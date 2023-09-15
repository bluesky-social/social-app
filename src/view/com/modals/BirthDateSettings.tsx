import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Text} from '../util/text/Text'
import {DateInput} from '../util/forms/DateInput'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {cleanError} from 'lib/strings/errors'

export const snapPoints = ['50%']

export const Component = observer(function Component({}: {}) {
  const pal = usePalette('default')
  const store = useStores()
  const [date, setDate] = useState<Date>(
    store.preferences.birthDate || new Date(),
  )
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const {isMobile} = useWebMediaQueries()

  const onSave = async () => {
    setError('')
    setIsProcessing(true)
    try {
      await store.preferences.setBirthDate(date)
      store.shell.closeModal()
    } catch (e) {
      setError(cleanError(String(e)))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View
      testID="birthDateSettingsModal"
      style={[pal.view, styles.container, isMobile && {paddingHorizontal: 18}]}>
      <View style={styles.titleSection}>
        <Text type="title-lg" style={[pal.text, styles.title]}>
          My Birthday
        </Text>
      </View>

      <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
        This information is not shared with other users.
      </Text>

      <View>
        <DateInput
          testID="birthdayInput"
          value={date}
          onChange={setDate}
          buttonType="default-light"
          buttonStyle={[pal.border, styles.dateInputButton]}
          buttonLabelType="lg"
          accessibilityLabel="Birthday"
          accessibilityHint="Enter your birth date"
          accessibilityLabelledBy="birthDate"
        />
      </View>

      {error ? (
        <ErrorMessage message={error} style={styles.error} />
      ) : undefined}

      <View style={[styles.btnContainer, pal.borderDark]}>
        {isProcessing ? (
          <View style={styles.btn}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <TouchableOpacity
            testID="confirmBtn"
            onPress={onSave}
            style={styles.btn}
            accessibilityRole="button"
            accessibilityLabel="Save"
            accessibilityHint="">
            <Text style={[s.white, s.bold, s.f18]}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 40,
  },
  titleSection: {
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  error: {
    borderRadius: 6,
    marginTop: 10,
  },
  dateInputButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
})
