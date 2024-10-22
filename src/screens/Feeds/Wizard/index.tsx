import React from 'react'
import {TouchableOpacity, View} from 'react-native'
import {
  KeyboardAwareScrollView,
  useKeyboardController,
} from 'react-native-keyboard-controller'
import {AppBskyGraphDefs, AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_10} from '#/lib/constants'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {parseStarterPackUri} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'
import {isAndroid, isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useCreateFeedMutation} from '#/state/queries/feed'
import {useAllListMembersQuery} from '#/state/queries/list-members'
import {useProfileQuery} from '#/state/queries/profile'
import {
  useEditStarterPackMutation,
  useStarterPackQuery,
} from '#/state/queries/starter-packs'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import * as Toast from '#/view/com/util/Toast'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {useWizardState, WizardStep} from './State'
import {Provider} from './State'
import {StepDetails} from './StepDetails'

export function Wizard({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'FeedsEdit' | 'FeedsWizard'>) {
  const {rkey} = route.params ?? {}
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const {_} = useLingui()

  const {
    data: starterPack,
    isLoading: isLoadingStarterPack,
    isError: isErrorStarterPack,
  } = useStarterPackQuery({did: currentAccount!.did, rkey})
  const listUri = starterPack?.list?.uri

  const {
    data: listItems,
    isLoading: isLoadingProfiles,
    isError: isErrorProfiles,
  } = useAllListMembersQuery(listUri)

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useProfileQuery({did: currentAccount?.did})

  const isEdit = Boolean(rkey)
  const isReady =
    (!isEdit || (isEdit && starterPack && listItems)) &&
    profile &&
    moderationOpts

  if (!isReady) {
    return (
      <Layout.Screen>
        <ListMaybePlaceholder
          isLoading={
            isLoadingStarterPack || isLoadingProfiles || isLoadingProfile
          }
          isError={isErrorStarterPack || isErrorProfiles || isErrorProfile}
          errorMessage={_(msg`That starter pack could not be found.`)}
        />
      </Layout.Screen>
    )
  } else if (isEdit && starterPack?.creator.did !== currentAccount?.did) {
    return (
      <Layout.Screen>
        <ListMaybePlaceholder
          isLoading={false}
          isError={true}
          errorMessage={_(msg`That starter pack could not be found.`)}
        />
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen>
      <Provider starterPack={starterPack} listItems={listItems}>
        <WizardInner
          currentStarterPack={starterPack}
          currentListItems={listItems}
        />
      </Provider>
    </Layout.Screen>
  )
}

function WizardInner({
  currentStarterPack,
  currentListItems,
}: {
  currentStarterPack?: AppBskyGraphDefs.StarterPackView
  currentListItems?: AppBskyGraphDefs.ListItemView[]
}) {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {setEnabled} = useKeyboardController()
  const [state, dispatch] = useWizardState()
  const {currentAccount} = useSession()
  const parsed = parseStarterPackUri(currentStarterPack?.uri)

  React.useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    })
  }, [navigation])

  useFocusEffect(
    React.useCallback(() => {
      setEnabled(true)
      setMinimalShellMode(true)

      return () => {
        setMinimalShellMode(false)
        setEnabled(false)
      }
    }, [setMinimalShellMode, setEnabled]),
  )

  const getDefaultName = () => {
    return _(msg`Your feed name`)
  }

  const wizardUiStrings: Record<
    WizardStep,
    {header: string; nextBtn: string; subtitle?: string}
  > = {
    Details: {
      header: _(msg`Create a Feed`),
      nextBtn: _(msg`Finish`),
    },
  }
  const currUiStrings = wizardUiStrings[state.currentStep]

  const onSuccessCreate = (data: {uri: string; cid: string}) => {
    const rkey = new AtUri(data.uri).rkey
    dispatch({type: 'SetProcessing', processing: false})
    navigation.replace('ProfileFeed', {
      name: currentAccount!.handle,
      rkey,
    })
  }

  const onSuccessEdit = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.replace('ProfileFeed', {
        name: currentAccount!.handle,
        rkey: parsed!.rkey,
      })
    }
  }

  const {mutate: createFeed} = useCreateFeedMutation({
    onSuccess: onSuccessCreate,
    onError: e => {
      logger.error('Failed to create starter pack', {safeMessage: e})
      dispatch({type: 'SetProcessing', processing: false})
      Toast.show(_(msg`Failed to create starter pack`), 'xmark')
    },
  })

  // TODO
  const {mutate: editStarterPack} = useEditStarterPackMutation({
    onSuccess: onSuccessEdit,
    onError: e => {
      logger.error('Failed to edit starter pack', {safeMessage: e})
      dispatch({type: 'SetProcessing', processing: false})
      Toast.show(_(msg`Failed to create starter pack`), 'xmark')
    },
  })

  const submit = async () => {
    dispatch({type: 'SetProcessing', processing: true})
    if (currentStarterPack && currentListItems) {
      editStarterPack({
        name: state.name?.trim() || getDefaultName(),
        description: state.description?.trim(),
        profiles: state.profiles,
        feeds: state.feeds,
        currentStarterPack: currentStarterPack,
        currentListItems: currentListItems,
      })
    } else {
      createFeed({
        name: state.name?.trim() || getDefaultName(),
        description: state.description?.trim(),
      })
    }
  }

  return (
    <CenteredView style={[a.flex_1]} sideBorders>
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
          <TouchableOpacity
            testID="viewHeaderDrawerBtn"
            hitSlop={HITSLOP_10}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Back`)}
            accessibilityHint={_(msg`Go back to the previous step`)}
            onPress={() => {
              if (state.currentStep === 'Details') {
                navigation.pop()
              } else {
                dispatch({type: 'Back'})
              }
            }}>
            <FontAwesomeIcon
              size={18}
              icon="angle-left"
              color={t.atoms.text.color}
            />
          </TouchableOpacity>
        </View>
        <Text style={[a.flex_1, a.font_bold, a.text_lg, a.text_center]}>
          {currUiStrings.header}
        </Text>
        <View style={[{width: 65}]} />
      </View>

      <Container onFinish={submit}>
        {state.currentStep === 'Details' ? <StepDetails /> : null}
      </Container>
    </CenteredView>
  )
}

function Container({
  children,
  onFinish,
}: {
  children: React.ReactNode
  onFinish: () => void
}) {
  const {_} = useLingui()
  const [state] = useWizardState()

  return (
    <KeyboardAwareScrollView
      style={[a.flex_1]}
      keyboardShouldPersistTaps="handled">
      {children}
      {state.currentStep === 'Details' && (
        <>
          <Button
            label={_(msg`Finish`)}
            variant="solid"
            color="primary"
            size="large"
            style={[a.mx_xl, a.mb_lg, {marginTop: 35}]}
            onPress={onFinish}>
            <ButtonText>
              <Trans>Finish</Trans>
            </ButtonText>
          </Button>
        </>
      )}
    </KeyboardAwareScrollView>
  )
}
