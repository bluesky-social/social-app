import React from 'react'
import {StyleSheet} from 'react-native'
import {useAnalytics} from 'lib/analytics/analytics'
import {useStores} from 'state/index'
import * as Toast from '../util/Toast'
import {ProfileModel} from 'state/models/content/profile'
import {shareUrl} from 'lib/sharing'
import {DropdownButton, DropdownItem} from '../util/forms/DropdownButton'
import {toShareUrl} from 'lib/strings/url-helpers'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'

type Props = {
  view: ProfileModel
  onRefreshAll: () => void
}
export const ProfileHeaderDropdown = ({view, onRefreshAll}: Props) => {
  const store = useStores()
  const {track} = useAnalytics()
  const pal = usePalette('default')

  const onPressShare = React.useCallback(() => {
    track('ProfileHeader:ShareButtonClicked')
    const url = toShareUrl(`/profile/${view.handle}`)
    shareUrl(url)
  }, [track, view])

  const onPressAddRemoveLists = React.useCallback(() => {
    track('ProfileHeader:AddToListsButtonClicked')
    store.shell.openModal({
      name: 'list-add-remove-user',
      subject: view.did,
      displayName: view.displayName || view.handle,
    })
  }, [track, view, store])

  const onPressMuteAccount = React.useCallback(async () => {
    track('ProfileHeader:MuteAccountButtonClicked')
    try {
      await view.muteAccount()
      Toast.show('Account muted')
      onRefreshAll()
    } catch (e: any) {
      store.log.error('Failed to mute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, view, store, onRefreshAll])

  const onPressUnmuteAccount = React.useCallback(async () => {
    track('ProfileHeader:UnmuteAccountButtonClicked')
    try {
      await view.unmuteAccount()
      Toast.show('Account unmuted')
      onRefreshAll()
    } catch (e: any) {
      store.log.error('Failed to unmute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, view, store, onRefreshAll])

  const onPressBlockAccount = React.useCallback(async () => {
    track('ProfileHeader:BlockAccountButtonClicked')
    store.shell.openModal({
      name: 'confirm',
      title: 'Block Account',
      message:
        'Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.',
      onPressConfirm: async () => {
        try {
          await view.blockAccount()
          onRefreshAll()
          Toast.show('Account blocked')
        } catch (e: any) {
          store.log.error('Failed to block account', e)
          Toast.show(`There was an issue! ${e.toString()}`)
        }
      },
    })
  }, [track, view, store, onRefreshAll])

  const onPressUnblockAccount = React.useCallback(async () => {
    track('ProfileHeader:UnblockAccountButtonClicked')
    store.shell.openModal({
      name: 'confirm',
      title: 'Unblock Account',
      message:
        'The account will be able to interact with you after unblocking.',
      onPressConfirm: async () => {
        try {
          await view.unblockAccount()
          onRefreshAll()
          Toast.show('Account unblocked')
        } catch (e: any) {
          store.log.error('Failed to unblock account', e)
          Toast.show(`There was an issue! ${e.toString()}`)
        }
      },
    })
  }, [track, view, store, onRefreshAll])

  const onPressReportAccount = React.useCallback(() => {
    track('ProfileHeader:ReportAccountButtonClicked')
    store.shell.openModal({
      name: 'report-account',
      did: view.did,
    })
  }, [track, store, view])
  const isMe = React.useMemo(
    () => store.me.did === view.did,
    [store.me.did, view.did],
  )
  const dropdownItems: DropdownItem[] = React.useMemo(() => {
    let items: DropdownItem[] = [
      {
        testID: 'profileHeaderDropdownShareBtn',
        label: 'Share',
        onPress: onPressShare,
      },
      {
        testID: 'profileHeaderDropdownListAddRemoveBtn',
        label: 'Add to Lists',
        onPress: onPressAddRemoveLists,
      },
    ]
    if (!isMe) {
      items.push({sep: true})
      if (!view.viewer.blocking) {
        items.push({
          testID: 'profileHeaderDropdownMuteBtn',
          label: view.viewer.muted ? 'Unmute Account' : 'Mute Account',
          onPress: view.viewer.muted
            ? onPressUnmuteAccount
            : onPressMuteAccount,
        })
      }
      items.push({
        testID: 'profileHeaderDropdownBlockBtn',
        label: view.viewer.blocking ? 'Unblock Account' : 'Block Account',
        onPress: view.viewer.blocking
          ? onPressUnblockAccount
          : onPressBlockAccount,
      })
      items.push({
        testID: 'profileHeaderDropdownReportBtn',
        label: 'Report Account',
        onPress: onPressReportAccount,
      })
    }
    return items
  }, [
    isMe,
    view.viewer.muted,
    view.viewer.blocking,
    onPressShare,
    onPressUnmuteAccount,
    onPressMuteAccount,
    onPressUnblockAccount,
    onPressBlockAccount,
    onPressReportAccount,
    onPressAddRemoveLists,
  ])

  if (dropdownItems.length > 0) {
    return (
      <DropdownButton
        testID="profileHeaderDropdownBtn"
        type="bare"
        items={dropdownItems}
        style={[styles.btn, styles.secondaryBtn, pal.btn]}>
        <FontAwesomeIcon icon="ellipsis" style={[pal.text]} />
      </DropdownButton>
    )
  }
  return null
}

export const ProfileHeaderDropdownObserver = observer(ProfileHeaderDropdown)

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
  },
})
