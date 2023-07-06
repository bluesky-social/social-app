import * as Toast from 'view/com/util/Toast'

import {
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {isDesktopWeb, isMobileWeb} from 'platform/detection'

import {NavigationProp} from 'lib/routes/types'
import {PressableWithHover} from '../util/PressableWithHover'
import {Text} from '../util/text/Text'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {colors} from 'lib/styles'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {useNavigation} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: () => void
}

export function TabBar({
  testID,
  selectedPage,
  items,
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const pal = usePalette('default')
  const scrollElRef = useRef<ScrollView>(null)
  const [itemXs, setItemXs] = useState<number[]>([])
  const navigation = useNavigation<NavigationProp>()
  const currentFeed = useCustomFeed(
    'at://did:plc:innxlxge6b73hlk2yblc4qnd/app.bsky.feed.generator/splx-solana',
  )
  const [buttonText, setButtonText] = useState(
    currentFeed?.isSaved ? 'Leave' : 'Join',
  )

  // const indicatorStyle = useMemo(
  //   () => ({borderBottomColor: indicatorColor || pal.colors.link}),
  //   [indicatorColor, pal],
  // )

  console.log('selectedPage', selectedPage)

  // scrolls to the selected item when the page changes
  useEffect(() => {
    scrollElRef.current?.scrollTo({
      x: itemXs[selectedPage] || 0,
    })
    console.log('currentFeed', currentFeed?.isSaved)
  }, [scrollElRef, itemXs, selectedPage, currentFeed?.isSaved])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.()
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  useEffect(() => {
    if (currentFeed?.isSaved) {
      setButtonText('Leave')
    } else {
      setButtonText('Join')
    }
  }, [currentFeed?.isSaved])

  // const renderItem = React.useCallback(({item}: {item: CustomFeedModel}) => {
  //   return (
  //     <TabBarCustomFeed
  //       key={item.data.uri}
  //       item={item}
  //       showSaveBtn
  //       showDescription
  //       showLikes
  //     />
  //   )
  // }, [])

  const store = useStores()

  const onToggleSaved = React.useCallback(async () => {
    if (currentFeed === undefined) {
      return
    }

    if (store.session.isDefaultSession) {
      navigation.navigate('SignIn')
      return
    }
    if (currentFeed.isSaved) {
      store.shell.openModal({
        name: 'confirm',
        title: 'Remove from my feeds',
        message: `Remove ${currentFeed.displayName} from my feeds?`,
        onPressConfirm: async () => {
          try {
            await store.me.savedFeeds.unsave(currentFeed)
            Toast.show('Removed from my feeds')
          } catch (e) {
            Toast.show('There was an issue contacting your server')
            store.log.error('Failed to unsave feed', {e})
          }
        },
      })
      setButtonText('Join')
    } else {
      try {
        await store.me.savedFeeds.save(currentFeed)
        Toast.show('Added to my feeds')
        await currentFeed.reload()
        setButtonText('Leave')
      } catch (e) {
        Toast.show('There was an issue contacting your server')
        store.log.error('Failed to save feed', {e})
      }
    }
  }, [store, currentFeed, navigation])

  // calculates the x position of each item on mount and on layout change
  const onItemLayout = React.useCallback(
    (e: LayoutChangeEvent, index: number) => {
      const x = e.nativeEvent.layout.x
      setItemXs(prev => {
        const Xs = [...prev]
        Xs[index] = x
        return Xs
      })
    },
    [],
  )

  const newIndicatorStyle = {
    borderWidth: 2,
    borderColor: colors.splx.primary[50],
  }

  // function TabJoinButton() {
  //   return (
  //     <>
  //       {items.map((item, i) => {
  //         return (
  //           <>
  //             {item === 'Solana' ? (
  //               <TouchableOpacity
  //                 key={i}
  //                 onPress={onToggleSaved}
  //                 accessibilityRole="button">
  //                 <Text type="button" style={styles.btn}>
  //                   Join
  //                 </Text>
  //               </TouchableOpacity>
  //             ) : null}
  //           </>
  //         )
  //       })}
  //     </>
  //   )
  // }

  console.log('isSolana', currentFeed?.isSaved)

  return (
    <View testID={testID} style={[pal.view, styles.outer]}>
      <View
        // horizontal={true}
        // showsHorizontalScrollIndicator={false}
        // ref={scrollElRef}
        style={styles.contentContainer}>
        {items.map((item, i) => {
          const selected = i === selectedPage
          // if (selectedPage === i) {
          //   console.log('selected', items[i])
          //   if (items[i] === 'Solana') {
          //     setIsSolana(true)
          //   }
          // }
          return (
            <>
              <View style={styles.container}>
                <PressableWithHover
                  key={item}
                  onLayout={e => onItemLayout(e, i)}
                  style={[styles.item, selected && newIndicatorStyle]}
                  hoverStyle={pal.viewLight}
                  onPress={() => onPressItem(i)}>
                  {item === 'Solana' && (
                    <Image
                      source={require('./sol-logo.png')}
                      style={styles.imageStyle}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                  {item === 'Home' && (
                    <Image
                      source={require('./home.png')}
                      style={styles.imageStyle}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                </PressableWithHover>
                <Text
                  type={isDesktopWeb ? 'xl-bold' : 'lg-bold'}
                  testID={testID ? `${testID}-${item}` : undefined}
                  style={{
                    ...(selected
                      ? {...pal.textLight, textDecorationLine: 'underline'}
                      : pal.text),
                    fontSize: 14,
                  }}>
                  {item}
                </Text>
              </View>
            </>
          )
        })}
      </View>
      {selectedPage === 1 ? (
        currentFeed &&
        // !currentFeed?.isSaved &&
        !store.session.isDefaultSession ? (
          <TouchableOpacity onPress={onToggleSaved} accessibilityRole="button">
            <Text type="button" style={styles.btn}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        ) : (
          <></>
        )
      ) : (
        <></>
      )}
    </View>
  )
}

const styles = isDesktopWeb
  ? StyleSheet.create({
      btn: {
        borderRadius: 10,
        color: 'white',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.splx.primary[50],
      },
      imageStyle: {
        width: 25,
        height: 25,
      },
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5,
      },
      outer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 598,
        marginBottom: 10,
        paddingRight: 10,
      },
      contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',

        columnGap: 8,
        marginLeft: 14,
        paddingRight: 14,
        backgroundColor: 'transparent',
      },
      item: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: colors.splx.neutral[30],
        color: '#6E59B1',
        marginHorizontal: 4,
        marginVertical: 4,
        backgroundColor: '#F5F2F9',
      },
    })
  : StyleSheet.create({
      btn: {
        borderRadius: 10,
        color: 'white',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.splx.primary[50],
      },
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        marginTop: 8,
      },
      outer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        paddingRight: 10,
      },
      contentContainer: {
        flexDirection: 'row',
        columnGap: isMobileWeb ? 0 : 20,
        marginLeft: isMobileWeb ? 0 : 18,
        paddingRight: isMobileWeb ? 0 : 36,
        marginBottom: 4,
        backgroundColor: 'transparent',
      },
      imageStyle: {
        width: 15,
        height: 15,
      },
      item: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 70,
        width: 25,
        height: 25,
        color: '#6E59B1',
        borderWidth: 1,
        borderColor: colors.splx.neutral[30],
        paddingHorizontal: isMobileWeb ? 8 : 0,
      },
    })
