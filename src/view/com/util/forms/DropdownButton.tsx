import React, {useRef} from 'react'
import {
  Share,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import RootSiblings from 'react-native-root-siblings'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {Button, ButtonType} from './Button'
import {colors} from '../../../lib/styles'
import {toShareUrl} from '../../../../lib/strings'
import {useStores} from '../../../../state'
import {ReportPostModal, ConfirmModal} from '../../../../state/models/shell-ui'
import {TABS_ENABLED} from '../../../../build-flags'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export interface DropdownItem {
  icon?: IconProp
  label: string
  onPress: () => void
}

export type DropdownButtonType = ButtonType | 'bare'

export function DropdownButton({
  type = 'bare',
  style,
  items,
  label,
  menuWidth,
  children,
}: {
  type?: DropdownButtonType
  style?: StyleProp<ViewStyle>
  items: DropdownItem[]
  label?: string
  menuWidth?: number
  children?: React.ReactNode
}) {
  const ref = useRef<TouchableOpacity>(null)

  const onPress = () => {
    ref.current?.measure(
      (
        _x: number,
        _y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => {
        if (!menuWidth) {
          menuWidth = 200
        }
        createDropdownMenu(
          pageX + width - menuWidth,
          pageY + height,
          menuWidth,
          items,
        )
      },
    )
  }

  if (type === 'bare') {
    return (
      <TouchableOpacity
        style={style}
        onPress={onPress}
        hitSlop={HITSLOP}
        // Fix an issue where specific references cause runtime error in jest environment
        ref={
          typeof process !== 'undefined' && process.env.JEST_WORKER_ID != null
            ? null
            : ref
        }>
        {children}
      </TouchableOpacity>
    )
  }
  return (
    <View ref={ref}>
      <Button onPress={onPress} style={style} label={label}>
        {children}
      </Button>
    </View>
  )
}

export function PostDropdownBtn({
  style,
  children,
  itemHref,
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
    {
      icon: 'circle-exclamation',
      label: 'Report post',
      onPress() {
        store.shell.openModal(new ReportPostModal(itemHref))
      },
    },
    isAuthor
      ? {
          icon: ['far', 'trash-can'],
          label: 'Delete post',
          onPress() {
            store.shell.openModal(
              new ConfirmModal(
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
    <DropdownButton style={style} items={dropdownItems} menuWidth={200}>
      {children}
    </DropdownButton>
  )
}

function createDropdownMenu(
  x: number,
  y: number,
  width: number,
  items: DropdownItem[],
): RootSiblings {
  const onPressItem = (index: number) => {
    sibling.destroy()
    items[index].onPress()
  }
  const onOuterPress = () => sibling.destroy()
  const sibling = new RootSiblings(
    (
      <>
        <TouchableWithoutFeedback onPress={onOuterPress}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <View style={[styles.menu, {left: x, top: y, width}]}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem]}
              onPress={() => onPressItem(index)}>
              {item.icon && (
                <FontAwesomeIcon style={styles.icon} icon={item.icon} />
              )}
              <Text style={styles.label}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ),
  )
  return sibling
}

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000',
    opacity: 0.1,
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 14,
    opacity: 1,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 15,
    paddingRight: 40,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.gray1,
    marginTop: 4,
    paddingTop: 12,
  },
  icon: {
    marginLeft: 6,
    marginRight: 8,
  },
  label: {
    fontSize: 18,
  },
})
