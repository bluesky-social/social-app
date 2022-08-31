import React, {forwardRef, useState, useImperativeHandle, useRef} from 'react'
import {StyleSheet, Text, TouchableWithoutFeedback, View} from 'react-native'
import BottomSheet from '@gorhom/bottom-sheet'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {s} from '../../lib/styles'
import {NavigationTabModel} from '../../../state/models/navigation'
import {createCustomBackdrop} from '../../com/util/BottomSheetCustomBackdrop'
import {match} from '../../routes'

const TAB_HEIGHT = 38
const TAB_SPACING = 5
const BOTTOM_MARGIN = 70

export const TabsSelectorModal = forwardRef(function TabsSelectorModal(
  {
    onNewTab,
    onChangeTab,
    onCloseTab,
    tabs,
    currentTabIndex,
  }: {
    onNewTab: () => void
    onChangeTab: (tabIndex: number) => void
    onCloseTab: (tabIndex: number) => void
    tabs: NavigationTabModel[]
    currentTabIndex: number
  },
  ref,
) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [snapPoints, setSnapPoints] = useState<number[]>([100])
  const bottomSheetRef = useRef<BottomSheet>(null)

  useImperativeHandle(ref, () => ({
    open() {
      setIsOpen(true)
      setSnapPoints([
        (tabs.length + 1) * (TAB_HEIGHT + TAB_SPACING) + BOTTOM_MARGIN,
      ])
      bottomSheetRef.current?.expand()
    },
  }))

  const onShareBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      setIsOpen(false)
    }
  }
  const onPressNewTab = () => {
    onNewTab()
    onClose()
  }
  const onPressChangeTab = (tabIndex: number) => {
    onChangeTab(tabIndex)
    onClose()
  }
  const onClose = () => {
    setIsOpen(false)
    bottomSheetRef.current?.close()
  }
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={isOpen ? createCustomBackdrop(onClose) : undefined}
      onChange={onShareBottomSheetChange}>
      <View style={s.p10}>
        {tabs.map((tab, tabIndex) => {
          const {icon} = match(tab.current.url)
          const isActive = tabIndex === currentTabIndex
          return (
            <View
              key={tabIndex}
              style={[styles.tab, styles.existing, isActive && styles.active]}>
              <TouchableWithoutFeedback
                onPress={() => onPressChangeTab(tabIndex)}>
                <View style={styles.tabIcon}>
                  <FontAwesomeIcon size={16} icon={icon} />
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback
                onPress={() => onPressChangeTab(tabIndex)}>
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.current.title || tab.current.url}
                </Text>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => onCloseTab(tabIndex)}>
                <View style={styles.tabClose}>
                  <FontAwesomeIcon
                    size={16}
                    icon="x"
                    style={styles.tabCloseIcon}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          )
        })}
        <TouchableWithoutFeedback onPress={onPressNewTab}>
          <View style={[styles.tab, styles.create]}>
            <View style={styles.tabIcon}>
              <FontAwesomeIcon size={16} icon="plus" />
            </View>
            <Text style={styles.tabText}>New tab</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 4,
    height: TAB_HEIGHT,
    marginBottom: TAB_SPACING,
  },
  existing: {
    borderColor: '#000',
    borderWidth: 1,
  },
  create: {
    backgroundColor: '#F8F3F3',
  },
  active: {
    backgroundColor: '#faf0f0',
    borderColor: '#f00',
    borderWidth: 1,
  },
  tabIcon: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 15,
    paddingRight: 10,
  },
  tabText: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  tabClose: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 15,
  },
  tabCloseIcon: {
    color: '#655',
  },
})
