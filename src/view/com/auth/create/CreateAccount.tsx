import React from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useAnalytics} from 'lib/analytics'
import {Text} from '../../util/text/Text'
import {s, colors} from 'lib/styles'
import {useStores} from 'state/index'
import {CreateAccountModel} from 'state/models/ui/create-account'
import {usePalette} from 'lib/hooks/usePalette'

import {Step1} from './Step1'
import {Step2} from './Step2'
import {Step3} from './Step3'

export const CreateAccount = observer(
  ({onPressBack}: {onPressBack: () => void}) => {
    const {track, screen} = useAnalytics()
    const pal = usePalette('default')
    const store = useStores()
    const model = React.useMemo(() => new CreateAccountModel(store), [store])

    React.useEffect(() => {
      screen('CreateAccount')
    }, [screen])

    React.useEffect(() => {
      model.fetchServiceDescription()
    }, [model])

    const onPressRetryConnect = React.useCallback(
      () => model.fetchServiceDescription(),
      [model],
    )

    const onPressBackInner = React.useCallback(() => {
      if (model.canBack) {
        model.back()
      } else {
        onPressBack()
      }
    }, [model, onPressBack])

    const onPressNext = React.useCallback(async () => {
      if (!model.canNext) {
        return
      }
      if (model.step < 3) {
        model.next()
      } else {
        try {
          await model.submit()
          track('Create Account')
        } catch {
          // dont need to handle here
        }
      }
    }, [model, track])

    return (
      <ScrollView testID="createAccount" style={pal.view}>
        <KeyboardAvoidingView behavior="padding">
          <View style={styles.stepContainer}>
            {model.step === 1 && <Step1 model={model} />}
            {model.step === 2 && <Step2 model={model} />}
            {model.step === 3 && <Step3 model={model} />}
          </View>
          <View style={[s.flexRow, s.pl20, s.pr20]}>
            <TouchableOpacity onPress={onPressBackInner} testID="backBtn">
              <Text type="xl" style={pal.link}>
                Back
              </Text>
            </TouchableOpacity>
            <View style={s.flex1} />
            {model.canNext ? (
              <TouchableOpacity testID="nextBtn" onPress={onPressNext}>
                {model.isProcessing ? (
                  <ActivityIndicator />
                ) : (
                  <Text type="xl-bold" style={[pal.link, s.pr5]}>
                    Next
                  </Text>
                )}
              </TouchableOpacity>
            ) : model.didServiceDescriptionFetchFail ? (
              <TouchableOpacity
                testID="retryConnectBtn"
                onPress={onPressRetryConnect}>
                <Text type="xl-bold" style={[pal.link, s.pr5]}>
                  Retry
                </Text>
              </TouchableOpacity>
            ) : model.isFetchingServiceDescription ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text type="xl" style={[pal.text, s.pr5]}>
                  Connecting...
                </Text>
              </>
            ) : undefined}
          </View>
          <View style={s.footerSpacer} />
        </KeyboardAvoidingView>
      </ScrollView>
    )
  },
)

const styles = StyleSheet.create({
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  noTopBorder: {
    borderTopWidth: 0,
  },
  logoHero: {
    paddingTop: 30,
    paddingBottom: 40,
  },
  group: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  groupLabel: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  groupContent: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupContentIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },
  textBtn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  textBtnLabel: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textBtnFakeInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textBtnFakeInnerBtnIcon: {
    marginRight: 4,
  },
  picker: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    borderRadius: 10,
  },
  pickerLabel: {
    fontSize: 17,
  },
  checkbox: {
    borderWidth: 1,
    borderRadius: 2,
    width: 16,
    height: 16,
    marginLeft: 16,
  },
  checkboxFilled: {
    borderWidth: 1,
    borderRadius: 2,
    width: 16,
    height: 16,
    marginLeft: 16,
  },
  policies: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  error: {
    backgroundColor: colors.red4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  errorFloating: {
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
})
