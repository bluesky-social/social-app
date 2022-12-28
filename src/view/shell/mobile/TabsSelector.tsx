import React, {createRef, useRef, useMemo, useState} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Animated,
  ScrollView,
  Share,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../../com/util/text/Text'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'
import {toShareUrl} from '../../../lib/strings'
import {match} from '../../routes'
import {useAnimatedValue} from '../../lib/hooks/useAnimatedValue'

const TAB_HEIGHT = 42

export const TabsSelector = observer(
  ({
    active,
    tabMenuInterp,
    onClose,
  }: {
    active: boolean
    tabMenuInterp: Animated.Value
    onClose: () => void
  }) => {
    const store = useStores()
    const insets = useSafeAreaInsets()
    const [closingTabIndex, setClosingTabIndex] = useState<number | undefined>(
      undefined,
    )
    const closeInterp = useAnimatedValue(0)
    const tabsRef = useRef<ScrollView>(null)
    const tabRefs = useMemo(
      () =>
        Array.from({length: store.nav.tabs.length}).map(() =>
          createRef<Animated.View>(),
        ),
      [store.nav.tabs.length],
    )

    const wrapperAnimStyle = {
      transform: [
        {
          translateY: tabMenuInterp.interpolate({
            inputRange: [0, 1.0],
            outputRange: [320, 0],
          }),
        },
      ],
    }

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
      Share.share({url: toShareUrl(store.nav.tab.current.url)})
    }
    const onPressChangeTab = (tabIndex: number) => {
      store.nav.setActiveTab(tabIndex)
      onClose()
    }
    const onCloseTab = (tabIndex: number) => {
      setClosingTabIndex(tabIndex)
      closeInterp.setValue(0)
      Animated.timing(closeInterp, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setClosingTabIndex(undefined)
        store.nav.closeTab(tabIndex)
      })
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

    const renderSwipeActions = () => {
      return <View style={[s.p2]} />
    }

    const currentTabIndex = store.nav.tabIndex
    const closingTabAnimStyle = {
      height: Animated.multiply(TAB_HEIGHT, Animated.subtract(1, closeInterp)),
      opacity: Animated.subtract(1, closeInterp),
      marginBottom: Animated.multiply(4, Animated.subtract(1, closeInterp)),
    }

    if (!active) {
      return <View />
    }

    return (
      <Animated.View
        style={[
          styles.wrapper,
          {bottom: insets.bottom + 55},
          wrapperAnimStyle,
        ]}>
        <View onLayout={onLayout}>
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
                        // HOTFIX
                        // TabsSelector.test.tsx snapshot fails if the
                        // ref was set like this: ref={tabRefs[tabIndex]}
                        ref={(ref: any) => (tabRefs[tabIndex] = ref)}
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
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: '100%',
    height: 320,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
    backgroundColor: '#fff',
    opacity: 1,
  },
  section: {
    borderBottomColor: colors.gray2,
    borderBottomWidth: 1,
  },
  sectionGrayBg: {
    backgroundColor: colors.gray1,
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
