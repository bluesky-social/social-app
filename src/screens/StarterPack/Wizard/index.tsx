import React from 'react'
import {Keyboard, View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Image} from 'expo-image'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  AtUri,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {STARTER_PACK_MAX_SIZE} from '#/lib/constants'
import {useEnableKeyboardControllerScreen} from '#/lib/hooks/useEnableKeyboardController'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {
  getStarterPackOgCard,
  parseStarterPackUri,
} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAllListMembersQuery} from '#/state/queries/list-members'
import {useProfileQuery} from '#/state/queries/profile'
import {
  useCreateStarterPackMutation,
  useEditStarterPackMutation,
  useStarterPackQuery,
} from '#/state/queries/starter-packs'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {
  useWizardState,
  type WizardStep,
} from '#/screens/StarterPack/Wizard/State'
import {StepDetails} from '#/screens/StarterPack/Wizard/StepDetails'
import {StepFeeds} from '#/screens/StarterPack/Wizard/StepFeeds'
import {StepProfiles} from '#/screens/StarterPack/Wizard/StepProfiles'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as Layout from '#/components/Layout'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {WizardEditListDialog} from '#/components/StarterPack/Wizard/WizardEditListDialog'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'
import {Provider} from './State'

export function Wizard({
  route,
}: NativeStackScreenProps<
  CommonNavigatorParams,
  'StarterPackEdit' | 'StarterPackWizard'
>) {
  const params = route.params ?? {}
  const rkey = 'rkey' in params ? params.rkey : undefined
  const fromDialog = 'fromDialog' in params ? params.fromDialog : false
  const targetDid = 'targetDid' in params ? params.targetDid : undefined
  const onSuccess = 'onSuccess' in params ? params.onSuccess : undefined
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const {_} = useLingui()

  // Use targetDid if provided (from dialog), otherwise use current account
  const profileDid = targetDid || currentAccount!.did

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
  } = useProfileQuery({did: profileDid})

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
    <Layout.Screen
      testID="starterPackWizardScreen"
      style={web([{minHeight: 0}, a.flex_1])}>
      <Provider
        starterPack={starterPack}
        listItems={listItems}
        targetProfile={profile}>
        <WizardInner
          currentStarterPack={starterPack}
          currentListItems={listItems}
          profile={profile}
          moderationOpts={moderationOpts}
          fromDialog={fromDialog}
          onSuccess={onSuccess}
        />
      </Provider>
    </Layout.Screen>
  )
}

function WizardInner({
  currentStarterPack,
  currentListItems,
  profile,
  moderationOpts,
  fromDialog,
  onSuccess,
}: {
  currentStarterPack?: AppBskyGraphDefs.StarterPackView
  currentListItems?: AppBskyGraphDefs.ListItemView[]
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  fromDialog?: boolean
  onSuccess?: () => void
}) {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [state, dispatch] = useWizardState()
  const {currentAccount} = useSession()

  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 0,
  })
  const parsed = parseStarterPackUri(currentStarterPack?.uri)

  React.useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    })
  }, [navigation])

  useEnableKeyboardControllerScreen(true)

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(true)

      return () => {
        setMinimalShellMode(false)
      }
    }, [setMinimalShellMode]),
  )

  const getDefaultName = () => {
    const displayName = createSanitizedDisplayName(currentProfile!, true)
    return _(msg`${displayName}'s Starter Pack`).slice(0, 50)
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
      header: _(msg`Choose People`),
      nextBtn: _(msg`Next`),
    },
    Feeds: {
      header: _(msg`Choose Feeds`),
      nextBtn: state.feeds.length === 0 ? _(msg`Skip`) : _(msg`Finish`),
    },
  }
  const currUiStrings = wizardUiStrings[state.currentStep]

  const onSuccessCreate = (data: {uri: string; cid: string}) => {
    const rkey = new AtUri(data.uri).rkey
    logEvent('starterPack:create', {
      setName: state.name != null,
      setDescription: state.description != null,
      profilesCount: state.profiles.length,
      feedsCount: state.feeds.length,
    })
    Image.prefetch([getStarterPackOgCard(currentProfile!.did, rkey)])
    dispatch({type: 'SetProcessing', processing: false})

    if (fromDialog) {
      navigation.goBack()
      onSuccess?.()
    } else {
      navigation.replace('StarterPack', {
        name: profile!.handle,
        rkey,
        new: true,
      })
    }
  }

  const onSuccessEdit = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.replace('StarterPack', {
        name: currentAccount!.handle,
        rkey: parsed!.rkey,
      })
    }
  }

  const {mutate: createStarterPack} = useCreateStarterPackMutation({
    onSuccess: onSuccessCreate,
    onError: e => {
      logger.error('Failed to create starter pack', {safeMessage: e})
      dispatch({type: 'SetProcessing', processing: false})
      Toast.show(_(msg`Failed to create starter pack`), 'xmark')
    },
  })
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
      createStarterPack({
        name: state.name?.trim() || getDefaultName(),
        description: state.description?.trim(),
        profiles: state.profiles,
        feeds: state.feeds,
      })
    }
  }

  const onNext = () => {
    if (state.currentStep === 'Feeds') {
      submit()
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

  const items = state.currentStep === 'Profiles' ? state.profiles : state.feeds

  const isEditEnabled =
    (state.currentStep === 'Profiles' && items.length > 1) ||
    (state.currentStep === 'Feeds' && items.length > 0)

  const editDialogControl = useDialogControl()

  return (
    <Layout.Center style={[a.flex_1]}>
      <Layout.Header.Outer>
        <Layout.Header.BackButton
          label={_(msg`Back`)}
          accessibilityHint={_(msg`Returns to the previous step`)}
          onPress={evt => {
            if (state.currentStep !== 'Details') {
              evt.preventDefault()
              dispatch({type: 'Back'})
            }
          }}
        />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            {currUiStrings.header}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {isEditEnabled ? (
          <Button
            label={_(msg`Edit`)}
            color="secondary"
            size="small"
            onPress={editDialogControl.open}>
            <ButtonText>
              <Trans>Edit</Trans>
            </ButtonText>
          </Button>
        ) : (
          <Layout.Header.Slot />
        )}
      </Layout.Header.Outer>

      <Container>
        {state.currentStep === 'Details' ? (
          <StepDetails />
        ) : state.currentStep === 'Profiles' ? (
          <StepProfiles moderationOpts={moderationOpts} />
        ) : state.currentStep === 'Feeds' ? (
          <StepFeeds moderationOpts={moderationOpts} />
        ) : null}
      </Container>

      {state.currentStep !== 'Details' && (
        <Footer onNext={onNext} nextBtnText={currUiStrings.nextBtn} />
      )}
      <WizardEditListDialog
        control={editDialogControl}
        state={state}
        dispatch={dispatch}
        moderationOpts={moderationOpts}
        profile={profile}
      />
    </Layout.Center>
  )
}

function Container({children}: {children: React.ReactNode}) {
  const {_} = useLingui()
  const [state, dispatch] = useWizardState()

  if (state.currentStep === 'Profiles' || state.currentStep === 'Feeds') {
    return <View style={[a.flex_1]}>{children}</View>
  }

  return (
    <KeyboardAwareScrollView
      style={[a.flex_1]}
      keyboardShouldPersistTaps="handled">
      {children}
      {state.currentStep === 'Details' && (
        <>
          <Button
            label={_(msg`Next`)}
            variant="solid"
            color="primary"
            size="large"
            style={[a.mx_xl, a.mb_lg, {marginTop: 35}]}
            onPress={() => dispatch({type: 'Next'})}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
          </Button>
        </>
      )}
    </KeyboardAwareScrollView>
  )
}

function Footer({
  onNext,
  nextBtnText,
}: {
  onNext: () => void
  nextBtnText: string
}) {
  const t = useTheme()
  const [state] = useWizardState()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const {currentAccount} = useSession()
  const items = state.currentStep === 'Profiles' ? state.profiles : state.feeds

  const minimumItems = state.currentStep === 'Profiles' ? 8 : 0

  const textStyles = [a.text_md]

  return (
    <View
      style={[
        a.border_t,
        a.align_center,
        a.px_lg,
        a.pt_xl,
        a.gap_md,
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        {
          paddingBottom: a.pb_lg.paddingBottom + bottomInset,
        },
        IS_NATIVE && [
          a.border_l,
          a.border_r,
          t.atoms.shadow_md,
          {
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
          },
        ],
      ]}>
      {items.length > minimumItems && (
        <View style={[a.absolute, {right: 14, top: 31}]}>
          <Text style={[a.font_semi_bold]}>
            {items.length}/
            {state.currentStep === 'Profiles' ? STARTER_PACK_MAX_SIZE : 3}
          </Text>
        </View>
      )}

      <View style={[a.flex_row]}>
        {items.slice(0, 6).map((p, index) => (
          <View
            key={index}
            style={[
              a.rounded_full,
              {
                borderWidth: 0.5,
                borderColor: t.atoms.bg.backgroundColor,
              },
              state.currentStep === 'Profiles'
                ? {zIndex: 1 - index, marginLeft: index > 0 ? -8 : 0}
                : {marginRight: 4},
            ]}>
            <UserAvatar
              avatar={p.avatar}
              size={32}
              type={state.currentStep === 'Profiles' ? 'user' : 'algo'}
            />
          </View>
        ))}
      </View>

      {
        state.currentStep === 'Profiles' ? (
          <Text style={[a.text_center, textStyles]}>
            {
              items.length < 2 ? (
                currentAccount?.did === items[0].did ? (
                  <Trans>
                    It's just you right now! Add more people to your starter
                    pack by searching above.
                  </Trans>
                ) : (
                  <Trans>
                    It's just{' '}
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[0])}{' '}
                    </Text>
                    right now! Add more people to your starter pack by searching
                    above.
                  </Trans>
                )
              ) : items.length === 2 ? (
                currentAccount?.did === items[0].did ? (
                  <Trans>
                    <Text style={[a.font_semi_bold, textStyles]}>You</Text> and
                    <Text> </Text>
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[1] /* [0] is self, skip it */)}{' '}
                    </Text>
                    are included in your starter pack
                  </Trans>
                ) : (
                  <Trans>
                    <Text style={[a.font_semi_bold, textStyles]}>
                      {getName(items[0])}
                    </Text>{' '}
                    and
                    <Text> </Text>
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[1] /* [0] is self, skip it */)}{' '}
                    </Text>
                    are included in your starter pack
                  </Trans>
                )
              ) : items.length > 2 ? (
                <Trans context="profiles">
                  <Text style={[a.font_semi_bold, textStyles]} emoji>
                    {getName(items[1] /* [0] is self, skip it */)},{' '}
                  </Text>
                  <Text style={[a.font_semi_bold, textStyles]} emoji>
                    {getName(items[2])},{' '}
                  </Text>
                  and{' '}
                  <Plural
                    value={items.length - 2}
                    one="# other"
                    other="# others"
                  />{' '}
                  are included in your starter pack
                </Trans>
              ) : null /* Should not happen. */
            }
          </Text>
        ) : state.currentStep === 'Feeds' ? (
          items.length === 0 ? (
            <View style={[a.gap_sm]}>
              <Text style={[a.font_semi_bold, a.text_center, textStyles]}>
                <Trans>Add some feeds to your starter pack!</Trans>
              </Text>
              <Text style={[a.text_center, textStyles]}>
                <Trans>
                  Search for feeds that you want to suggest to others.
                </Trans>
              </Text>
            </View>
          ) : (
            <Text style={[a.text_center, textStyles]}>
              {
                items.length === 1 ? (
                  <Trans>
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[0])}
                    </Text>{' '}
                    is included in your starter pack
                  </Trans>
                ) : items.length === 2 ? (
                  <Trans>
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[0])}
                    </Text>{' '}
                    and
                    <Text> </Text>
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[1])}{' '}
                    </Text>
                    are included in your starter pack
                  </Trans>
                ) : items.length > 2 ? (
                  <Trans context="feeds">
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[0])},{' '}
                    </Text>
                    <Text style={[a.font_semi_bold, textStyles]} emoji>
                      {getName(items[1])},{' '}
                    </Text>
                    and{' '}
                    <Plural
                      value={items.length - 2}
                      one="# other"
                      other="# others"
                    />{' '}
                    are included in your starter pack
                  </Trans>
                ) : null /* Should not happen. */
              }
            </Text>
          )
        ) : null /* Should not happen. */
      }

      <View
        style={[
          a.w_full,
          a.align_center,
          a.gap_2xl,
          IS_NATIVE ? a.mt_sm : a.mt_md,
        ]}>
        {state.currentStep === 'Profiles' && items.length < 8 && (
          <Text
            style={[
              a.font_semi_bold,
              textStyles,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>Add {8 - items.length} more to continue</Trans>
          </Text>
        )}
        <Button
          label={nextBtnText}
          style={[a.w_full, a.py_md, a.px_2xl]}
          color="primary"
          size="large"
          onPress={onNext}
          disabled={
            !state.canNext ||
            state.processing ||
            (state.currentStep === 'Profiles' && items.length < 8)
          }>
          <ButtonText>{nextBtnText}</ButtonText>
          {state.processing && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}

function getName(
  item: bsky.profile.AnyProfileView | AppBskyFeedDefs.GeneratorView,
) {
  if (typeof item.displayName === 'string') {
    return enforceLen(sanitizeDisplayName(item.displayName), 28, true)
  } else if ('handle' in item && typeof item.handle === 'string') {
    return enforceLen(sanitizeHandle(item.handle), 28, true)
  }
  return ''
}
