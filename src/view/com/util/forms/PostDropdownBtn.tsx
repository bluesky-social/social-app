import React from 'react'
import {toShareUrl} from 'lib/strings/url-helpers'
import {useStores} from 'state/index'
import {shareUrl} from 'lib/sharing'
import {
  NativeDropdown,
  DropdownItem as NativeDropdownItem,
} from './NativeDropdown'

export function PostDropdownBtn({
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
      testId: 'postDropdownTranslateBtn',
      icon: {
        ios: {
          name: 'character.book.closed',
        },
        android: 'translate',
        web: 'language',
      },
    },
    {
      label: 'Copy post text',
      onPress() {
        onCopyPostText()
      },
      testId: 'postDropdownCopyTextBtn',
      icon: {
        ios: {
          name: 'doc.on.doc',
        },
        android: 'content-copy',
        web: ['far', 'paste'],
      },
    },
    {
      label: 'Share',
      onPress() {
        const url = toShareUrl(itemHref)
        shareUrl(url)
      },
      testId: 'postDropdownShareBtn',
      icon: {
        ios: {
          name: 'square.and.arrow.up',
        },
        android: 'share',
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
      testId: 'postDropdownMuteThreadBtn',
      icon: {
        ios: {
          name: 'speaker.slash',
        },
        android: 'comment-slash',
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
      testId: 'postDropdownReportBtn',
      icon: {
        ios: {
          name: 'exclamationmark.triangle',
        },
        android: 'circle-exclamation',
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
      testId: 'postDropdownDeleteBtn',
      icon: {
        ios: {
          name: 'trash',
        },
        android: 'trash-can',
        web: ['far', 'trash-can'],
      },
    },
  ].filter(Boolean) as NativeDropdownItem[]

  return <NativeDropdown items={dropdownItems} />
}
