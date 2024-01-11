import React from 'react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {CreateAccountState, CreateAccountDispatch} from './state'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {HelpTip} from '../util/HelpTip'
import {TextInput} from '../util/TextInput'
import {Button} from 'view/com/util/forms/Button'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LOCAL_DEV_SERVICE, STAGING_SERVICE, PROD_SERVICE} from 'lib/constants'
import {LOGIN_INCLUDE_DEV_SERVERS} from 'lib/build-flags'

/** STEP 1: Your hosting provider
 * @field Bluesky (default)
 * @field Other (staging, local dev, your own PDS, etc.)
 */
export function Step1({
  uiState,
  uiDispatch,
}: {
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
}) {
  const pal = usePalette('default')
  const [isDefaultSelected, setIsDefaultSelected] = React.useState(true)
  const {_} = useLingui()

  const onPressDefault = React.useCallback(() => {
    setIsDefaultSelected(true)
    uiDispatch({type: 'set-service-url', value: PROD_SERVICE})
  }, [setIsDefaultSelected, uiDispatch])

  const onPressOther = React.useCallback(() => {
    setIsDefaultSelected(false)
    uiDispatch({type: 'set-service-url', value: 'https://'})
  }, [setIsDefaultSelected, uiDispatch])

  const onChangeServiceUrl = React.useCallback(
    (v: string) => {
      uiDispatch({type: 'set-service-url', value: v})
    },
    [uiDispatch],
  )

  return (
    <View>
      <StepHeader step="1" title={_(msg`Your hosting provider`)} />
      <Text style={[pal.text, s.mb10]}>
        <Trans>This is the service that keeps you online.</Trans>
      </Text>
      <Option
        testID="blueskyServerBtn"
        isSelected={isDefaultSelected}
        label="Bluesky"
        help="&nbsp;(default)"
        onPress={onPressDefault}
      />
      <Option
        testID="otherServerBtn"
        isSelected={!isDefaultSelected}
        label="Other"
        onPress={onPressOther}>
        <View style={styles.otherForm}>
          <Text nativeID="addressProvider" style={[pal.text, s.mb5]}>
            <Trans>Enter the address of your provider:</Trans>
          </Text>
          <TextInput
            testID="customServerInput"
            icon="globe"
            placeholder={_(msg`Hosting provider address`)}
            value={uiState.serviceUrl}
            editable
            onChange={onChangeServiceUrl}
            accessibilityHint={_(msg`Input hosting provider address`)}
            accessibilityLabel={_(msg`Hosting provider address`)}
            accessibilityLabelledBy="addressProvider"
          />
          {LOGIN_INCLUDE_DEV_SERVERS && (
            <View style={[s.flexRow, s.mt10]}>
              <Button
                testID="stagingServerBtn"
                type="default"
                style={s.mr5}
                label={_(msg`Staging`)}
                onPress={() => onChangeServiceUrl(STAGING_SERVICE)}
              />
              <Button
                testID="localDevServerBtn"
                type="default"
                label={_(msg`Dev Server`)}
                onPress={() => onChangeServiceUrl(LOCAL_DEV_SERVICE)}
              />
            </View>
          )}
        </View>
      </Option>
      {uiState.error ? (
        <ErrorMessage message={uiState.error} style={styles.error} />
      ) : (
        <HelpTip text={_(msg`You can change hosting providers at any time.`)} />
      )}
    </View>
  )
}

function Option({
  children,
  isSelected,
  label,
  help,
  onPress,
  testID,
}: React.PropsWithChildren<{
  isSelected: boolean
  label: string
  help?: string
  onPress: () => void
  testID?: string
}>) {
  const theme = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const circleFillStyle = React.useMemo(
    () => ({
      backgroundColor: theme.palette.primary.background,
    }),
    [theme],
  )

  return (
    <View style={[styles.option, pal.border]}>
      <TouchableWithoutFeedback
        onPress={onPress}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={_(msg`Sets hosting provider to ${label}`)}>
        <View style={styles.optionHeading}>
          <View style={[styles.circle, pal.border]}>
            {isSelected ? (
              <View style={[circleFillStyle, styles.circleFill]} />
            ) : undefined}
          </View>
          <Text type="xl" style={pal.text}>
            {label}
            {help ? (
              <Text type="xl" style={pal.textLight}>
                {help}
              </Text>
            ) : undefined}
          </Text>
        </View>
      </TouchableWithoutFeedback>
      {isSelected && children}
    </View>
  )
}

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
  },

  option: {
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
  },
  optionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 15,
    padding: 4,
    borderWidth: 1,
    marginRight: 10,
  },
  circleFill: {
    width: 16,
    height: 16,
    borderRadius: 10,
  },

  otherForm: {
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
})
