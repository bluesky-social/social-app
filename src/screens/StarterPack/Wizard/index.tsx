import React from 'react'
import {Keyboard, View} from 'react-native'
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Step, useWizardState} from '#/screens/StarterPack/Wizard/State'
import {StepDetails} from '#/screens/StarterPack/Wizard/StepDetails'
import {StepFeeds} from '#/screens/StarterPack/Wizard/StepFeeds'
import {StepLanding} from '#/screens/StarterPack/Wizard/StepLanding'
import {StepProfiles} from '#/screens/StarterPack/Wizard/StepProfiles'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Provider} from './State'

export function Wizard() {
  return (
    <Provider>
      <WizardInner />
    </Provider>
  )
}

function WizardInner() {
  const {_} = useLingui()
  const bottomOffset = useBottomBarOffset()
  const [state, dispatch] = useWizardState()
  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 0,
  })
  const bottomBarOffset = useBottomBarOffset()

  const wizardUiStrings: Record<Step, {header: string; button: string}> = {
    Landing: {
      header: _(msg`Create a starter pack`),
      button: _(msg`Create`),
    },
    Details: {
      header: _(msg`Details`),
      button: _(msg`Add profiles`),
    },
    Profiles: {
      header: _(msg`Add profiles`),
      button: _(msg`Add feeds`),
    },
    Feeds: {
      header: _(msg`Add feeds`),
      button: _(msg`Finish`),
    },
    Finished: {
      header: _(msg`Finished`),
      button: _(msg`Visit Starter Pack`),
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
    <CenteredView style={[a.flex_1, {marginBottom: bottomOffset + 20}]}>
      <ViewHeader
        title={uiStrings.header}
        onBackPress={
          state.currentStep !== 'Landing'
            ? () => dispatch({type: 'Back'})
            : undefined
        }
        showBorder={true}
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
            disabled={!state.canNext}>
            <ButtonText>{uiStrings.button}</ButtonText>
          </Button>
        </View>
      </KeyboardStickyView>
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

  if (state.currentStep === 'Landing') {
    return <StepLanding />
  }
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
