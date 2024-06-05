import React from 'react'
import {Keyboard, View} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {useWizardState, WizardStep} from '#/screens/StarterPack/Wizard/State'
import {StepDetails} from '#/screens/StarterPack/Wizard/StepDetails'
import {StepFeeds} from '#/screens/StarterPack/Wizard/StepFeeds'
import {StepProfiles} from '#/screens/StarterPack/Wizard/StepProfiles'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {WizardAddDialog} from '#/components/StarterPack/Wizard/WizardAddDialog'
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
  const bottomBarOffset = useBottomBarOffset()
  const searchDialogControl = useDialogControl()

  React.useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    })
  }, [navigation])

  const wizardUiStrings: Record<WizardStep, {header: string; button: string}> =
    {
      Details: {
        header: _(msg`Starter Pack`),
        button: _(msg`Continue`),
      },
      Profiles: {
        header: _(msg`Profiles`),
        button: _(msg`Continue`),
      },
      Feeds: {
        header: _(msg`Feeds`),
        button: _(msg`Finish`),
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
      <ViewHeader
        title={uiStrings.header}
        onBackPress={
          state.currentStep !== 'Details'
            ? () => dispatch({type: 'Back'})
            : undefined
        }
        showBorder={true}
        showOnDesktop={true}
        renderButton={
          state.currentStep === 'Profiles' || state.currentStep === 'Feeds'
            ? () => (
                <Button
                  label={_(msg`Cancel`)}
                  variant="solid"
                  color="primary"
                  size="xsmall"
                  onPress={searchDialogControl.open}
                  style={{marginLeft: -15}}>
                  <ButtonText>
                    <Trans>Add</Trans>
                  </ButtonText>
                </Button>
              )
            : undefined
        }
      />
      <Container>
        <StepView />
      </Container>
      <KeyboardStickyView offset={{opened: bottomBarOffset}}>
        <View style={a.px_md}>
          <Button
            label={uiStrings.button}
            variant="solid"
            color="primary"
            size="large"
            onPress={onNext}
            disabled={!state.canNext || state.processing}>
            <ButtonText>{uiStrings.button}</ButtonText>
            {state.processing && (
              <Loader size="md" style={t.atoms.text_contrast_low} />
            )}
          </Button>
        </View>
      </KeyboardStickyView>

      {(state.currentStep === 'Profiles' || state.currentStep === 'Feeds') && (
        <WizardAddDialog
          control={searchDialogControl}
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
