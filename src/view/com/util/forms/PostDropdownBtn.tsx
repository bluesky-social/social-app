import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {toShareUrl} from 'lib/strings/url-helpers'
import {useTheme} from 'lib/ThemeContext'
import {shareUrl} from 'lib/sharing'
import {
  NativeDropdown,
  DropdownItem as NativeDropdownItem,
} from './NativeDropdown'
import {EventStopper} from '../EventStopper'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useModalControls} from '#/state/modals'

export function PostDropdownBtn({
  testID,
  itemUri,
  itemCid,
  itemHref,
  isAuthor,
  isThreadMuted,
  onCopyPostText,
  onOpenTranslate,
  onToggleThreadMute,
  onDeletePost,
  style,
}: {
  testID: string
  itemUri: string
  itemCid: string
  itemHref: string
  itemTitle: string
  isAuthor: boolean
  isThreadMuted: boolean
  onCopyPostText: () => void
  onOpenTranslate: () => void
  onToggleThreadMute: () => void
  onDeletePost: () => void
  style?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  const {_} = useLingui()
  const defaultCtrlColor = theme.palette.default.postCtrl
  const {openModal} = useModalControls()

  const dropdownItems: NativeDropdownItem[] = [
    {
      label: 'Translate',
      onPress() {
        onOpenTranslate()
      },
      testID: 'postDropdownTranslateBtn',
      icon: {
        ios: {
          name: 'character.book.closed',
        },
        android: 'ic_menu_sort_alphabetically',
        web: 'language',
      },
    },
    {
      label: 'Copy post text',
      onPress() {
        onCopyPostText()
      },
      testID: 'postDropdownCopyTextBtn',
      icon: {
        ios: {
          name: 'doc.on.doc',
        },
        android: 'ic_menu_edit',
        web: ['far', 'paste'],
      },
    },
    {
      label: 'Share',
      onPress() {
        const url = toShareUrl(itemHref)
        shareUrl(url)
      },
      testID: 'postDropdownShareBtn',
      icon: {
        ios: {
          name: 'square.and.arrow.up',
        },
        android: 'ic_menu_share',
        web: 'share',
      },
    },
    {
      label: 'separator',
    },
    {
      label: isThreadMuted ? 'Unmute thread' : 'Mute thread',
      onPress() {
        onToggleThreadMute()
      },
      testID: 'postDropdownMuteThreadBtn',
      icon: {
        ios: {
          name: 'speaker.slash',
        },
        android: 'ic_lock_silent_mode',
        web: 'comment-slash',
      },
    },
    {
      label: 'separator',
    },
    !isAuthor && {
      label: 'Report post',
      onPress() {
        openModal({
          name: 'report',
          uri: itemUri,
          cid: itemCid,
        })
      },
      testID: 'postDropdownReportBtn',
      icon: {
        ios: {
          name: 'exclamationmark.triangle',
        },
        android: 'ic_menu_report_image',
        web: 'circle-exclamation',
      },
    },
    isAuthor && {
      label: 'separator',
    },
    isAuthor && {
      label: 'Delete post',
      onPress() {
        openModal({
          name: 'confirm',
          title: 'Delete this post?',
          message: 'Are you sure? This can not be undone.',
          onPressConfirm: onDeletePost,
        })
      },
      testID: 'postDropdownDeleteBtn',
      icon: {
        ios: {
          name: 'trash',
        },
        android: 'ic_menu_delete',
        web: ['far', 'trash-can'],
      },
    },
  ].filter(Boolean) as NativeDropdownItem[]

  return (
    <EventStopper>
      <NativeDropdown
        testID={testID}
        items={dropdownItems}
        accessibilityLabel={_(msg`More post options`)}
        accessibilityHint="">
        <View style={style}>
          <FontAwesomeIcon icon="ellipsis" size={20} color={defaultCtrlColor} />
        </View>
      </NativeDropdown>
    </EventStopper>
  )
}
