import React, {memo} from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_20} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {Shadow} from '#/state/cache/types'
import {useModalControls} from '#/state/modals'
import {useDevModeEnabled} from '#/state/preferences/dev-mode'
import {
  RQKEY as profileQueryKey,
  useProfileBlockMutationQueue,
  useProfileFollowMutationQueue,
  useProfileMuteMutationQueue,
} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import * as Toast from '#/view/com/util/Toast'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {DotGrid_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {ListSparkle_Stroke2_Corner0_Rounded as List} from '#/components/icons/ListSparkle'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass2'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {PeopleRemove2_Stroke2_Corner0_Rounded as UserMinus} from '#/components/icons/PeopleRemove2'
import {
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
  PersonX_Stroke2_Corner0_Rounded as PersonX,
} from '#/components/icons/Person'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {ReportDialog, useReportDialogControl} from '#/components/ReportDialog'

let ProfileMenu = ({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}): React.ReactNode => {
  const {_} = useLingui()
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
  const [devModeEnabled] = useDevModeEnabled()

  const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile)
  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ProfileMenu',
  )

  const blockPromptControl = Prompt.usePromptControl()
  const loggedOutWarningPromptControl = Prompt.usePromptControl()

  const showLoggedOutWarning = React.useMemo(() => {
    return (
      profile.did !== currentAccount?.did &&
      !!profile.labels?.find(label => label.val === '!no-unauthenticated')
    )
  }, [currentAccount, profile])

  const invalidateProfileQuery = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: profileQueryKey(profile.did),
    })
  }, [queryClient, profile.did])

  const onPressShare = React.useCallback(() => {
    shareUrl(toShareUrl(makeProfileLink(profile)))
  }, [profile])

  const onPressAddRemoveLists = React.useCallback(() => {
    openModal({
      name: 'user-add-remove-lists',
      subject: profile.did,
      handle: profile.handle,
      displayName: profile.displayName || profile.handle,
      onAdd: invalidateProfileQuery,
      onRemove: invalidateProfileQuery,
    })
  }, [profile, openModal, invalidateProfileQuery])

  const onPressMuteAccount = React.useCallback(async () => {
    if (profile.viewer?.muted) {
      try {
        await queueUnmute()
        Toast.show(_(msg`Account unmuted`))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unmute account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    } else {
      try {
        await queueMute()
        Toast.show(_(msg`Account muted`))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to mute account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    }
  }, [profile.viewer?.muted, queueUnmute, _, queueMute])

  const blockAccount = React.useCallback(async () => {
    if (profile.viewer?.blocking) {
      try {
        await queueUnblock()
        Toast.show(_(msg`Account unblocked`))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unblock account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    } else {
      try {
        await queueBlock()
        Toast.show(_(msg`Account blocked`))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to block account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    }
  }, [profile.viewer?.blocking, _, queueUnblock, queueBlock])

  const onPressFollowAccount = React.useCallback(async () => {
    try {
      await queueFollow()
      Toast.show(_(msg`Account followed`))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to follow account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
      }
    }
  }, [_, queueFollow])

  const onPressUnfollowAccount = React.useCallback(async () => {
    try {
      await queueUnfollow()
      Toast.show(_(msg`Account unfollowed`))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to unfollow account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
      }
    }
  }, [_, queueUnfollow])

  const onPressReportAccount = React.useCallback(() => {
    reportDialogControl.open()
  }, [reportDialogControl])

  const onPressShareATUri = React.useCallback(() => {
    shareText(`at://${profile.did}`)
  }, [profile.did])

  const onPressShareDID = React.useCallback(() => {
    shareText(profile.did)
  }, [profile.did])

  const onPressSearch = React.useCallback(() => {
    navigation.navigate('ProfileSearch', {name: profile.handle})
  }, [navigation, profile.handle])

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(`More options`)}>
          {({props}) => {
            return (
              <Button
                {...props}
                testID="profileHeaderDropdownBtn"
                label={_(msg`More options`)}
                hitSlop={HITSLOP_20}
                variant="solid"
                color="secondary"
                size="small"
                shape="round">
                <ButtonIcon icon={Ellipsis} size="sm" />
              </Button>
            )
          }}
        </Menu.Trigger>

        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Group>
            <Menu.Item
              testID="profileHeaderDropdownShareBtn"
              label={_(msg`Share`)}
              onPress={() => {
                if (showLoggedOutWarning) {
                  loggedOutWarningPromptControl.open()
                } else {
                  onPressShare()
                }
              }}>
              <Menu.ItemText>
                <Trans>Share</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Share} />
            </Menu.Item>
            <Menu.Item
              testID="profileHeaderDropdownSearchBtn"
              label={_(msg`Search Posts`)}
              onPress={onPressSearch}>
              <Menu.ItemText>
                <Trans>Search Posts</Trans>
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
                          isFollowing
                            ? _(msg`Unfollow Account`)
                            : _(msg`Follow Account`)
                        }
                        onPress={
                          isFollowing
                            ? onPressUnfollowAccount
                            : onPressFollowAccount
                        }>
                        <Menu.ItemText>
                          {isFollowing ? (
                            <Trans>Unfollow Account</Trans>
                          ) : (
                            <Trans>Follow Account</Trans>
                          )}
                        </Menu.ItemText>
                        <Menu.ItemIcon icon={isFollowing ? UserMinus : Plus} />
                      </Menu.Item>
                    )}
                  </>
                )}
                <Menu.Item
                  testID="profileHeaderDropdownListAddRemoveBtn"
                  label={_(msg`Add to Lists`)}
                  onPress={onPressAddRemoveLists}>
                  <Menu.ItemText>
                    <Trans>Add to Lists</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={List} />
                </Menu.Item>
                {!isSelf && (
                  <>
                    {!profile.viewer?.blocking &&
                      !profile.viewer?.mutedByList && (
                        <Menu.Item
                          testID="profileHeaderDropdownMuteBtn"
                          label={
                            profile.viewer?.muted
                              ? _(msg`Unmute Account`)
                              : _(msg`Mute Account`)
                          }
                          onPress={onPressMuteAccount}>
                          <Menu.ItemText>
                            {profile.viewer?.muted ? (
                              <Trans>Unmute Account</Trans>
                            ) : (
                              <Trans>Mute Account</Trans>
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
                          profile.viewer
                            ? _(msg`Unblock Account`)
                            : _(msg`Block Account`)
                        }
                        onPress={() => blockPromptControl.open()}>
                        <Menu.ItemText>
                          {profile.viewer?.blocking ? (
                            <Trans>Unblock Account</Trans>
                          ) : (
                            <Trans>Block Account</Trans>
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
                      label={_(msg`Report Account`)}
                      onPress={onPressReportAccount}>
                      <Menu.ItemText>
                        <Trans>Report Account</Trans>
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
                  label={_(msg`Copy at:// URI`)}
                  onPress={onPressShareATUri}>
                  <Menu.ItemText>
                    <Trans>Copy at:// URI</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={Share} />
                </Menu.Item>
                <Menu.Item
                  testID="profileHeaderDropdownShareDIDBtn"
                  label={_(msg`Copy DID`)}
                  onPress={onPressShareDID}>
                  <Menu.ItemText>
                    <Trans>Copy DID</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={Share} />
                </Menu.Item>
              </Menu.Group>
            </>
          ) : null}
        </Menu.Outer>
      </Menu.Root>

      <ReportDialog
        control={reportDialogControl}
        params={{type: 'account', did: profile.did}}
      />

      <Prompt.Basic
        control={blockPromptControl}
        title={
          profile.viewer?.blocking
            ? _(msg`Unblock Account?`)
            : _(msg`Block Account?`)
        }
        description={
          profile.viewer?.blocking
            ? _(
                msg`The account will be able to interact with you after unblocking.`,
              )
            : profile.associated?.labeler
            ? _(
                msg`Blocking will not prevent labels from being applied on your account, but it will stop this account from replying in your threads or interacting with you.`,
              )
            : _(
                msg`Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`,
              )
        }
        onConfirm={blockAccount}
        confirmButtonCta={
          profile.viewer?.blocking ? _(msg`Unblock`) : _(msg`Block`)
        }
        confirmButtonColor={profile.viewer?.blocking ? undefined : 'negative'}
      />

      <Prompt.Basic
        control={loggedOutWarningPromptControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This profile is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
        )}
        onConfirm={onPressShare}
        confirmButtonCta={_(msg`Share anyway`)}
      />
    </EventStopper>
  )
}

ProfileMenu = memo(ProfileMenu)
export {ProfileMenu}
