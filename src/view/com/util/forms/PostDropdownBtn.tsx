import React from 'react'
import {toShareUrl} from 'lib/strings/url-helpers'
import {useStores} from 'state/index'
import {shareUrl} from 'lib/sharing'
import {
  NativeDropdown,
  DropdownItem as NativeDropdownItem,
} from './NativeDropdown'
import {Pressable} from 'react-native'

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
}) {
  const store = useStores()

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
    {
      label: 'Report post',
      onPress() {
        store.shell.openModal({
          name: 'report-post',
          postUri: itemUri,
          postCid: itemCid,
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
        store.shell.openModal({
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
    <Pressable testID={testID} accessibilityRole="button">
      <NativeDropdown items={dropdownItems} />
    </Pressable>
  )
}
