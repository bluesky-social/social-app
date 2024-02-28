import React from 'react'
import {View} from 'react-native'
import {useQueryClient} from '@tanstack/react-query'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from 'platform/detection'
import {useModalControls} from '#/state/modals'
import {
  RQKEY as profileQueryKey,
  useProfileMuteMutationQueue,
  useProfileBlockMutationQueue,
} from '#/state/queries/profile'
import {useAnalytics} from 'lib/analytics/analytics'
import {makeProfileLink} from 'lib/routes/links'
import {toShareUrl} from 'lib/strings/url-helpers'
import {shareUrl} from 'lib/sharing'
import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {Shadow} from '#/state/cache/types'
import {NEW_REPORT_DIALOG_ENABLED} from '#/lib/build-flags'

import {atoms as a, useTheme, tokens} from '#/alf'
import * as Toast from 'view/com/util/Toast'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {ReportDialog, useReportDialogControl} from '#/components/ReportDialog'
import {DotGrid1x3Horizontal_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'

export function ProfileHeaderDropdownBtn({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}) {
  const t = useTheme()
  const {currentAccount, hasSession} = useSession()
  const {_} = useLingui()
  const {openModal} = useModalControls()
  const {track} = useAnalytics()
  const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile)
  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const queryClient = useQueryClient()
  const control = useReportDialogControl()

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
  }, [track, queueMute, _])

  const onPressUnmuteAccount = React.useCallback(async () => {
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
  }, [track, queueUnmute, _])

  const onPressBlockAccount = React.useCallback(async () => {
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
  }, [track, queueBlock, openModal, _])

  const onPressUnblockAccount = React.useCallback(async () => {
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
  }, [track, queueUnblock, openModal, _])

  const onPressReportAccount = React.useCallback(() => {
    track('ProfileHeader:ReportAccountButtonClicked')
    if (NEW_REPORT_DIALOG_ENABLED) {
      control.open()
    } else {
      openModal({
        name: 'report',
        did: profile.did,
      })
    }
  }, [track, openModal, profile, control])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )
  const dropdownItems: DropdownItem[] = React.useMemo(() => {
    let items: DropdownItem[] = []

    if (hasSession && profile.associated?.modservice) {
      items.push({
        testID: 'profileHeaderDropdownFollowBtn',
        label: _(msg`Follow Account`),
        onPress: () => {}, // TODO
        icon: {
          ios: {
            name: 'plus',
          },
          android: '',
          web: 'plus',
        },
      })
    }
    items.push({
      testID: 'profileHeaderDropdownShareBtn',
      label: isWeb ? _(msg`Copy Link to Profile`) : _(msg`Share`),
      onPress: onPressShare,
      icon: {
        ios: {
          name: 'square.and.arrow.up',
        },
        android: 'ic_menu_share',
        web: 'share',
      },
    })
    if (hasSession) {
      items.push({label: 'separator'})
      items.push({
        testID: 'profileHeaderDropdownListAddRemoveBtn',
        label: _(msg`Add to Lists`),
        onPress: onPressAddRemoveLists,
        icon: {
          ios: {
            name: 'list.bullet',
          },
          android: 'ic_menu_add',
          web: 'list',
        },
      })
      if (!isMe) {
        if (!profile.viewer?.blocking) {
          if (!profile.viewer?.mutedByList) {
            items.push({
              testID: 'profileHeaderDropdownMuteBtn',
              label: profile.viewer?.muted
                ? _(msg`Unmute Account`)
                : _(msg`Mute Account`),
              onPress: profile.viewer?.muted
                ? onPressUnmuteAccount
                : onPressMuteAccount,
              icon: {
                ios: {
                  name: 'speaker.slash',
                },
                android: 'ic_lock_silent_mode',
                web: 'comment-slash',
              },
            })
          }
        }
        if (!profile.viewer?.blockingByList) {
          items.push({
            testID: 'profileHeaderDropdownBlockBtn',
            label: profile.viewer?.blocking
              ? _(msg`Unblock Account`)
              : _(msg`Block Account`),
            onPress: profile.viewer?.blocking
              ? onPressUnblockAccount
              : onPressBlockAccount,
            icon: {
              ios: {
                name: 'person.fill.xmark',
              },
              android: 'ic_menu_close_clear_cancel',
              web: 'user-slash',
            },
          })
        }
      }
      items.push({
        testID: 'profileHeaderDropdownReportBtn',
        label: _(msg`Report Account`),
        onPress: onPressReportAccount,
        icon: {
          ios: {
            name: 'exclamationmark.triangle',
          },
          android: 'ic_menu_report_image',
          web: 'circle-exclamation',
        },
      })
    }
    return items
  }, [
    isMe,
    hasSession,
    profile.associated?.modservice,
    profile.viewer?.muted,
    profile.viewer?.mutedByList,
    profile.viewer?.blocking,
    profile.viewer?.blockingByList,
    onPressShare,
    onPressUnmuteAccount,
    onPressMuteAccount,
    onPressUnblockAccount,
    onPressBlockAccount,
    onPressReportAccount,
    onPressAddRemoveLists,
    _,
  ])

  return dropdownItems?.length ? (
    <>
      <ReportDialog
        control={control}
        params={{type: 'profile', did: profile.did}}
      />

      <NativeDropdown
        testID="profileHeaderDropdownBtn"
        items={dropdownItems}
        accessibilityLabel={_(msg`More options`)}
        accessibilityHint="">
        <View
          style={[
            {
              height: 40,
              width: 40,
              backgroundColor:
                t.name === 'light'
                  ? tokens.color.gray_50
                  : tokens.color.gray_900,
            },
            a.flex_row,
            a.align_center,
            a.justify_center,
            a.rounded_full,
          ]}>
          <Ellipsis width={20} fill={t.atoms.text_contrast_medium.color} />
        </View>
      </NativeDropdown>
    </>
  ) : null
}
