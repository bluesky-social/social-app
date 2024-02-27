import React, {useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {Text} from '../util/text/Text'
import {DateInput} from '../util/forms/DateInput'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {cleanError} from 'lib/strings/errors'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {
  usePreferencesQuery,
  usePreferencesSetBirthDateMutation,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {logger} from '#/logger'

export const snapPoints = ['50%', '90%']

function Inner({preferences}: {preferences: UsePreferencesQueryResponse}) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const {_} = useLingui()
  const {
    isPending,
    isError,
    error,
    mutateAsync: setBirthDate,
  } = usePreferencesSetBirthDateMutation()
  const [date, setDate] = useState(preferences.birthDate || new Date())
  const {closeModal} = useModalControls()

  const onSave = React.useCallback(async () => {
    try {
      await setBirthDate({birthDate: date})
      closeModal()
    } catch (e) {
      logger.error(`setBirthDate failed`, {message: e})
    }
  }, [date, setBirthDate, closeModal])

  return (
    <View
      testID="birthDateSettingsModal"
      style={[pal.view, styles.container, isMobile && {paddingHorizontal: 18}]}>
      <View style={styles.titleSection}>
        <Text type="title-lg" style={[pal.text, styles.title]}>
          <Trans>My Birthday</Trans>
        </Text>
      </View>

      <Text type="lg" style={[pal.textLight, {marginBottom: 10}]}>
        <Trans>This information is not shared with other users.</Trans>
      </Text>

      <View>
        <DateInput
          handleAsUTC
          testID="birthdayInput"
          value={date}
          onChange={setDate}
          buttonType="default-light"
          buttonStyle={[pal.border, styles.dateInputButton]}
          buttonLabelType="lg"
          accessibilityLabel={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
          accessibilityLabelledBy="birthDate"
        />
      </View>

      {isError ? (
        <ErrorMessage message={cleanError(error)} style={styles.error} />
      ) : undefined}

      <View style={[styles.btnContainer, pal.borderDark]}>
        {isPending ? (
          <View style={styles.btn}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <TouchableOpacity
            testID="confirmBtn"
            onPress={onSave}
            style={styles.btn}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Save`)}
            accessibilityHint="">
            <Text style={[s.white, s.bold, s.f18]}>
              <Trans>Save</Trans>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export function Component({}: {}) {
  const {data: preferences} = usePreferencesQuery()

  return !preferences ? (
    <ActivityIndicator />
  ) : (
    <Inner preferences={preferences} />
  )
}

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
