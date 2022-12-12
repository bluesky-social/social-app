import React, {useRef} from 'react'
import {
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import RootSiblings from 'react-native-root-siblings'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from '../../lib/styles'
import {toShareUrl} from '../../../lib/strings'
import {useStores} from '../../../state'
import {ConfirmModel} from '../../../state/models/shell-ui'
import {TABS_ENABLED} from '../../../build-flags'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}

export interface DropdownItem {
  icon?: IconProp
  label: string
  onPress: () => void
}

export function DropdownBtn({
  style,
  items,
  menuWidth,
  children,
}: {
  style?: StyleProp<ViewStyle>
  items: DropdownItem[]
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

  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      hitSlop={HITSLOP}
      ref={ref}>
      {children}
    </TouchableOpacity>
  )
}

export function PostDropdownBtn({
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
