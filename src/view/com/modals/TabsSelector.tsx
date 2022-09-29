import React, {createRef, useRef, useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from '../../../state'
import {s, colors, gradients} from '../../lib/styles'
import {match} from '../../routes'

const TAB_HEIGHT = 42

export const snapPoints = [500]

export const Component = observer(() => {
  const store = useStores()
  const [closingTabIndex, setClosingTabIndex] = useState<number | undefined>(
    undefined,
  )
  const closeInterp = useSharedValue<number>(0)
  const tabsRef = useRef<ScrollView>(null)
  const tabRefs = useMemo(
    () =>
      Array.from({length: store.nav.tabs.length}).map(() =>
        createRef<Animated.View>(),
      ),
    [store.nav.tabs.length],
  )

  // events
  // =

  const onPressNewTab = () => {
    store.nav.newTab('/')
    onClose()
  }
  const onPressCloneTab = () => {
    store.nav.newTab(store.nav.tab.current.url)
    onClose()
  }
  const onPressShareTab = () => {
    onClose()
    // TODO
  }
  const onPressChangeTab = (tabIndex: number) => {
    store.nav.setActiveTab(tabIndex)
    onClose()
  }
  const doCloseTab = (index: number) => store.nav.closeTab(index)
  const onCloseTab = (tabIndex: number) => {
    setClosingTabIndex(tabIndex)
    closeInterp.value = 0
    closeInterp.value = withTiming(1, {duration: 300}, () => {
      runOnJS(setClosingTabIndex)(undefined)
      runOnJS(doCloseTab)(tabIndex)
    })
  }
  const onNavigate = (url: string) => {
    store.nav.navigate(url)
    onClose()
  }
  const onClose = () => {
    store.shell.closeModal()
  }
  const onLayout = () => {
    // focus the current tab
    const targetTab = tabRefs[store.nav.tabIndex]
    if (tabsRef.current && targetTab.current) {
      targetTab.current.measureLayout?.(
        tabsRef.current,
        (_left: number, top: number) => {
          tabsRef.current?.scrollTo({y: top, animated: false})
        },
        () => {},
      )
    }
  }

  // rendering
  // =

  const FatMenuItem = ({
    icon,
    label,
    url,
    gradient,
  }: {
    icon: IconProp
    label: string
    url: string
    gradient: keyof typeof gradients
  }) => (
    <TouchableOpacity
      style={styles.fatMenuItem}
      onPress={() => onNavigate(url)}>
      <LinearGradient
        style={[styles.fatMenuItemIconWrapper]}
        colors={[gradients[gradient].start, gradients[gradient].end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <FontAwesomeIcon icon={icon} style={styles.fatMenuItemIcon} size={24} />
      </LinearGradient>
      <Text style={styles.fatMenuItemLabel}>{label}</Text>
    </TouchableOpacity>
  )

  const renderSwipeActions = () => {
    return <View style={[s.p2]} />
  }

  const currentTabIndex = store.nav.tabIndex
  const closingTabAnimStyle = useAnimatedStyle(() => ({
    height: TAB_HEIGHT * (1 - closeInterp.value),
    opacity: 1 - closeInterp.value,
    marginBottom: 4 * (1 - closeInterp.value),
  }))
  return (
    <View onLayout={onLayout}>
      <View style={[s.p10, styles.section]}>
        <View style={styles.fatMenuItems}>
          <FatMenuItem icon="house" label="Feed" url="/" gradient="primary" />
          <FatMenuItem
            icon="bell"
            label="Notifications"
            url="/notifications"
            gradient="purple"
          />
          <FatMenuItem
            icon={['far', 'user']}
            label="My Profile"
            url="/"
            gradient="blue"
          />
          <FatMenuItem icon="gear" label="Settings" url="/" gradient="blue" />
        </View>
      </View>
      <View style={[s.p10, styles.section]}>
        <View style={styles.btns}>
          <TouchableWithoutFeedback onPress={onPressShareTab}>
            <View style={[styles.btn]}>
              <View style={styles.btnIcon}>
                <FontAwesomeIcon size={16} icon="share" />
              </View>
              <Text style={styles.btnText}>Share</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={onPressCloneTab}>
            <View style={[styles.btn]}>
              <View style={styles.btnIcon}>
                <FontAwesomeIcon size={16} icon={['far', 'clone']} />
              </View>
              <Text style={styles.btnText}>Clone tab</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={onPressNewTab}>
            <View style={[styles.btn]}>
              <View style={styles.btnIcon}>
                <FontAwesomeIcon size={16} icon="plus" />
              </View>
              <Text style={styles.btnText}>New tab</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
      <View style={[s.p10, styles.section, styles.sectionGrayBg]}>
        <ScrollView ref={tabsRef} style={styles.tabs}>
          {store.nav.tabs.map((tab, tabIndex) => {
            const {icon} = match(tab.current.url)
            const isActive = tabIndex === currentTabIndex
            const isClosing = closingTabIndex === tabIndex
            return (
              <Swipeable
                key={tab.id}
                renderLeftActions={renderSwipeActions}
                renderRightActions={renderSwipeActions}
                leftThreshold={100}
                rightThreshold={100}
                onSwipeableWillOpen={() => onCloseTab(tabIndex)}>
                <Animated.View
                  style={[
                    styles.tabOuter,
                    isClosing ? closingTabAnimStyle : undefined,
                  ]}>
                  <Animated.View
                    ref={tabRefs[tabIndex]}
                    style={[
                      styles.tab,
                      styles.existing,
                      isActive && styles.active,
                    ]}>
                    <TouchableWithoutFeedback
                      onPress={() => onPressChangeTab(tabIndex)}>
                      <View style={styles.tabInner}>
                        <View style={styles.tabIcon}>
                          <FontAwesomeIcon size={20} icon={icon} />
                        </View>
                        <Text
                          ellipsizeMode="tail"
                          numberOfLines={1}
                          suppressHighlighting={true}
                          style={[
                            styles.tabText,
                            isActive && styles.tabTextActive,
                          ]}>
                          {tab.current.title || tab.current.url}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback
                      onPress={() => onCloseTab(tabIndex)}>
                      <View style={styles.tabClose}>
                        <FontAwesomeIcon
                          size={14}
                          icon="x"
                          style={styles.tabCloseIcon}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </Animated.View>
                </Animated.View>
              </Swipeable>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  section: {
    borderBottomColor: colors.gray2,
    borderBottomWidth: 1,
  },
  sectionGrayBg: {
    backgroundColor: colors.gray1,
  },
  fatMenuItems: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  fatMenuItem: {
    width: 90,
    alignItems: 'center',
    marginRight: 6,
  },
  fatMenuItemIconWrapper: {
    borderRadius: 6,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
  },
  fatMenuItemIcon: {
    color: colors.white,
  },
  fatMenuItemLabel: {
    fontSize: 13,
  },
  tabs: {
    height: 240,
  },
  tabOuter: {
    height: TAB_HEIGHT + 4,
    overflow: 'hidden',
  },
  tab: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    backgroundColor: colors.gray1,
    alignItems: 'center',
    borderRadius: 4,
  },
  tabInner: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingLeft: 12,
    paddingVertical: 12,
  },
  existing: {
    borderColor: colors.gray4,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.white,
    borderColor: colors.black,
    borderWidth: 1,
  },
  tabIcon: {},
  tabText: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  tabTextActive: {
    fontWeight: '500',
  },
  tabClose: {
    paddingVertical: 16,
    paddingRight: 16,
  },
  tabCloseIcon: {
    color: '#655',
  },
  btns: {
    flexDirection: 'row',
    paddingTop: 2,
  },
  btn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray1,
    borderRadius: 4,
    marginRight: 5,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 10,
  },
  btnIcon: {
    marginRight: 8,
  },
  btnText: {
    fontWeight: '500',
    fontSize: 16,
  },
})
