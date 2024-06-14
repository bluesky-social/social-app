import React from 'react'
import {Keyboard, TouchableOpacity, View} from 'react-native'
import {
  KeyboardAwareScrollView,
  useKeyboardController,
} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
  AtUri,
} from '@atproto/api'
import {GeneratorView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_10} from 'lib/constants'
import {createStarterPackList} from 'lib/generate-starterpack'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {enforceLen} from 'lib/strings/helpers'
import {isAndroid, isNative, isWeb} from 'platform/detection'
import {invalidateActorStarterPacksQuery} from 'state/queries/actor-starter-packs'
import {
  invalidateListMembersQuery,
  useListMembersQuery,
} from 'state/queries/list-members'
import {useProfileQuery} from 'state/queries/profile'
import {useResolveDidQuery} from 'state/queries/resolve-uri'
import {
  invalidateStarterPack,
  useStarterPackQuery,
} from 'state/queries/useStarterPackQuery'
import {useAgent, useSession} from 'state/session'
import {useSetMinimalShellMode} from 'state/shell'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {useWizardState, WizardStep} from '#/screens/StarterPack/Wizard/State'
import {StepDetails} from '#/screens/StarterPack/Wizard/StepDetails'
import {StepFeeds} from '#/screens/StarterPack/Wizard/StepFeeds'
import {StepProfiles} from '#/screens/StarterPack/Wizard/StepProfiles'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {WizardEditListDialog} from '#/components/StarterPack/Wizard/WizardEditListDialog'
import {Text} from '#/components/Typography'
import {Provider} from './State'

export function Wizard({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'StarterPackWizard'>) {
  const {name, rkey} = route.params ?? {}
  const {currentAccount} = useSession()

  const {_} = useLingui()

  const {
    data: did,
    isLoading: isLoadingDid,
    isError: isErrorDid,
  } = useResolveDidQuery(name)
  const {
    data: starterPack,
    isLoading: isLoadingStarterPack,
    isError: isErrorStarterPack,
  } = useStarterPackQuery({did, rkey})

  const listUri = starterPack?.list?.uri

  const {
    data: profilesData,
    isLoading: isLoadingProfiles,
    isError: isErrorProfiles,
  } = useListMembersQuery(listUri, 50)
  const listItems = profilesData?.pages.flatMap(p => p.items)

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useProfileQuery({did: currentAccount?.did})

  if (
    (name &&
      rkey &&
      (!starterPack || (starterPack && listUri && !listItems))) ||
    !profile
  ) {
    return (
      <ListMaybePlaceholder
        isLoading={
          isLoadingDid ||
          isLoadingStarterPack ||
          isLoadingProfiles ||
          isLoadingProfile
        }
        isError={
          isErrorDid || isErrorStarterPack || isErrorProfiles || isErrorProfile
        }
        errorMessage={_(msg`Could not find that starter pack`)}
      />
    )
  } else if (name && rkey && starterPack?.creator.did !== currentAccount?.did) {
    return (
      <ListMaybePlaceholder
        isLoading={false}
        isError={true}
        errorMessage={_(msg`Could not find that starter pack`)}
      />
    )
  }

  return (
    <Provider starterPack={starterPack} listItems={listItems} profile={profile}>
      <WizardInner
        did={did}
        rkey={rkey}
        createdAt={
          AppBskyGraphStarterpack.isRecord(starterPack?.record)
            ? starterPack.record.createdAt
            : undefined
        }
        listItems={listItems}
        listUri={listUri}
      />
    </Provider>
  )
}

function WizardInner({
  did,
  rkey,
  createdAt: initialCreatedAt,
  listUri: initialListUri,
  listItems: initialListItems,
}: {
  did?: string
  rkey?: string
  createdAt?: string
  listUri?: string
  listItems?: AppBskyGraphDefs.ListItemView[]
}) {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()
  const [state, dispatch] = useWizardState()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 0,
  })
  const {setEnabled} = useKeyboardController()

  useFocusEffect(
    React.useCallback(() => {
      setEnabled(true)
      return () => {
        setEnabled(false)
      }
    }, [setEnabled]),
  )

  const setMinimalShellMode = useSetMinimalShellMode()

  React.useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    })
  }, [navigation])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(true)
      return () => setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const defaultName = _(
    msg`${
      currentProfile?.displayName || `@${currentProfile?.handle}`
    }'s Starter Pack`,
  )

  const wizardUiStrings: Record<
    WizardStep,
    {header: string; nextBtn: string; subtitle?: string}
  > = {
    Details: {
      header: _(msg`Starter Pack`),
      nextBtn: _(msg`Next`),
    },
    Profiles: {
      header: _(msg`People`),
      nextBtn: _(msg`Next`),
      subtitle: _(
        msg`Add people to your starter pack that you think others will enjoy following`,
      ),
    },
    Feeds: {
      header: _(msg`Feeds`),
      nextBtn: state.feeds.length === 0 ? _(msg`Skip`) : _(msg`Finish`),
      subtitle: _(msg`Some subtitle`),
    },
  }

  const uiStrings = wizardUiStrings[state.currentStep]

  const invalidateQueries = async () => {
    if (!did || !rkey) return

    if (initialListUri) {
      await invalidateListMembersQuery({queryClient, uri: initialListUri})
    }
    await invalidateActorStarterPacksQuery({
      queryClient,
      did,
    })
    await invalidateStarterPack({
      queryClient,
      did,
      rkey,
    })
  }

  const submit = async () => {
    dispatch({type: 'SetProcessing', processing: true})

    try {
      if (did && rkey) {
        // Editing an existing starter pack
        let list: {uri: string; cid: string} | undefined = initialListUri
          ? {uri: initialListUri, cid: ''}
          : undefined
        if (initialListUri) {
          const removedItems = initialListItems?.filter(
            i => !state.profiles.find(p => p.did === i.subject.did),
          )
          if (removedItems && removedItems.length > 0) {
            await agent.com.atproto.repo.applyWrites({
              repo: currentAccount!.did,
              writes: removedItems.map(i => ({
                $type: 'com.atproto.repo.applyWrites#delete',
                collection: 'app.bsky.graph.listitem',
                rkey: new AtUri(i.uri).rkey,
              })),
            })
          }

          const addedProfiles = state.profiles.filter(
            p => !initialListItems?.find(i => i.subject.did === p.did),
          )

          if (addedProfiles.length > 0) {
            await agent.com.atproto.repo.applyWrites({
              repo: currentAccount!.did,
              writes: addedProfiles.map(p => ({
                $type: 'com.atproto.repo.applyWrites#create',
                collection: 'app.bsky.graph.listitem',
                value: {
                  $type: 'app.bsky.graph.listitem',
                  subject: p.did,
                  list: list?.uri,
                  createdAt: new Date().toISOString(),
                },
              })),
            })
          }
        } else {
          list = await createStarterPackList({
            name: state.name ?? defaultName,
            description: state.description,
            descriptionFacets: [],
            profiles: state.profiles,
            agent,
          })
        }

        await agent.com.atproto.repo.putRecord({
          repo: currentAccount!.did,
          collection: 'app.bsky.graph.starterpack',
          rkey,
          record: {
            name: state.name ?? defaultName,
            description: state.description,
            descriptionFacets: [],
            list: list?.uri,
            feeds: state.feeds.map(f => ({
              uri: f.uri,
            })),
            createdAt: initialCreatedAt,
            updatedAt: new Date().toISOString(),
          },
        })

        await invalidateQueries()

        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.replace('StarterPack', {
              name: currentAccount!.handle,
              rkey,
            })
          }
          dispatch({type: 'SetProcessing', processing: false})
        }, 1000)
      } else {
        // Creating a new starter pack
        const list = await createStarterPackList({
          name: state.name ?? defaultName,
          description: state.description,
          descriptionFacets: [],
          profiles: state.profiles,
          agent,
        })
        const res = await agent.app.bsky.graph.starterpack.create(
          {
            repo: currentAccount!.did,
            validate: false,
          },
          {
            name: state.name ?? defaultName,
            description: state.description,
            descriptionFacets: [],
            list: list.uri,
            feeds: state.feeds.map(f => ({
              uri: f.uri,
            })),
            createdAt: new Date().toISOString(),
          },
        )

        const newRkey = new AtUri(res.uri).rkey

        setTimeout(() => {
          navigation.replace('StarterPack', {
            name: currentAccount!.handle,
            rkey: newRkey,
          })
          dispatch({type: 'SetProcessing', processing: false})
        }, 1000)
      }
    } catch (e) {
      Toast.show(_(msg`Failed to create starter pack`))
      dispatch({type: 'SetProcessing', processing: false})
      return
    }
  }

  const deleteStarterPack = async () => {
    if (!rkey || !initialListUri) return

    dispatch({type: 'SetProcessing', processing: true})

    try {
      await agent.app.bsky.graph.list.delete({
        repo: currentAccount!.did,
        rkey: new AtUri(initialListUri).rkey,
      })
      await agent.app.bsky.graph.starterpack.delete({
        repo: currentAccount!.did,
        rkey,
      })
      await invalidateQueries()
      navigation.popToTop()
    } catch (e) {
      Toast.show(_(msg`Failed to delete starter pack`))
    } finally {
      dispatch({type: 'SetProcessing', processing: false})
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
                navigation.goBack()
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
          {uiStrings.header}
        </Text>
        <View style={[{width: 65}]} />
      </View>

      <Container
        showDeleteBtn={Boolean(did && rkey)}
        deleteStarterPack={deleteStarterPack}>
        <StepView />
      </Container>

      {state.currentStep !== 'Details' && (
        <Footer onNext={onNext} nextBtnText={uiStrings.nextBtn} />
      )}
    </CenteredView>
  )
}

function Container({
  showDeleteBtn,
  deleteStarterPack,
  children,
}: {
  showDeleteBtn: boolean
  deleteStarterPack: () => Promise<void>
  children: React.ReactNode
}) {
  const {_} = useLingui()
  const [state, dispatch] = useWizardState()
  const control = useDialogControl()

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
            size="medium"
            style={[a.mx_xl, a.mb_lg, {marginTop: 35}]}
            onPress={() => dispatch({type: 'Next'})}
            disabled={!state.canNext}>
            <ButtonText>
              <Trans>Next</Trans>
            </ButtonText>
          </Button>
          {showDeleteBtn && (
            <Button
              label={_(msg`Next`)}
              variant="ghost"
              color="negative"
              size="medium"
              style={[a.mx_xl, a.mb_lg]}
              onPress={control.open}
              disabled={!state.canNext}>
              <ButtonText>
                <Trans>Delete</Trans>
              </ButtonText>
            </Button>
          )}
          <Prompt.Outer control={control}>
            <Prompt.TitleText>
              <Trans>Delete starter pack?</Trans>
            </Prompt.TitleText>
            <Prompt.DescriptionText>
              <Trans>Are you sure you want delete this starter pack?</Trans>
            </Prompt.DescriptionText>
            <Prompt.Actions>
              <Prompt.Action
                onPress={deleteStarterPack}
                color="negative"
                cta={_(msg`Delete`)}
              />
              <Prompt.Cancel />
            </Prompt.Actions>
          </Prompt.Outer>
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
  const {_} = useLingui()
  const t = useTheme()
  const [state, dispatch] = useWizardState()
  const editDialogControl = useDialogControl()
  const {bottom: bottomInset} = useSafeAreaInsets()

  const items = state.currentStep === 'Profiles' ? state.profiles : state.feeds
  const initialNamesIndex = state.currentStep === 'Profiles' ? 1 : 0

  const isEditEnabled =
    (state.currentStep === 'Profiles' && items.length > 1) ||
    (state.currentStep === 'Feeds' && items.length > 0)

  const minimumItems = state.currentStep === 'Profiles' ? 8 : 0

  const textStyles = [a.text_md]

  return (
    <View
      style={[
        a.border_t,
        a.align_center,
        a.px_md,
        a.pt_xl,
        a.gap_md,
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        {
          height: isNative ? 224 : 200,
          paddingBottom: 20 + bottomInset,
        },
        isNative && [
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
          <Text style={[a.font_bold]}>
            {items.length}/{state.currentStep === 'Profiles' ? 50 : 3}
          </Text>
        </View>
      )}

      <View style={[a.flex_row, a.gap_xs]}>
        {items.slice(0, 6).map((p, index) => (
          <UserAvatar
            key={index}
            avatar={p.avatar}
            size={32}
            type={state.currentStep === 'Profiles' ? 'user' : 'algo'}
          />
        ))}
      </View>

      {items.length === 0 ? (
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_center, textStyles]}>
            <Trans>Add some feeds to your starter pack!</Trans>
          </Text>
          <Text style={[a.text_center, textStyles]}>
            <Trans>Search for feeds that you want to suggest to others.</Trans>
          </Text>
        </View>
      ) : (
        <Text style={[a.text_center, textStyles]}>
          {state.currentStep === 'Profiles' && items.length === 1 ? (
            <Trans>
              It's just you right now! Add more people to your starter pack by
              searching above.
            </Trans>
          ) : items.length === 1 ? (
            <Trans>
              <Text style={[a.font_bold, textStyles]}>
                {getName(items[initialNamesIndex])}
              </Text>{' '}
              is included in your starter pack
            </Trans>
          ) : items.length === 2 ? (
            <Trans>
              <Text style={[a.font_bold, textStyles]}>
                {getName(items[initialNamesIndex])}{' '}
              </Text>
              and
              <Text> </Text>
              <Text style={[a.font_bold, textStyles]}>
                {getName(items[state.currentStep === 'Profiles' ? 0 : 1])}{' '}
              </Text>
              are included in your starter pack
            </Trans>
          ) : (
            <Trans>
              <Text style={[a.font_bold, textStyles]}>
                {getName(items[initialNamesIndex])},{' '}
              </Text>
              <Text style={[a.font_bold, textStyles]}>
                {getName(items[initialNamesIndex + 1])},{' '}
              </Text>
              and {items.length - 2}{' '}
              <Plural value={items.length - 2} one="other" other="others" /> are
              included in your starter pack
            </Trans>
          )}
        </Text>
      )}

      <View
        style={[
          a.flex_row,
          a.w_full,
          a.justify_between,
          a.align_center,
          {marginTop: 'auto'},
        ]}>
        {isEditEnabled ? (
          <Button
            label={_(msg`Edit`)}
            variant="ghost"
            color="primary"
            size="small"
            style={{width: 70}}
            onPress={editDialogControl.open}>
            <ButtonText>
              <Trans>Edit</Trans>
            </ButtonText>
          </Button>
        ) : (
          <View style={{width: 70, height: 35}} />
        )}
        {state.currentStep === 'Profiles' && items.length < 8 ? (
          <>
            <Text
              style={[a.font_bold, textStyles, t.atoms.text_contrast_medium]}>
              <Trans>Add {8 - items.length} more to continue</Trans>
            </Text>
            <View style={{width: 70}} />
          </>
        ) : (
          <Button
            label={nextBtnText}
            variant="solid"
            color="primary"
            size="small"
            onPress={onNext}
            disabled={!state.canNext}>
            <ButtonText>{nextBtnText}</ButtonText>
            {state.processing && <Loader size="xs" style={{color: 'white'}} />}
          </Button>
        )}
      </View>

      <WizardEditListDialog
        control={editDialogControl}
        state={state}
        dispatch={dispatch}
      />
    </View>
  )
}

function getName(item: AppBskyActorDefs.ProfileViewBasic | GeneratorView) {
  if (typeof item.displayName === 'string') {
    return enforceLen(item.displayName, 16, true)
  } else if (typeof item.handle === 'string') {
    return enforceLen(item.handle, 16, true)
  }
  return ''
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
