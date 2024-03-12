import React, {memo} from 'react'
import {TouchableOpacity} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useQueryClient} from '@tanstack/react-query'
import * as Toast from 'view/com/util/Toast'
import {EventStopper} from 'view/com/util/EventStopper'
import {useSession} from 'state/session'
import * as Menu from '#/components/Menu'
import {useTheme} from '#/alf'
import {usePalette} from 'lib/hooks/usePalette'
import {HITSLOP_10} from 'lib/constants'
import {shareUrl} from 'lib/sharing'
import {toShareUrl} from 'lib/strings/url-helpers'
import {makeProfileLink} from 'lib/routes/links'
import {useAnalytics} from 'lib/analytics/analytics'
import {useModalControls} from 'state/modals'
import {
  RQKEY as profileQueryKey,
  useProfileBlockMutationQueue,
  useProfileFollowMutationQueue,
  useProfileMuteMutationQueue,
} from 'state/queries/profile'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {ListSparkle_Stroke2_Corner0_Rounded as List} from '#/components/icons/ListSparkle'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {PersonCheck_Stroke2_Corner0_Rounded as PersonCheck} from '#/components/icons/PersonCheck'
import {PersonX_Stroke2_Corner0_Rounded as PersonX} from '#/components/icons/PersonX'
import {PeopleRemove2_Stroke2_Corner0_Rounded as UserMinus} from '#/components/icons/PeopleRemove2'
import {logger} from '#/logger'
import {Shadow} from 'state/cache/types'

let ProfileMenu = ({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}): React.ReactNode => {
  const {_} = useLingui()
  const {currentAccount, hasSession} = useSession()
  const t = useTheme()
  // TODO ALF this
  const pal = usePalette('default')
  const {track} = useAnalytics()
  const {openModal} = useModalControls()
  const queryClient = useQueryClient()
  const isSelf = currentAccount?.did === profile.did

  const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile)
  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const [, queueUnfollow] = useProfileFollowMutationQueue(profile)

  const invalidateProfileQuery = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: profileQueryKey(profile.did),
    })
  }, [queryClient, profile.did])

  const onPressShare = React.useCallback(() => {
    track('ProfileHeader:ShareButtonClicked')
    shareUrl(toShareUrl(makeProfileLink(profile)))
  }, [track, profile])

  const onPressAddRemoveLists = React.useCallback(() => {
    track('ProfileHeader:AddToListsButtonClicked')
    openModal({
      name: 'user-add-remove-lists',
      subject: profile.did,
      handle: profile.handle,
      displayName: profile.displayName || profile.handle,
      onAdd: invalidateProfileQuery,
      onRemove: invalidateProfileQuery,
    })
  }, [track, profile, openModal, invalidateProfileQuery])

  const onPressMuteAccount = React.useCallback(async () => {
    if (profile.viewer?.muted) {
      track('ProfileHeader:UnmuteAccountButtonClicked')
      try {
        await queueUnmute()
        Toast.show(_(msg`Account unmuted`))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unmute account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`))
        }
      }
    } else {
      track('ProfileHeader:MuteAccountButtonClicked')
      try {
        await queueMute()
        Toast.show(_(msg`Account muted`))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to mute account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`))
        }
      }
    }
  }, [profile.viewer?.muted, track, queueUnmute, _, queueMute])

  const onPressBlockAccount = React.useCallback(async () => {
    if (profile.viewer?.blocking) {
      track('ProfileHeader:UnblockAccountButtonClicked')
      openModal({
        name: 'confirm',
        title: _(msg`Unblock Account`),
        message: _(
          msg`The account will be able to interact with you after unblocking.`,
        ),
        onPressConfirm: async () => {
          try {
            await queueUnblock()
            Toast.show(_(msg`Account unblocked`))
          } catch (e: any) {
            if (e?.name !== 'AbortError') {
              logger.error('Failed to unblock account', {message: e})
              Toast.show(_(msg`There was an issue! ${e.toString()}`))
            }
          }
        },
      })
    } else {
      track('ProfileHeader:BlockAccountButtonClicked')
      openModal({
        name: 'confirm',
        title: _(msg`Block Account`),
        message: _(
          msg`Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`,
        ),
        onPressConfirm: async () => {
          try {
            await queueBlock()
            Toast.show(_(msg`Account blocked`))
          } catch (e: any) {
            if (e?.name !== 'AbortError') {
              logger.error('Failed to block account', {message: e})
              Toast.show(_(msg`There was an issue! ${e.toString()}`))
            }
          }
        },
      })
    }
  }, [profile.viewer?.blocking, track, openModal, _, queueUnblock, queueBlock])

  const onPressUnfollowAccount = React.useCallback(async () => {
    track('ProfileHeader:UnfollowButtonClicked')
    try {
      await queueUnfollow()
      Toast.show(_(msg`Account unfollowed`))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to unfollow account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`))
      }
    }
  }, [_, queueUnfollow, track])

  const onPressReportAccount = React.useCallback(() => {
    track('ProfileHeader:ReportAccountButtonClicked')
    openModal({
      name: 'report',
      did: profile.did,
    })
  }, [track, openModal, profile])

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(`More options`)}>
          {({props}) => {
            return (
              <TouchableOpacity
                {...props}
                hitSlop={HITSLOP_10}
                testID="profileHeaderDropdownBtn"
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 7,
                    borderRadius: 50,
                    marginLeft: 6,
                    paddingHorizontal: 14,
                  },
                  pal.btn,
                ]}>
                <FontAwesomeIcon
                  icon="ellipsis"
                  size={20}
                  style={t.atoms.text}
                />
              </TouchableOpacity>
            )
          }}
        </Menu.Trigger>

        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Group>
            <Menu.Item
              testID="profileHeaderDropdownShareBtn"
              label={_(msg`Share`)}
              onPress={onPressShare}>
              <Menu.ItemText>
                <Trans>Share</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Share} />
            </Menu.Item>
          </Menu.Group>
          {hasSession && (
            <>
              <Menu.Divider />
              <Menu.Group>
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
                    {profile.viewer?.following &&
                      (profile.viewer.blocking || profile.viewer.blockedBy) && (
                        <Menu.Item
                          testID="profileHeaderDropdownUnfollowBtn"
                          label={_(msg`Unfollow Account`)}
                          onPress={onPressUnfollowAccount}>
                          <Menu.ItemText>
                            <Trans>Unfollow Account</Trans>
                          </Menu.ItemText>
                          <Menu.ItemIcon icon={UserMinus} />
                        </Menu.Item>
                      )}
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
                        onPress={onPressBlockAccount}>
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
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  )
}

ProfileMenu = memo(ProfileMenu)
export {ProfileMenu}
