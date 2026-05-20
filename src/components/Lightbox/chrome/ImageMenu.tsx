import {useRef, useState} from 'react'
import {Modal, Pressable, StyleSheet, View} from 'react-native'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {type Props as IconProps} from '#/components/icons/common'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Download_Stroke2_Corner0_Rounded as DownloadIcon} from '#/components/icons/Download'
import {Text} from '#/components/Typography'
import {CircleChromeButton} from './CircleChromeButton'

type Props = {
  onPressShare: () => void
  onPressSave: () => void
}

type Anchor = {x: number; y: number; width: number; height: number}

const MENU_WIDTH = 160
const GAP = 6
const CARD_BG = '#000000'
const CARD_BORDER = '#232e3e'
const ITEM_TEXT = '#f9fafb'

const SPRING_IN = {damping: 18, mass: 0.6, stiffness: 240}
const TIMING_OUT = {duration: 150}

export function ImageMenu({onPressShare, onPressSave}: Props) {
  const {_} = useLingui()
  const triggerRef = useRef<View>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const progress = useSharedValue(0)

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({x, y, width, height})
      setIsMounted(true)
      progress.set(withSpring(1, SPRING_IN))
    })
  }

  const close = () => {
    progress.set(
      withTiming(0, TIMING_OUT, finished => {
        if (finished) {
          runOnJS(setIsMounted)(false)
        }
      }),
    )
  }

  const runAction = (action: () => void) => {
    close()
    action()
  }

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <CircleChromeButton
          icon={DotsIcon}
          iconStyle={{transform: [{rotate: '90deg'}]}}
          label={_(msg`Image options`)}
          onPress={open}
        />
      </View>
      <Modal
        transparent
        visible={isMounted}
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={_(msg`Close menu`)}
          accessibilityHint=""
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
        {anchor && (
          <MenuCard anchor={anchor} progress={progress}>
            <MenuItem
              icon={ShareIcon}
              label={_(msg`Share image`)}
              onPress={() => runAction(onPressShare)}
            />
            <MenuItem
              icon={DownloadIcon}
              label={_(msg`Save image`)}
              onPress={() => runAction(onPressSave)}
            />
          </MenuCard>
        )}
      </Modal>
    </>
  )
}

function MenuCard({
  anchor,
  progress,
  children,
}: {
  anchor: Anchor
  progress: ReturnType<typeof useSharedValue<number>>
  children: React.ReactNode
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{scale: interpolate(progress.get(), [0, 1], [0.9, 1])}],
  }))

  return (
    <Animated.View
      style={[
        a.absolute,
        styles.card,
        {
          top: anchor.y + anchor.height + GAP,
          left: anchor.x,
          transformOrigin: 'top left',
        },
        animatedStyle,
      ]}>
      {children}
    </Animated.View>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ComponentType<IconProps>
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint=""
      onPress={onPress}
      style={({pressed}) => [styles.item, pressed && styles.itemPressed]}>
      <Icon width={18} fill={ITEM_TEXT} />
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: MENU_WIDTH,
    padding: 8,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  item: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 19.5,
    color: ITEM_TEXT,
  },
})
