import React, {useCallback, useEffect, useRef, useState} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  KeyboardEvent,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useFocusEffect} from '@react-navigation/native'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {WaverlyScreenPadding} from 'view/com/w2/WaverlyScreenPadding'
import {Text} from 'view/com/util/text/Text'
import {colors} from 'lib/styles'
import {Image} from 'expo-image'
import {ChatContents} from 'view/com/w2/chat/ChatContents'
import {InputRow} from 'view/com/w2/chat/InputRow'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {KeyboardListeners} from 'view/com/w2/KeyboardListeners'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {HITSLOP_30} from 'lib/constants'

// const MOCK_OPTIONS = [
//   'Tell me about my feed',
//   'Curate feed',
//   'Give feedback',
// ] as const

type Props = NativeStackScreenProps<CommonNavigatorParams, 'WaverlyChatScreen'>
export const WaverlyChatScreen = withAuthRequired(
  observer(function WaverlyChatScreen({}: Props) {
    const store = useStores()
    const pal = usePalette('default')

    //const safeAreainsets = useSafeAreaInsets()
    const firstScrollViewHeight = 748 //667
    const scrollViewRef = useRef<ScrollView>(null)
    const scrollContainerRef = useRef<View>(null)
    const [hasNewContent, setHasNewContent] = useState<boolean>(false)
    const [scrollHeight, setScrollHeight] = useState<number>(
      firstScrollViewHeight,
    )
    const [shiftVal, setShiftVal] = useState<number>(0)
    const [query, setQuery] = useState<string>('')

    const onChangeQuery = useCallback(
      (text: string) => {
        setQuery(text)
      },
      [setQuery],
    )

    const onPressCancelSearch = useCallback(() => {
      setQuery('')
      // TODO: cancel outstanding chatGPT request
      store.shell.setIsDrawerSwipeDisabled(false)
    }, [store.shell])

    useEffect(() => {
      if (hasNewContent) {
        scrollViewRef.current?.scrollToEnd({animated: true})
        setHasNewContent(false)
      }
    }, [hasNewContent])

    const onSubmitQueryImpl = useCallback(
      (newText: string) => {
        store.waverlyChat.addToConversation(newText, false)
        store.waverlyChat.submitToGPT(newText)
        onShowSmartBar(false)
        setSmartOptions([])
        Keyboard.dismiss()
        // TODO: fix race condition between keyboard autocomplete
        // TODO: and the clearing of the prompt field.
        setQuery('')
        //store.shell.setIsDrawerSwipeDisabled(true)
      },
      [store.waverlyChat],
    )

    const onSubmitQuery = useCallback(() => {
      const newText = query.trim()
      onSubmitQueryImpl(newText)
    }, [onSubmitQueryImpl, query])

    const onSoftReset = useCallback(() => {
      scrollViewRef.current?.scrollToEnd({animated: true})
      onPressCancelSearch()
    }, [onPressCancelSearch])

    const onHasNewContent = useCallback(() => {
      setHasNewContent(true)
    }, [])

    ////////////////////////////////////////////////////////////////////////
    useFocusEffect(
      useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const cleanup = () => {
          softResetSub.remove()
          store.shell.showFab()
        }
        store.waverlyChat.setOnHasNewContent(onHasNewContent)
        store.waverlyChat.setOnHasNewSmartOptions(setSmartOptions)
        store.shell.setMinimalShellMode(true)
        store.shell.hideFab()
        return cleanup
      }, [onHasNewContent, onSoftReset, store]),
    )

    const inputRowViewRef = useRef<View>(null)
    const shift = useAnimatedValue(0)
    const onKeyboardWillShow = useCallback(
      (event: KeyboardEvent) => {
        const {height: windowHeight} = Dimensions.get('window')
        const keyboardHeight = event.endCoordinates.height
        const currentlyFocusedField = inputRowViewRef
        currentlyFocusedField.current?.measure(
          (originX, originY, width, height, pageX, pageY) => {
            const fieldHeight = height
            const fieldTop = pageY
            const gap = windowHeight - keyboardHeight - (fieldTop + fieldHeight)

            if (gap >= 0) {
              return
            }
            Animated.timing(shift, {
              toValue: gap,
              duration: 100,
              useNativeDriver: true,
            }).start()
          },
        )
      },
      [shift],
    )
    // Scroll the view to the bottom whenever the keyboard is opened.
    const onKeyboardDidShow = useCallback(() => {
      scrollViewRef.current?.scrollToEnd({animated: true})
    }, [])
    let onKeyboardWillHide = useCallback(() => {
      Animated.timing(shift, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start()
    }, [shift])

    // Mirror the shift AnimValue to the CPU.
    useEffect(() => {
      shift.addListener(e => {
        setShiftVal(e.value)
      })
    }, [shift, shiftVal])

    const viewHeaderRef = useRef<View>(null)

    ////////////////////////////////////////////////////////////////////////////
    // Scroll the view to the bottom whenever it reszies.
    const onScrollViewLayout = useCallback(() => {
      //console.log('onScrollViewLayout')
      scrollViewRef.current?.scrollToEnd({animated: true})
    }, [])

    ////////////////////////////////////////////////////////////////////////////
    // Track the height of the input container: shorten/lengthing the scrollView
    // whenever the number of rows in the input container increases/decreases.
    //const [inputContentsHeight, setInputContentsHeight] = useState<number>(0)

    useEffect(() => {
      scrollContainerRef.current?.measure(
        (originX, originY, width, height, pageX, pageY) => {
          const scrollPageY = pageY // Top row of the ScrollView
          inputRowViewRef.current?.measure(
            (ioriginX, ioriginY, iwidth, iheight, ipageX, ipageY) => {
              const inputRowPageY = ipageY // Top row of the Input Row

              // Difference between them is the vertical size of the ScrollView.
              const targetScrollViewHeight = inputRowPageY - scrollPageY // 667
              setScrollHeight(targetScrollViewHeight)
            },
          )
        },
      )
    })
    /*
    ////////////////////////////////////////////////////////////////////////////
    // Track the bottomY of the ViewHeader, in screenspace.
    const [viewHeaderBottomY, setViewHeaderBottomY] = useState<number>()
    const onViewHeaderLayout = useCallback(() => {
      viewHeaderRef.current?.measure(
        (originX, originY, width, height, pageX, pageY) => {
          console.log(originX, originY, width, height, pageX, pageY)
          setViewHeaderBottomY(pageY + height)
        },
      )
    }, [])
    const [firstInputContentsHeight, setFirstInputContentsHeight] =
      useState<number>(0)
    useEffect(() => {
      if (!firstInputContentsHeight && inputContentsHeight > 0)
        setFirstInputContentsHeight(inputContentsHeight)

      if (!viewHeaderBottomY) return
      const {height: windowHeight} = Dimensions.get('window')

      scrollContainerRef.current?.measure(
        (originX, originY, width, height, pageX, pageY) => {
          const scrollPageY = pageY // Top row of the ScrollView
          inputRowViewRef.current?.measure(
            (originX, originY, width, height, pageX, pageY) => {
              const inputRowPageY = pageY // Top row of the Input Row
              const remainder =
                windowHeight -
                viewHeaderBottomY -
                height -
                safeAreainsets.bottom

              console.log('remainder', remainder)
              console.log('remainder2', pageY - viewHeaderBottomY)
              // Difference between them is the vertical size of the ScrollView.
              const targetScrollViewHeight = inputRowPageY - scrollPageY // 667
              console.log('==========', targetScrollViewHeight)
              //setScrollHeight(pageY - viewHeaderBottomY)

              const originalScrollViewHeight = remainder
              setScrollHeight(
                originalScrollViewHeight + // targetScrollViewHeight
                  shiftVal,
              )
            },
          )
        },
      )
    }, [
      firstInputContentsHeight,
      inputContentsHeight,
      safeAreainsets.bottom,
      safeAreainsets.top,
      shiftVal,
      viewHeaderBottomY,
    ])
*/

    ////////////////////////////////////////////////////////////////////////////
    // Simulate the loading of some smart mock-options.
    const [smartOptions, setSmartOptions] = useState<string[]>([])
    const onLoadSmartOptions = useCallback(async () => {
      store.waverlyChat.generateSmartOptions()
      // Fake delay to simulate fetching ideas from the server
      // return new Promise<void>(resolve => {
      // setTimeout(() => {
      //   runInAction(() => {
      //     if (smartOptions.length === 0) {
      //       let newOptions: string[] = []
      //       for (const text of MOCK_OPTIONS) newOptions.push(text)
      //       setSmartOptions(newOptions)
      //     }
      //   })
      //   resolve()
      // }, 1000)
      // })
    }, [store.waverlyChat])

    ////////////////////////////////////////////////////////////////////////////
    // Pressing the Sparkle Button toggles the smart bar.
    const [showSmartBar, onShowSmartBar] = useState<boolean>(false)
    const onSparkleButton = useCallback(() => {
      const newShowSmartBar = !showSmartBar

      if (newShowSmartBar) onLoadSmartOptions()
      else setSmartOptions([])

      onShowSmartBar(newShowSmartBar)
    }, [onLoadSmartOptions, showSmartBar])

    const onSmartOptionSelected = useCallback(
      (selection: string) => {
        // We intentionally call onSubmitQueryImpl here rather than
        // onSubmitQuery to avoid a race condition whereby the chosen
        // smart-option doesn't appear in the TextInput or chat.
        setQuery(selection)
        onSubmitQueryImpl(selection)
      },
      [onSubmitQueryImpl],
    )

    ////////////////////////////////////////////////////////////////////////////
    // Track when chat is generating, so we can report it.
    const [generatingWatcher, setGeneratingWatcher] = useState<boolean>(false)
    useEffect(() => {
      setGeneratingWatcher(store.waverlyChat.isGeneratingChat)
    }, [store.waverlyChat.isGeneratingChat])

    // AnimateValue that goes from 0 to -kybdHeight
    // Watch this on the CPU; use it to set the bottom of the InputRow style
    //
    // keyboardWillShow: begin animation to -kybdHeight
    // keyboardDidShow: scrollToEnd
    // keyboardWillHide: begin animation back to zero

    // screenPadding
    //   KeyboardListeners
    //   flex1
    //     View / viewHeaderRef
    //       ViewHeader
    //     View / scrollContainerRef
    //       ScrollView / scrollViewRef
    //         ChatContents
    //     InputRow / inputRowViewRef

    const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
    return (
      <WaverlyScreenPadding>
        <KeyboardListeners
          onKeyboardWillShow={onKeyboardWillShow}
          onKeyboardDidShow={onKeyboardDidShow}
          onKeyboardWillHide={onKeyboardWillHide}
        />
        <View style={[pal.view, styles.flex1]}>
          <View ref={viewHeaderRef} /*onLayout={onViewHeaderLayout}*/>
            <ViewHeader
              showOnDesktop
              //showBorder
              renderButton={() => <HeaderContents />}
              renderTitle={() => <WaverlyChatTitle />}
            />
          </View>
          <View ref={scrollContainerRef} style={{height: scrollHeight}}>
            <ScrollView
              ref={scrollViewRef}
              onLayout={onScrollViewLayout}
              testID="wavleryChatScrollView"
              style={pal.view}
              //keyboardShouldPersistTaps="always"
              contentContainerStyle={[pal.view, styles.contentContainer]}>
              <ChatContents
                chatModel={store.waverlyChat}
                isGenerating={generatingWatcher}
                cardHeight={620} // TODO: calculate this.
              />
            </ScrollView>
          </View>
          <InputRow
            shiftVal={shiftVal}
            viewRef={inputRowViewRef}
            query={query}
            isInputFocused={isInputFocused}
            setIsInputFocused={setIsInputFocused}
            onChangeQuery={onChangeQuery}
            onSubmitQuery={onSubmitQuery}
            onSparkleButton={onSparkleButton} // TODO
            showSmartBar={showSmartBar}
            //setInputContentsHeight={setInputContentsHeight}
            showBorder={false}
            invertedColors={false}
            smartOptions={smartOptions}
            onSmartOptionSelected={onSmartOptionSelected}
          />
        </View>
      </WaverlyScreenPadding>
    )
  }),
)

const HeaderContents = () => {
  const store = useStores()
  return (
    <View style={styles.headerContents}>
      <TouchableOpacity
        hitSlop={HITSLOP_30}
        onPress={() => store.shell.openDrawer()}
        accessibilityRole="button">
        <UserAvatar avatar={store.me.avatar} size={32} />
      </TouchableOpacity>
    </View>
  )
}

const WaverlyChatTitle = () => {
  const pal = usePalette('default')
  return (
    <View style={styles.titleContainer}>
      <View style={[pal.viewInvertedLight, styles.iconRound]}>
        <Image
          accessibilityIgnoresInvertColors
          source={require('../../../../assets/images/WaverlyCommaInverted.png')}
          style={styles.waverlyAvatar}
          contentFit="cover"
        />
      </View>
      <Text type="lg-medium" style={styles.title}>
        Waverly
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    marginTop: 8,
    paddingBottom: 8,
    gap: 16,
    alignItems: 'stretch',
  },
  flex1: {
    flex: 1,
  },
  ///////////////////////////////////////////////////////////////////////////
  headerContents: {
    flexDirection: 'row',
    gap: 12,
  },
  ///////////////////////////////////////////////////////////////////////////
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    textAlign: 'center',
    color: colors.waverly1,
    fontSize: 16,
  },
  iconRound: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32 / 2,
    backgroundColor: colors.waverly1,
  },
  waverlyAvatar: {
    width: 28,
    height: 28,
  },
})
