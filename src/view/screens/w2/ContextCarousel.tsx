import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {WaverlyScreenPadding} from 'view/com/w2/WaverlyScreenPadding'
import {Text} from 'view/com/util/text/Text'
import {colors} from 'lib/styles'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import LinearGradient from 'react-native-linear-gradient'
import BottomSheet from '@gorhom/bottom-sheet'
import {CarouselItem_Card} from 'view/com/w2/contextCarousel/CarouselItem_Card'
import {CarouselItem_Feed} from 'view/com/w2/contextCarousel/CarouselItem_Feed'
import {SheetGrid} from 'view/com/w2/contextCarousel/SheetGrid'
import {createSheetBackdrop} from 'view/com/w2/contextCarousel/createSheetBackdrop'
import {NavigationProp} from 'lib/routes/types'
import {alpha} from 'lib/styles'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {ProfileViewBasic} from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {RootStoreModel} from 'state/index'
import {CarouselItem_Wave} from 'view/com/w2/contextCarousel/CarouselItem_Wave'
import {CarouselItem_Author} from 'view/com/w2/contextCarousel/CarouselItem_Author'
import {HITSLOP_30} from 'lib/constants'

const DEFAULT_SNAPPOINTS = ['35%']
const TEXTINPUT_SNAPPOINTS = ['14%'] // TODO: do we need to compute this...?
const HANDLE_HEIGHT = 24

// TODO: compute these.
const FAB_X_DELTA = -150
const FAB_YFULL_DELTA = -220
const FAB_YINPUTOPEN_DELTA = -380

////////////////////////////////////////////////////////////////////////////

const onEnterWaverlyChatImpl = (
  store: RootStoreModel,
  navigation: NavigationProp,
) => {
  store.shell.closeModal()
  store.waverlyChat.advanceSession()
  const pd = store.waverlyContext.pd
  if (pd) {
    if (pd.type === 'postText') {
      store.waverlyChat.addToConversation(pd.data, true)
      store.waverlyChat.addToConversation(
        'How can I help you with this post?',
        true,
      )
    } else if (pd.type === 'UGCBody') {
      const groupPost = pd.data as PostsFeedItemModel
      store.waverlyChat.addToConversation_groupPost(groupPost)
      store.waverlyChat.addToConversation(
        'How can I help you with this post?',
        true,
      )
    } else if (pd.type === 'RecBody') {
      //data={card.rec}
      store.waverlyChat.addToConversation('You launched with RecBody', true)
    } else if (pd.type === 'embedInfo') {
      const embedInfo = pd.data as EmbedInfo
      // const hasURI: boolean = embedInfo.link ? true : false
      // const hasImage: boolean = embedInfo.image ? true : false
      // const hasQuote: boolean = embedInfo.quote ? true : false
      store.waverlyChat.addToConversation_Embed(embedInfo)
      store.waverlyChat.setSessionContext(embedInfo)
      /*
        if (hasURI) {
          if (embedInfo.link?.originalUri) {
            store.waverlyChat.addToConversation(
              'Link: ' + embedInfo.link?.originalUri,
              true,
            )
          }
          if (embedInfo.link?.title)
            store.waverlyChat.addToConversation(
              'Title: ' + embedInfo.link?.title,
              true,
            )
          if (embedInfo.link?.description)
            store.waverlyChat.addToConversation(
              'Description: ' + embedInfo.link?.description,
              true,
            )
        }
        if (hasImage)
          store.waverlyChat.addToConversation(
            'Image: ' + embedInfo.image?.uri,
            true,
          )
        if (hasQuote)
          store.waverlyChat.addToConversation(
            'Quote: ' + embedInfo.quote,
            true,
          )
        */

      store.waverlyChat.addToConversation('How can I help you with this?', true)
    } else if (pd.type === 'groupInfo') {
      const groupInfo = pd.data as ProfileViewBasic
      store.waverlyChat.addToConversation_UserProfile(groupInfo)
      store.waverlyChat.addToConversation(
        'Can I help you with this Wave?',
        true,
      )
    } else if (pd.type === 'userInfo') {
      const userInfo = pd.data as ProfileViewBasic
      store.waverlyChat.addToConversation_UserProfile(userInfo)
      const isWaverlyRec = userInfo.displayName === 'Waverly'
      store.waverlyChat.addToConversation(
        isWaverlyRec
          ? 'Would you like to configure Waverly recommendations?'
          : 'Can I help you with this user?',
        true,
      )
    }
  } else {
    store.waverlyChat.addToConversation('What can I help you with?', true)
  }
  navigation.navigate('WaverlyChatScreen')
  store.shell.closeDrawer()
}

const onEnterWordDJImpl = (
  store: RootStoreModel,
  navigation: NavigationProp,
) => {
  store.shell.closeModal()
  store.wordDJModel.clear()
  const pd = store.waverlyContext.pd
  if (pd) {
    if (pd.type === 'postText') {
      store.wordDJModel.setManualPayload(pd.data)
    } else if (pd.type === 'UGCBody') {
      //data={card.groupPost}
      store.wordDJModel.setManualPayload('Launched with UGCBody')
    } else if (pd.type === 'RecBody') {
      //data={card.rec}
      store.wordDJModel.setManualPayload('Launched with RecBody')
    } else if (pd.type === 'embedInfo') {
      const embedInfo = pd.data as EmbedInfo
      const hasURI: boolean = embedInfo.link ? true : false
      const hasImage: boolean = embedInfo.image ? true : false
      const hasQuote: boolean = embedInfo.quote ? true : false
      let payload: string = ''
      if (hasURI) {
        payload += 'Link: ' + embedInfo.link?.originalUri + '\n'
        if (embedInfo.link?.title)
          payload += 'Title: ' + embedInfo.link?.title + '\n'
        if (embedInfo.link?.description)
          payload += 'Description: ' + embedInfo.link?.description + '\n'
      }
      if (hasImage) payload += 'Image: ' + embedInfo.image?.uri + '\n'
      if (hasQuote) payload += '""' + embedInfo.quote + '\n'

      payload += "What's on your mind?"
      store.wordDJModel.setManualPayload(payload)
    } else if (pd.type === 'groupInfo') {
      const groupInfo = pd.data as ProfileViewBasic
      store.wordDJModel.setGroup({
        did: groupInfo.did,
        handle: groupInfo.handle,
      })
      store.wordDJModel.setManualPayload("What's on your mind?")
      //data={group!.did}
    } else if (pd.type === 'userInfo') {
      const userInfo = pd.data as ProfileViewBasic
      //const isWaverlyRec = userInfo.displayName === 'Waverly'
      const prompt = 'Write a post about user ' + userInfo.displayName
      store.wordDJModel.setManualPayload(prompt)
    }
    store.wordDJModel.updateAuthoritativeStateForMode()
  } else store.wordDJModel.setManualPayload("What's on your mind?")
  store.wordDJModel.updateAuthoritativeStateForMode()
  navigation.navigate('WordDJScreen')
}

////////////////////////////////////////////////////////////////////////////
type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'ContextCarouselScreen'
>
export const ContextCarouselScreen = withAuthRequired(
  observer(function ContextCarouselScreen({}: Props) {
    const store = useStores()
    const pal = usePalette('default')
    const bottomSheetRef = useRef<BottomSheet>(null)
    const navigation = useNavigation<NavigationProp>()

    ////////////////////////////////////////////////////////////////////////
    useFocusEffect(
      useCallback(() => {
        const cleanup = () => {
          store.shell.setFabOffset(0, 0)
          store.shell.setIsFabMovable(true)
        }
        store.shell.setMinimalShellMode(true)
        store.shell.setFabOffset(FAB_X_DELTA, FAB_YFULL_DELTA)
        store.shell.setIsFabMovable(false)
        return cleanup
      }, [store]),
    )

    const handleSheetChanges = useCallback((index: number) => {
      console.log('handleSheetChanges', index)
    }, [])

    // Close button on the BottomSheet.
    const onClose = useCallback(() => {
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')
    }, [navigation])

    ////////////////////////////////////////////////////////////////////////
    // Launching WordDJ.
    const onEnterWordDJ = React.useCallback(() => {
      onEnterWordDJImpl(store, navigation)
    }, [navigation, store])

    ////////////////////////////////////////////////////////////////////////
    // Launching WaverlyChatScreen.
    const onEnterWaverlyChat = useCallback(() => {
      onEnterWaverlyChatImpl(store, navigation)
    }, [navigation, store])

    ///////////////////////////////////////////////////////////////////////////
    // Props for the carousel.
    const userProfile = useCallback(
      () => (
        <TouchableOpacity
          hitSlop={HITSLOP_30}
          onPress={() => store.shell.openDrawer()}
          accessibilityRole="button">
          <UserAvatar avatar={store.me.avatar} size={32} />
        </TouchableOpacity>
      ),
      [store.me.avatar, store.shell],
    )
    const groupPost = useMemo(() => {
      return store.waverlyContext.get('activePost')
    }, [store.waverlyContext])

    ///////////////////////////////////////////////////////////////////////////
    // State and props for text input.
    const [isUsingTextInput, setIsUsingTextInput] = useState<boolean>(false)
    const onBack = () => setIsUsingTextInput(false)

    const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
    const [query, setQuery] = useState<string>('')
    const onChangeQuery = useCallback(
      (text: string) => {
        setQuery(text)
      },
      [setQuery],
    )

    // Move the Waverly button when animating to/from text input.
    // TODO: find a better way of programatically tracking the sheet height.
    useEffect(() => {
      const yDelta = isUsingTextInput ? FAB_YINPUTOPEN_DELTA : FAB_YFULL_DELTA
      store.shell.setFabOffset(FAB_X_DELTA, yDelta)
    }, [isUsingTextInput, store.shell])

    const onSubmitQuery = useCallback(() => {
      if (query.length === 0) {
        return
      }
      store.waverlyChat.advanceSession()
      store.waverlyChat.addToConversation(query, false)
      store.waverlyChat.submitToGPT(query)
      navigation.navigate('WaverlyChatScreen')
    }, [navigation, query, store.waverlyChat])

    // Exit text input when tapping on the backdrop component.
    const onBackdropClose = useCallback(() => {
      setIsUsingTextInput(false)
    }, [])

    const [itemIndex, setItemIndex] = useState<number>(0)
    return (
      <View style={[pal.view, styles.flex1]}>
        <LinearGradient
          colors={['#ECE2FF', '#B18BFF']}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.gradient}
        />
        <CardCarousel
          groupPost={groupPost}
          userProfile={userProfile}
          itemIndex={itemIndex}
          onSetItemIndex={setItemIndex}
        />
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={
            isUsingTextInput ? TEXTINPUT_SNAPPOINTS : DEFAULT_SNAPPOINTS
          }
          handleHeight={HANDLE_HEIGHT}
          index={0}
          android_keyboardInputMode="adjustResize"
          keyboardBlurBehavior="restore"
          backdropComponent={
            isUsingTextInput ? createSheetBackdrop(onBackdropClose) : undefined
          }
          handleComponent={NullHandleComponent} // No handle desired.
          backgroundStyle={{backgroundColor: '#E1D1FF'}} // Fill the bg w/ solid color.
          onChange={handleSheetChanges}
          style={{
            shadowColor: colors.waverly1,
            shadowOpacity: 0.2,
            shadowOffset: {width: 0, height: -2},
            shadowRadius: 3,
          }}>
          <View style={{flexDirection: 'row'}}>
            {isUsingTextInput && <BackButton onBack={onBack} />}
            {!isUsingTextInput && <CloseButton onClose={onClose} />}
          </View>
          <SheetGrid
            onEnterWordDJ={onEnterWordDJ}
            onEnterWaverlyChat={onEnterWaverlyChat}
            onToggleTextInput={setIsUsingTextInput}
            isUsingTextInput={isUsingTextInput}
            isInputFocused={isInputFocused}
            query={query}
            setIsInputFocused={setIsInputFocused}
            onChangeQuery={onChangeQuery}
            onSubmitQuery={onSubmitQuery}
          />
        </BottomSheet>
      </View>
    )
  }),
)

///////////////////////////////////////////////////////////////////////////////

interface CloseButtonProps {
  onClose: () => void
}
const CloseButton = ({onClose}: CloseButtonProps) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'flex-end',
        paddingTop: 12,
        paddingRight: 12,
      }}>
      <TouchableOpacity
        testID="carouselCloseBtn"
        accessibilityRole="button"
        accessibilityLabel="close"
        accessibilityHint=""
        style={[
          {
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: alpha(colors.waverly1, 0.2),
          },
        ]}
        onPress={onClose}>
        <FontAwesomeIcon
          icon="xmark"
          style={{color: colors.waverly1} as FontAwesomeIconStyle}
          size={24}
        />
      </TouchableOpacity>
    </View>
  )
}

///////////////////////////////////////////////////////////////////////////////

interface BackButtonProps {
  onBack: () => void
}
const BackButton = ({onBack}: BackButtonProps) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'flex-start',
        paddingTop: 12,
        paddingLeft: 12,
      }}>
      <TouchableOpacity
        testID="carouselBackBtn"
        accessibilityRole="button"
        accessibilityLabel="back"
        accessibilityHint=""
        style={[
          {
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: alpha(colors.waverly1, 0.2),
          },
        ]}
        onPress={onBack}>
        <FontAwesomeIcon
          icon="angle-left"
          style={{color: colors.waverly1} as FontAwesomeIconStyle}
          size={24}
        />
      </TouchableOpacity>
    </View>
  )
}

///////////////////////////////////////////////////////////////////////////////

interface CarouselHeaderProps {
  userProfile: () => JSX.Element
}
const CarouselHeader = ({userProfile}: CarouselHeaderProps) => {
  return (
    <View style={{marginHorizontal: 16, flexDirection: 'row'}}>
      <ContextCarouselTitle />
      <View
        style={{
          flex: 1,
          alignItems: 'flex-end',
        }}>
        {userProfile()}
      </View>
    </View>
  )
}

interface CardCarouselProps {
  groupPost: PostsFeedItemModel
  userProfile: () => JSX.Element
  itemIndex: number
  onSetItemIndex: (index: number) => void
}
const CardCarousel = ({
  groupPost,
  userProfile,
  itemIndex,
  onSetItemIndex,
}: CardCarouselProps) => {
  const HEIGHT_RATIO = 690.0 / 844.0
  const CARD_WIDTH = Dimensions.get('screen').width
  const CARD_HEIGHT = Dimensions.get('screen').height * HEIGHT_RATIO
  const CARD_GAP = -(CARD_WIDTH * 0.31)
  const ITEM_WIDTH = CARD_WIDTH + CARD_GAP

  let fakeCards: PostsFeedItemModel[] = []
  fakeCards.push(groupPost) // Card.
  fakeCards.push(groupPost) // Feed.
  fakeCards.push(groupPost) // Wave.
  fakeCards.push(groupPost) // Author.

  let i = 0
  return (
    <WaverlyScreenPadding>
      <CarouselHeader userProfile={userProfile} />
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        decelerationRate={'fast'}
        // decelerationRate={0}
        snapToInterval={ITEM_WIDTH}
        contentContainerStyle={{gap: CARD_GAP}}
        scrollEventThrottle={100} // Sample scroll events every 100ms.
        onScroll={event =>
          onSetItemIndex(
            Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH),
          )
        }>
        {fakeCards.map(groupPostCard => (
          <View key={i++} style={{width: CARD_WIDTH}}>
            {i === 0 && (
              <CarouselItem_Card
                groupPost={groupPostCard}
                cardHeight={CARD_HEIGHT}
                isSelected={i === itemIndex}
              />
            )}
            {i === 1 && (
              <CarouselItem_Feed
                groupPost={groupPostCard}
                cardHeight={CARD_HEIGHT}
                isSelected={i === itemIndex}
              />
            )}
            {i === 2 && (
              <CarouselItem_Wave
                groupPost={groupPostCard}
                cardHeight={CARD_HEIGHT}
                isSelected={i === itemIndex}
              />
            )}
            {i === 3 && (
              <CarouselItem_Author
                groupPost={groupPostCard}
                cardHeight={CARD_HEIGHT}
                isSelected={i === itemIndex}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </WaverlyScreenPadding>
  )
}

///////////////////////////////////////////////////////////////////////////////

const NullHandleComponent = () => {
  return <></>
}

const ContextCarouselTitle = () => {
  return (
    <View style={styles.titleContainer}>
      <Text
        type="lg-medium"
        style={{
          fontSize: 24,
          letterSpacing: 0,
          fontWeight: '400',
          color: colors.waverly1,
        }}>
        Waverly
      </Text>
    </View>
  )
}

///////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },

  ///////////////////////////////////////////////////////////////////////////
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    // borderRadius: 16,
  },
  ///////////////////////////////////////////////////////////////////////////
  // handle: {
  //   borderTopLeftRadius: 24,
  //   borderTopRightRadius: 24,
  // },
})
