import {memo, useCallback, useMemo} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {type Shadow} from '#/state/cache/types'
import {useModalControls} from '#/state/modals'
import {Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {
  RQKEY as profileQueryKey,
  useProfileBlockMutationQueue,
  useProfileFollowMutationQueue,
  useProfileMuteMutationQueue,
} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {StarterPackDialog} from '#/components/dialogs/StarterPackDialog'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon} from '#/components/icons/ArrowOutOfBox'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {DotGrid3x1_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {ListSparkle_Stroke2_Corner0_Rounded as List} from '#/components/icons/ListSparkle'
import {Live_Stroke2_Corner0_Rounded as LiveIcon} from '#/components/icons/Live'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {PeopleRemove2_Stroke2_Corner0_Rounded as UserMinus} from '#/components/icons/PeopleRemove2'
import {
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
  PersonX_Stroke2_Corner0_Rounded as PersonX,
} from '#/components/icons/Person'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import {StarterPack} from '#/components/icons/StarterPack'
import * as Menu from '#/components/Menu'
import {BlockDialog} from '#/components/moderation/BlockDialog'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {useFullVerificationState} from '#/components/verification'
import {VerificationCreatePrompt} from '#/components/verification/VerificationCreatePrompt'
import {VerificationRemovePrompt} from '#/components/verification/VerificationRemovePrompt'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {useActorStatus, useLiveNowConfig} from '#/features/liveNow'
import {EditLiveDialog} from '#/features/liveNow/components/EditLiveDialog'
import {GoLiveDialog} from '#/features/liveNow/components/GoLiveDialog'
import {GoLiveDisabledDialog} from '#/features/liveNow/components/GoLiveDisabledDialog'
import {Dot} from '#/features/nuxs/components/Dot'
import {Gradient} from '#/features/nuxs/components/Gradient'
import {useDevMode} from '#/storage/hooks/dev-mode'

let ProfileMenu = ({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}): React.ReactNode => {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const {openModal} = useModalControls()
  const reportDialogControl = useReportDialogControl()
  const queryClient = useQueryClient()
  const navigation = useNavigation<NavigationProp>()
  const isSelf = currentAccount?.did === profile.did
  const isFollowing = profile.viewer?.following
  const isBlocked = profile.viewer?.blocking || profile.viewer?.blockedBy
  const isFollowingBlockedAccount = isFollowing && isBlocked
  const isLabelerAndNotBlocked = !!profile.associated?.labeler && !isBlocked
  const [devModeEnabled] = useDevMode()
  const verification = useFullVerificationState({profile})
  const {canGoLive} = useLiveNowConfig()
  const status = useActorStatus(profile)
  const statusNudge = useNux(Nux.LiveNowBetaNudge)
  const statusNudgeActive =
    isSelf &&
    canGoLive &&
    statusNudge.status === 'ready' &&
    !statusNudge.nux?.completed
  const {mutate: saveNux} = useSaveNux()

  const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile)
  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ProfileMenu',
  )

  const blockPromptControl = Prompt.usePromptControl()
  const loggedOutWarningPromptControl = Prompt.usePromptControl()
  const goLiveDialogControl = useDialogControl()
  const goLiveDisabledDialogControl = useDialogControl()
  const addToStarterPacksDialogControl = useDialogControl()

  const showLoggedOutWarning = useMemo(() => {
    return (
      profile.did !== currentAccount?.did &&
      !!profile.labels?.find(label => label.val === '!no-unauthenticated')
    )
  }, [currentAccount, profile])

  const invalidateProfileQuery = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: profileQueryKey(profile.did),
    })
  }, [queryClient, profile.did])

  const onPressAddToStarterPacks = useCallback(() => {
    ax.metric('profile:addToStarterPack', {})
    addToStarterPacksDialogControl.open()
  }, [addToStarterPacksDialogControl, ax])

  const onPressShare = useCallback(() => {
    void shareUrl(toShareUrl(makeProfileLink(profile)))
  }, [profile])

  const onPressAddRemoveLists = useCallback(() => {
    openModal({
      name: 'user-add-remove-lists',
      subject: profile.did,
      handle: profile.handle,
      displayName: profile.displayName || profile.handle,
      onAdd: invalidateProfileQuery,
      onRemove: invalidateProfileQuery,
    })
  }, [profile, openModal, invalidateProfileQuery])

  const onPressMuteAccount = useCallback(async () => {
    if (profile.viewer?.muted) {
      try {
        await queueUnmute()
        Toast.show(l({message: 'Account unmuted', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          ax.logger.error('Failed to unmute account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    } else {
      try {
        await queueMute()
        Toast.show(l({message: 'Account muted', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          ax.logger.error('Failed to mute account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    }
  }, [ax, profile.viewer?.muted, queueUnmute, l, queueMute])

  const blockAccount = useCallback(async () => {
    if (profile.viewer?.blocking) {
      try {
        await queueUnblock()
        Toast.show(l({message: 'Account unblocked', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          ax.logger.error('Failed to unblock account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    } else {
      try {
        await queueBlock()
        Toast.show(l({message: 'Account blocked', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          ax.logger.error('Failed to block account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    }
  }, [ax, profile.viewer?.blocking, l, queueUnblock, queueBlock])

  const onPressFollowAccount = useCallback(async () => {
    try {
      await queueFollow()
      Toast.show(l({message: 'Account followed', context: 'toast'}))
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        ax.logger.error('Failed to follow account', {message: e})
        Toast.show(l`There was an issue! ${e.toString()}`, {
          type: 'error',
        })
      }
    }
  }, [l, ax, queueFollow])

  const onPressUnfollowAccount = useCallback(async () => {
    try {
      await queueUnfollow()
      Toast.show(l({message: 'Account unfollowed', context: 'toast'}))
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        ax.logger.error('Failed to unfollow account', {message: e})
        Toast.show(l`There was an issue! ${e.toString()}`, {
          type: 'error',
        })
      }
    }
  }, [l, ax, queueUnfollow])

  const onPressReportAccount = useCallback(() => {
    reportDialogControl.open()
  }, [reportDialogControl])

  const onPressShareATUri = useCallback(() => {
    void shareText(`at://${profile.did}`)
  }, [profile.did])

  const onPressShareDID = useCallback(() => {
    void shareText(profile.did)
  }, [profile.did])

  const onPressSearch = useCallback(() => {
    navigation.navigate('ProfileSearch', {name: profile.handle})
  }, [navigation, profile.handle])

  const verificationCreatePromptControl = Prompt.usePromptControl()
  const verificationRemovePromptControl = Prompt.usePromptControl()
  const currentAccountVerifications =
    profile.verification?.verifications?.filter(v => {
      return v.issuer === currentAccount?.did
    }) ?? []

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={l`More options`}>
          {({props}) => {
            return (
              <>
                <Button
                  {...props}
                  testID="profileHeaderDropdownBtn"
                  label={l`More options`}
                  // hitSlop reaches outside parent views on iOS, so the
                  // left inset must stay within half of the 4pt row gap or
                  // it steals taps from the adjacent header button
                  hitSlop={{top: 6, bottom: 6, left: 2, right: 12}}
                  variant="solid"
                  color="secondary"
                  size="small"
                  shape="round">
                  {statusNudgeActive && <Gradient style={[a.rounded_full]} />}
                  <ButtonIcon icon={Ellipsis} size="sm" />
                </Button>
                {statusNudgeActive && <Dot top={1} right={1} />}
              </>
            )
          }}
        </Menu.Trigger>

        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Group>
            <Menu.Item
              testID="profileHeaderDropdownShareBtn"
              label={IS_WEB ? l`Copy link to profile` : l`Share via...`}
              onPress={() => {
                if (showLoggedOutWarning) {
                  loggedOutWarningPromptControl.open()
                } else {
                  onPressShare()
                }
              }}>
              <Menu.ItemText>
                {IS_WEB ? (
                  <Trans>Copy link to profile</Trans>
                ) : (
                  <Trans>Share via...</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon
                icon={IS_WEB ? ChainLinkIcon : ArrowOutOfBoxIcon}
              />
            </Menu.Item>
            <Menu.Item
              testID="profileHeaderDropdownSearchBtn"
              label={l`Search posts`}
              onPress={onPressSearch}>
              <Menu.ItemText>
                <Trans>Search posts</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={SearchIcon} />
            </Menu.Item>
          </Menu.Group>

          {hasSession && (
            <>
              <Menu.Divider />
              <Menu.Group>
                {!isSelf && (
                  <>
                    {(isLabelerAndNotBlocked || isFollowingBlockedAccount) && (
                      <Menu.Item
                        testID="profileHeaderDropdownFollowBtn"
                        label={
                          isFollowing ? l`Unfollow account` : l`Follow account`
                        }
                        onPress={
                          isFollowing
                            ? () => void onPressUnfollowAccount()
                            : () => void onPressFollowAccount()
                        }>
                        <Menu.ItemText>
                          {isFollowing ? (
                            <Trans>Unfollow account</Trans>
                          ) : (
                            <Trans>Follow account</Trans>
                          )}
                        </Menu.ItemText>
                        <Menu.ItemIcon icon={isFollowing ? UserMinus : Plus} />
                      </Menu.Item>
                    )}
                  </>
                )}
                <Menu.Item
                  testID="profileHeaderDropdownStarterPackAddRemoveBtn"
                  label={l`Add to starter packs`}
                  onPress={onPressAddToStarterPacks}>
                  <Menu.ItemText>
                    <Trans>Add to starter packs</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={StarterPack} />
                </Menu.Item>
                <Menu.Item
                  testID="profileHeaderDropdownListAddRemoveBtn"
                  label={l`Add to lists`}
                  onPress={onPressAddRemoveLists}>
                  <Menu.ItemText>
                    <Trans>Add to lists</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={List} />
                </Menu.Item>
                {isSelf && canGoLive && (
                  <Menu.Item
                    testID="profileHeaderDropdownListAddRemoveBtn"
                    label={
                      status.isDisabled
                        ? l`Go live (disabled)`
                        : status.isActive
                          ? l`Edit live status`
                          : l`Go live`
                    }
                    onPress={() => {
                      if (status.isDisabled) {
                        goLiveDisabledDialogControl.open()
                      } else {
                        goLiveDialogControl.open()
                      }
                      saveNux({
                        id: Nux.LiveNowBetaNudge,
                        data: undefined,
                        completed: true,
                      })
                    }}>
                    {statusNudgeActive && <Gradient />}
                    <Menu.ItemText>
                      {status.isDisabled ? (
                        <Trans>Go live (disabled)</Trans>
                      ) : status.isActive ? (
                        <Trans>Edit live status</Trans>
                      ) : (
                        <Trans>Go live</Trans>
                      )}
                    </Menu.ItemText>
                    {statusNudgeActive && (
                      <Menu.ItemText
                        style={[
                          a.flex_0,
                          {
                            color: t.palette.primary_500,
                            right: IS_WEB ? -8 : -4,
                          },
                        ]}>
                        <Trans>New</Trans>
                      </Menu.ItemText>
                    )}
                    <Menu.ItemIcon
                      icon={LiveIcon}
                      fill={
                        statusNudgeActive
                          ? () => t.palette.primary_500
                          : undefined
                      }
                    />
                  </Menu.Item>
                )}
                {verification.viewer.role === 'verifier' &&
                  !verification.profile.isViewer &&
                  (verification.viewer.hasIssuedVerification ? (
                    <Menu.Item
                      testID="profileHeaderDropdownVerificationRemoveButton"
                      label={l`Remove verification`}
                      onPress={() => verificationRemovePromptControl.open()}>
                      <Menu.ItemText>
                        <Trans>Remove verification</Trans>
                      </Menu.ItemText>
                      <Menu.ItemIcon icon={CircleXIcon} />
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      testID="profileHeaderDropdownVerificationCreateButton"
                      label={l`Verify account`}
                      onPress={() => verificationCreatePromptControl.open()}>
                      <Menu.ItemText>
                        <Trans>Verify account</Trans>
                      </Menu.ItemText>
                      <Menu.ItemIcon icon={CircleCheckIcon} />
                    </Menu.Item>
                  ))}
                {!isSelf && (
                  <>
                    {!profile.viewer?.blocking &&
                      !profile.viewer?.mutedByList && (
                        <Menu.Item
                          testID="profileHeaderDropdownMuteBtn"
                          label={
                            profile.viewer?.muted
                              ? l`Unmute account`
                              : l`Mute account`
                          }
                          onPress={() => void onPressMuteAccount()}>
                          <Menu.ItemText>
                            {profile.viewer?.muted ? (
                              <Trans>Unmute account</Trans>
                            ) : (
                              <Trans>Mute account</Trans>
                            )}
                          </Menu.ItemText>
                          <Menu.ItemIcon
                            icon={profile.viewer?.muted ? Unmute : Mute}
                          />
                        </Menu.Item>
                      )}
                    {!profile.viewer?.blockingByList && (
                      <Menu.Item
                        testID="profileHeaderDropdownBlockBtn"
                        label={
                          profile.viewer?.blocking
                            ? l`Unblock account`
                            : l`Block account`
                        }
                        onPress={() => blockPromptControl.open()}>
                        <Menu.ItemText>
                          {profile.viewer?.blocking ? (
                            <Trans>Unblock account</Trans>
                          ) : (
                            <Trans>Block account</Trans>
                          )}
                        </Menu.ItemText>
                        <Menu.ItemIcon
                          icon={
                            profile.viewer?.blocking ? PersonCheck : PersonX
                          }
                        />
                      </Menu.Item>
                    )}
                    <Menu.Item
                      testID="profileHeaderDropdownReportBtn"
                      label={l`Report account`}
                      onPress={onPressReportAccount}>
                      <Menu.ItemText>
                        <Trans>Report account</Trans>
                      </Menu.ItemText>
                      <Menu.ItemIcon icon={Flag} />
                    </Menu.Item>
                  </>
                )}
              </Menu.Group>
            </>
          )}
          {devModeEnabled ? (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  testID="profileHeaderDropdownShareATURIBtn"
                  label={l`Copy at:// URI`}
                  onPress={onPressShareATUri}>
                  <Menu.ItemText>
                    <Trans>Copy at:// URI</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={ClipboardIcon} />
                </Menu.Item>
                <Menu.Item
                  testID="profileHeaderDropdownShareDIDBtn"
                  label={l`Copy DID`}
                  onPress={onPressShareDID}>
                  <Menu.ItemText>
                    <Trans>Copy DID</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={ClipboardIcon} />
                </Menu.Item>
              </Menu.Group>
            </>
          ) : null}
        </Menu.Outer>
      </Menu.Root>
      <StarterPackDialog
        control={addToStarterPacksDialogControl}
        targetDid={profile.did}
      />
      <ReportDialog
        control={reportDialogControl}
        subject={{
          ...profile,
          $type: 'app.bsky.actor.defs#profileViewDetailed',
        }}
      />
      <BlockDialog
        control={blockPromptControl}
        profile={profile}
        onBlock={blockAccount}
      />
      <Prompt.Basic
        control={loggedOutWarningPromptControl}
        title={l`Note about sharing`}
        description={l`This profile is only visible to logged-in users. It won't be visible to people who aren't signed in.`}
        onConfirm={onPressShare}
        confirmButtonCta={l`Share anyway`}
      />
      <VerificationCreatePrompt
        control={verificationCreatePromptControl}
        profile={profile}
      />
      <VerificationRemovePrompt
        control={verificationRemovePromptControl}
        profile={profile}
        verifications={currentAccountVerifications}
      />
      {status.isDisabled ? (
        <GoLiveDisabledDialog
          control={goLiveDisabledDialogControl}
          status={status}
        />
      ) : status.isActive ? (
        <EditLiveDialog
          control={goLiveDialogControl}
          status={status}
          embed={status.embed}
        />
      ) : (
        <GoLiveDialog control={goLiveDialogControl} profile={profile} />
      )}
    </EventStopper>
  )
}

ProfileMenu = memo(ProfileMenu)
export {ProfileMenu}
