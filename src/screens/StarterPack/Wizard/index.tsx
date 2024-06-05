import React from 'react'
import {Keyboard, View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {isAndroid, isWeb} from 'platform/detection'
import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {CenteredView} from 'view/com/util/Views'
import {useWizardState, WizardStep} from '#/screens/StarterPack/Wizard/State'
import {StepDetails} from '#/screens/StarterPack/Wizard/StepDetails'
import {StepFeeds} from '#/screens/StarterPack/Wizard/StepFeeds'
import {StepProfiles} from '#/screens/StarterPack/Wizard/StepProfiles'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {WizardAddDialog} from '#/components/StarterPack/Wizard/WizardAddDialog'
import {Text} from '#/components/Typography'
import {Provider} from './State'

export function Wizard({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'StarterPackWizard'>) {
  const params = route.params
  const {mode, initialStep, id} = params ?? {}

  // TODO load query here
  const starterPack = {}

  // TODO use this to wait for loading the starterpack for editing
  if (mode === 'Edit' && false) {
    // Await here
    return
  }

  return (
    <WizardReady
      mode={mode}
      id={id}
      initialStep={initialStep}
      starterPack={starterPack}
    />
  )
}

function WizardReady({
  mode,
  initialStep,
  starterPack,
}: {
  mode: 'Create' | 'Edit'
  id?: string
  initialStep?: 'Details' | 'Profiles' | 'Feeds'
  starterPack?: any
}) {
  return (
    <Provider
      initialState={mode === 'Edit' ? starterPack : undefined}
      initialStep={initialStep}>
      <WizardInner />
    </Provider>
  )
}

function WizardInner() {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()
  const bottomOffset = useBottomBarOffset()
  const [state, dispatch] = useWizardState()
  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 0,
  })
  const addDialogControl = useDialogControl()

  React.useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    })
  }, [navigation])

  // TODO move to state if we keep this
  const continueIsCta = () => {
    if (state.currentStep === 'Details') {
      return true
    } else if (state.currentStep === 'Profiles') {
      return state.profiles.length > 0
    } else if (state.currentStep === 'Feeds') {
      return state.feeds.length > 0
    }
  }

  const wizardUiStrings: Record<
    WizardStep,
    {header: string; nextBtn: string; subtitle?: string}
  > = {
    Details: {
      header: _(msg`Starter Pack`),
      nextBtn: _(msg`Next`),
    },
    Profiles: {
      header: _(msg`Profiles`),
      nextBtn: _(msg`Next`),
      subtitle: _(
        msg`Add people to your starter pack that you think others will enjoy following`,
      ),
    },
    Feeds: {
      header: _(msg`Feeds`),
      nextBtn: _(msg`Finish`),
      subtitle: _(msg`Some subtitle`),
    },
  }

  const uiStrings = wizardUiStrings[state.currentStep]

  const onNext = () => {
    if (state.currentStep === 'Details' && !state.name) {
      dispatch({
        type: 'SetName',
        name: _(
          msg`${currentProfile?.displayName || currentProfile?.handle}'s`,
        ),
      })
    } else if (state.currentStep === 'Feeds') {
      dispatch({type: 'SetProcessing', processing: true})
      return
    }

    const keyboardVisible = Keyboard.isVisible()
    Keyboard.dismiss()
    setTimeout(
      () => {
        dispatch({type: 'Next'})
      },
      keyboardVisible ? 16 : 0,
    )
  }

  return (
    <CenteredView
      style={[a.flex_1, {marginBottom: bottomOffset + 20}]}
      sideBorders>
      <View style={[]}>
        <View
          style={[
            a.flex_row,
            a.pb_sm,
            a.px_md,
            a.border_b,
            t.atoms.border_contrast_medium,
            a.gap_sm,
            a.justify_between,
            a.align_center,
            isAndroid && a.pt_sm,
            isWeb && [a.py_md],
          ]}>
          <View style={[{width: 65}]}>
            {state.currentStep !== 'Details' && (
              <Button
                label={_(msg`Back`)}
                variant="ghost"
                color="secondary"
                size="xsmall"
                onPress={() => dispatch({type: 'Back'})}>
                <ButtonText>
                  <Trans>Back</Trans>
                </ButtonText>
              </Button>
            )}
          </View>
          <Text style={[a.flex_1, a.font_bold, a.text_lg, a.text_center]}>
            {uiStrings.header}
          </Text>
          <View style={[{width: 65}]} />
        </View>
      </View>

      <Container>
        <StepView />
      </Container>

      <View style={[a.gap_sm]}>
        {state.currentStep !== 'Details' && (
          <Button
            label={_(msg`Cancel`)}
            onPress={addDialogControl.open}
            variant="ghost"
            color="primary"
            size="medium"
            style={[a.mx_2xl]}>
            <ButtonText>
              {state.currentStep === 'Profiles' ? (
                <Trans>Find People</Trans>
              ) : (
                <Trans>Find Feeds</Trans>
              )}
            </ButtonText>
          </Button>
        )}

        <Button
          label={_(msg`Cancel`)}
          onPress={onNext}
          variant={continueIsCta() ? 'solid' : 'ghost'}
          color={continueIsCta() ? 'primary' : 'secondary'}
          size="medium"
          style={[a.mx_2xl]}>
          <ButtonText>{uiStrings.nextBtn}</ButtonText>
        </Button>
      </View>

      {(state.currentStep === 'Profiles' || state.currentStep === 'Feeds') && (
        <WizardAddDialog
          control={addDialogControl}
          state={state}
          dispatch={dispatch}
          type={state.currentStep === 'Profiles' ? 'profiles' : 'feeds'}
        />
      )}
    </CenteredView>
  )
}

function Container({children}: {children: React.ReactNode}) {
  const [state] = useWizardState()

  if (state.currentStep === 'Profiles' || state.currentStep === 'Feeds') {
    return <View style={[a.flex_1]}>{children}</View>
  }

  return (
    <KeyboardAwareScrollView style={[a.flex_1]}>
      {children}
    </KeyboardAwareScrollView>
  )
}

function StepView() {
  const [state] = useWizardState()

  if (state.currentStep === 'Details') {
    return <StepDetails />
  }
  if (state.currentStep === 'Profiles') {
    return <StepProfiles />
  }
  if (state.currentStep === 'Feeds') {
    return <StepFeeds />
  }
}
