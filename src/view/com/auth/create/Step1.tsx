import React from 'react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import debounce from 'lodash.debounce'
import {Text} from 'view/com/util/text/Text'
import {StepHeader} from './StepHeader'
import {CreateAccountModel} from 'state/models/ui/create-account'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {HelpTip} from '../util/HelpTip'
import {TextInput} from '../util/TextInput'
import {Button} from 'view/com/util/forms/Button'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'

import {LOCAL_DEV_SERVICE, STAGING_SERVICE, PROD_SERVICE} from 'state/index'
import {LOGIN_INCLUDE_DEV_SERVERS} from 'lib/build-flags'

export const Step1 = observer(({model}: {model: CreateAccountModel}) => {
  const pal = usePalette('default')
  const [isDefaultSelected, setIsDefaultSelected] = React.useState(true)

  const onPressDefault = React.useCallback(() => {
    setIsDefaultSelected(true)
    model.setServiceUrl(PROD_SERVICE)
    model.fetchServiceDescription()
  }, [setIsDefaultSelected, model])

  const onPressOther = React.useCallback(() => {
    setIsDefaultSelected(false)
    model.setServiceUrl('https://')
    model.setServiceDescription(undefined)
  }, [setIsDefaultSelected, model])

  const fetchServiceDescription = React.useMemo(
    () => debounce(() => model.fetchServiceDescription(), 1e3),
    [model],
  )

  const onChangeServiceUrl = React.useCallback(
    (v: string) => {
      model.setServiceUrl(v)
      fetchServiceDescription()
    },
    [model, fetchServiceDescription],
  )

  const onDebugChangeServiceUrl = React.useCallback(
    (v: string) => {
      model.setServiceUrl(v)
      model.fetchServiceDescription()
    },
    [model],
  )

  return (
    <View>
      <StepHeader step="1" title="Your hosting provider" />
      <Text style={[pal.text, s.mb10]}>
        This is the service that keeps you online.
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
            Enter the address of your provider:
          </Text>
          <TextInput
            testID="customServerInput"
            icon="globe"
            placeholder="Hosting provider address"
            value={model.serviceUrl}
            editable
            onChange={onChangeServiceUrl}
            accessibilityHint="Input hosting provider address"
            accessibilityLabel="Hosting provider address"
            accessibilityLabelledBy="addressProvider"
          />
          {LOGIN_INCLUDE_DEV_SERVERS && (
            <View style={[s.flexRow, s.mt10]}>
              <Button
                testID="stagingServerBtn"
                type="default"
                style={s.mr5}
                label="Staging"
                onPress={() => onDebugChangeServiceUrl(STAGING_SERVICE)}
              />
              <Button
                testID="localDevServerBtn"
                type="default"
                label="Dev Server"
                onPress={() => onDebugChangeServiceUrl(LOCAL_DEV_SERVICE)}
              />
            </View>
          )}
        </View>
      </Option>
      {model.error ? (
        <ErrorMessage message={model.error} style={styles.error} />
      ) : (
        <HelpTip text="You can change hosting providers at any time." />
      )}
    </View>
  )
})

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
        accessibilityHint={`Sets hosting provider to ${label}`}>
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
