import React from 'react'
import {Share, StyleProp, ViewStyle} from 'react-native'
import {toShareUrl} from '../../../../lib/strings'
import {useStores} from '../../../../state'
import {ConfirmModel} from '../../../../state/models/shell-ui'
import {TABS_ENABLED} from '../../../../build-flags'
import DropdownBtn, {DropdownItem} from './DropdownBtn'

export default function PostDropdownBtn({
  style,
  children,
  itemHref,
  itemTitle,
  isAuthor,
  onCopyPostText,
  onDeletePost,
}: {
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  itemHref: string
  itemTitle: string
  isAuthor: boolean
  onCopyPostText: () => void
  onDeletePost: () => void
}) {
  const store = useStores()

  const dropdownItems: DropdownItem[] = [
    TABS_ENABLED
      ? {
          icon: ['far', 'clone'],
          label: 'Open in new tab',
          onPress() {
            store.nav.newTab(itemHref)
          },
        }
      : undefined,
    {
      icon: ['far', 'paste'],
      label: 'Copy post text',
      onPress() {
        onCopyPostText()
      },
    },
    {
      icon: 'share',
      label: 'Share...',
      onPress() {
        Share.share({url: toShareUrl(itemHref)})
      },
    },
    isAuthor
      ? {
          icon: ['far', 'trash-can'],
          label: 'Delete post',
          onPress() {
            store.shell.openModal(
              new ConfirmModel(
                'Delete this post?',
                'Are you sure? This can not be undone.',
                onDeletePost,
              ),
            )
          },
        }
      : undefined,
  ].filter(Boolean) as DropdownItem[]

  return (
    <DropdownBtn style={style} items={dropdownItems} menuWidth={200}>
      {children}
    </DropdownBtn>
  )
}
