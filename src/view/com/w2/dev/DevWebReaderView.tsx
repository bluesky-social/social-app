import React, {useCallback, useEffect, useState} from 'react'

import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import {
  WebReaderView,
  WebReaderViewCheckpoint,
} from '../web-reader/WebReaderView'
import {StackedView} from '../util/StackedView'
import {WebHtmlView} from '../web-reader/WebHtmlView'
import {
  extractReadableDocFromHTML,
  extractReadableDocFromUrl,
} from '../reader/ExtractReadableDoc'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../../util/text/Text'
import {DomViewer} from './DevDomViewer'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {DraggableFab} from '../web-reader/DraggableFab'
import {useStores} from 'state/index'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'

const GROUP = 'betterweb.group'

type Option = 'reader' | 'checkpoint' | 'html' | 'dom'

export const DevWebReaderView = () => {
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const [currUrl, setCurrUrl] = useState<string | undefined>()
  const [currOption, setCurrOption] = useState<Option>('reader')
  const [dom, setDom] = useState<Document | undefined>()
  const [quote, setQuote] = useState<string | undefined>()
  const [articleBody, setArticleBody] = useState<string | undefined>()

  // WordDJ setup
  const store = useStores()
  const wordDjModel = store.wordDJModel

  useEffect(() => {
    if (currUrl === undefined) {
      setDom(undefined)
      return
    }
    let mounted = true
    extractReadableDocFromUrl(currUrl).then(document => {
      if (!mounted) return
      if (document) setDom(document)
    })
    return () => {
      mounted = false
    }
  }, [currUrl])
  useEffect(() => {
    if (dom) store.shell.showFab()
    else store.shell.hideFab()
  }, [dom, store.shell])

  useFocusEffect(
    useCallback(() => {
      const cleanup = () => {
        store.shell.showFab()
      }
      store.shell.setMinimalShellMode(true)
      store.shell.hideFab()
      // store.shell.setFabUseCustomCallbacks(onFabMoved, onFabReleased)
      store.shell.setFabMode('create', 'round')
      store.wordDJModel.clear()
      return cleanup
    }, [store.shell, store.wordDJModel]),
  )

  useEffect(() => {
    if (!quote) return
    if (!articleBody) return
    wordDjModel.clear()
    wordDjModel.setArticlePayload(articleBody)
    wordDjModel.setQuotePayload(quote)
    wordDjModel.createBlock('""' + quote)
    navigation.popToTop()
    navigation.navigate('WordDJScreen')
  }, [articleBody, navigation, quote, wordDjModel])

  const onQuoteChosen = useCallback(
    (q: string | undefined) => {
      setQuote(q)
    },
    [setQuote],
  )
  const onArticleChosen = useCallback(
    (q: string | undefined) => {
      setArticleBody(q)
    },
    [setArticleBody],
  )

  // Resets wordDJ-related state while preserving reader state (article and scrollpos)
  // const resetWordDj = useCallback(() => {
  //   setQuote('')
  //   setArticleBody('')
  //   setWordDjModel(new WordDjModel(store, undefined))
  // }, [setQuote, setArticleBody, setWordDjModel, store])

  const onDocumentLoaded = useCallback(
    (url: string, html: string) => {
      // Use the full HTML if the raw one didn't work
      if (dom === undefined) {
        console.log('Using DOM from WebHtmlView')
        // Huge tolerance here, we want everything
        const documentFromHtml = extractReadableDocFromHTML(
          `<html>${html}</html>`,
          url,
          10000,
        )
        if (documentFromHtml) setDom(documentFromHtml)
      }
    },
    [dom],
  )

  return (
    <View style={[s.flex1, s.w100pct, pal.view]}>
      <View style={[s.flex1, s.w100pct]}>
        {currUrl ? (
          <WebViews
            selection={currOption}
            currUrl={currUrl}
            dom={dom}
            onDocumentLoaded={onDocumentLoaded}
            onQuoteChosen={onQuoteChosen}
            onArticleChosen={onArticleChosen}
          />
        ) : (
          <UrlPicker setCurrUrl={setCurrUrl} />
        )}
      </View>
      <BottomBar
        url={currUrl}
        setUrl={setCurrUrl}
        option={currOption}
        setOption={setCurrOption}
      />
    </View>
  )
}

interface UrlPickerProps {
  setCurrUrl: (url: string) => void
}

const UrlPicker = ({setCurrUrl}: UrlPickerProps) => {
  const pal = usePalette('default')

  const [customUrl, setCustomUrl] = useState<string | undefined>()
  const onUseCustomUrl = useCallback(() => {
    customUrl && setCurrUrl(customUrl)
  }, [customUrl, setCurrUrl])

  return (
    <ScrollView>
      <View style={[s.alignCenter, s.flex1]}>
        <View style={styles.urlInputContainer}>
          <TextInput
            accessibilityLabel="Url"
            accessibilityHint="Url"
            autoComplete="off"
            keyboardType="url"
            returnKeyType="go"
            placeholder="Custom URL"
            onChangeText={setCustomUrl}
            onSubmitEditing={onUseCustomUrl}
            style={[styles.textInput, pal.border, pal.text]}
          />
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.goButton, pal.viewInvertedLight]}
            onPress={onUseCustomUrl}>
            <Text style={pal.textInverted}>Go</Text>
          </TouchableOpacity>
        </View>
        {URLS.map((url: string, index: number) => (
          <Text
            key={index}
            style={[pal.text, s.blue3]}
            onPress={() => setCurrUrl(url)}>
            {getDomain(url)}
          </Text>
        ))}
      </View>
    </ScrollView>
  )
}

interface BottomBarProps {
  url?: string
  setUrl: (url?: string) => void
  option: Option
  setOption: (option: Option) => void
}

const BottomBar = ({url, setUrl, option, setOption}: BottomBarProps) => {
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    if (url === undefined) setShowMore(false)
  }, [url])

  const openInBrowser = useCallback(() => {
    if (url) Linking.openURL(url)
  }, [url])

  const openUrlReader = useCallback(() => {
    if (url) {
      navigation.navigate('UrlReaderView', {
        name: GROUP,
        uri: encodeURIComponent(url),
      })
    }
  }, [navigation, url])

  return (
    <View style={[styles.bottomBar, s.w100pct, pal.viewLight]}>
      {url && (
        <>
          <BottomButton
            text="<"
            style={[s.pl20, s.pr20]}
            onPress={() => setUrl(undefined)}
          />
          {showMore ? (
            <>
              <BottomButton
                text="Browser"
                style={styles.button}
                onPress={openInBrowser}
              />
              <BottomButton
                text="URL Reader"
                style={styles.button}
                onPress={openUrlReader}
              />
            </>
          ) : (
            OPTIONS.map(v => (
              <BottomButton
                key={v.option}
                text={v.text}
                isSelected={option === v.option}
                style={styles.button}
                onPress={() => setOption(v.option)}
              />
            ))
          )}
          <BottomButton
            text={showMore ? 'Back' : 'More'}
            style={styles.button}
            onPress={() => setShowMore(curr => !curr)}
          />
        </>
      )}
    </View>
  )
}

interface BottomButtonProps {
  text: string
  style?: StyleProp<ViewStyle>
  isSelected?: boolean
  onPress: () => void
}

const BottomButton = ({
  text,
  style,
  isSelected,
  onPress,
}: BottomButtonProps) => {
  const pal = usePalette('default')
  return (
    <TouchableOpacity
      containerStyle={[style, isSelected && pal.viewInverted]}
      accessibilityRole="button"
      onPress={onPress}>
      <Text
        type="sm"
        style={[s.textCenter, isSelected ? pal.textInverted : pal.text]}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

interface WebViewsProps {
  selection: Option
  currUrl: string
  dom?: Document
  onDocumentLoaded: (url: string, html: string) => void
  onQuoteChosen: (quote: string) => void
  onArticleChosen: (article: string) => void
}

const WebViews = ({
  selection,
  currUrl,
  dom,
  onDocumentLoaded,
  onQuoteChosen,
  onArticleChosen,
}: WebViewsProps) => {
  const store = useStores()
  const [scrollY, setScrollY] = useState(0)
  const [pointer, setPointer] = useState<{x: number; y: number} | undefined>()
  const [selectedQuote, setSelectedQuote] = useState<string>('')
  const [articleBody, setArticleBody] = useState<string>('')
  const [fabWasReleased, setFabWasReleased] = useState<boolean>(false)

  const onScrollReader = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollY(e.nativeEvent.contentOffset.y)
    },
    [],
  )

  const onQuoteChanged = useCallback(
    (newQuoteAsWords: string[] | undefined) => {
      const newQuote = newQuoteAsWords ? newQuoteAsWords.join('') : ''
      setSelectedQuote(newQuote)
    },
    [setSelectedQuote],
  )
  const onTextChanged = useCallback(
    (newTextAsWords: string[][] | undefined) => {
      let newArticleBody = ''
      if (newTextAsWords) {
        for (let i = 0; i < newTextAsWords.length; ++i)
          newArticleBody += newTextAsWords[i].join('')
      }
      setArticleBody(newArticleBody)
    },
    [setArticleBody],
  )

  const onFabMoved = useCallback(
    (x: number, y: number) => {
      setPointer({x, y})
    },
    [setPointer],
  )
  const onFabReleased = useCallback(() => {
    setFabWasReleased(true)
  }, [setFabWasReleased])

  useFocusEffect(
    useCallback(() => {
      store.shell.setFabUseCustomCallbacks(onFabMoved, onFabReleased)
      return () => {
        store.shell.setFabUseDefaultCallbacks()
      }
    }, [onFabMoved, onFabReleased, store.shell]),
  )
  useEffect(() => {
    if (fabWasReleased) {
      onQuoteChosen(selectedQuote)
      onArticleChosen(articleBody)
      setFabWasReleased(false)
    }
  }, [
    fabWasReleased,
    setFabWasReleased,
    selectedQuote,
    onQuoteChosen,
    articleBody,
    onArticleChosen,
  ])

  return (
    <StackedView<Option> selection={selection} style={[s.flex1, s.w100pct]}>
      <View key="reader" style={styles.scroll}>
        <ScrollView
          style={styles.scroll}
          onScroll={onScrollReader}
          scrollEventThrottle={64}>
          <WebReaderView
            document={dom}
            scrollY={scrollY}
            pointer={pointer}
            onScrollTo={(y: number) => console.log(`Scroll to ${y}`)}
            onQuoteChanged={onQuoteChanged}
            onTextChanged={onTextChanged}
            containerStyle={[s.w100pct]}
          />
        </ScrollView>
        <DraggableFab
          fabMode={'plus'}
          isFabMovable={true}
          onPressed={() => {}}
          onReleased={onFabReleased}
          setPos={setPointer}
        />
      </View>
      <ScrollView key="checkpoint" style={styles.scroll}>
        <WebReaderViewCheckpoint
          document={dom}
          onScrollTo={(y: number) => console.log(`Scroll to ${y}`)}
          containerStyle={[s.w100pct]}
        />
      </ScrollView>
      <ScrollView key="html" style={styles.scroll}>
        <WebHtmlView
          url={currUrl}
          onDocumentLoaded={onDocumentLoaded}
          containerStyle={[s.w100pct]}
        />
      </ScrollView>
      <DomViewer key="dom" dom={dom} style={[s.flex1, s.w100pct]} />
    </StackedView>
  )
}

const getDomain = (url: string) => {
  return new URL(url).hostname
}

const URLS = [
  'https://towardsdatascience.com/5-books-to-grow-as-a-leader-in-data-analytics-e16b31a5925a',
  'https://www.bikeradar.com/news/rapha-trail-knee-pads/',
  'https://www.visualcapitalist.com/visualizing-the-evolution-of-the-global-meat-market/',
  'https://greatergood.berkeley.edu/article/item/seven_ways_to_make_cities_better_for_mental_health',
  'https://hackernoon.com/how-to-manage-your-privacy-online',
  'https://medium.com/@yoniweisbrod/interacting-with-apis-using-react-native-fetch-9733f28566bb',
  'https://terrytao.wordpress.com/2021/12/06/the-structure-of-arbitrary-conze-lesigne-systems/',
  'https://towardsdatascience.com/explainable-ai-xai-methods-part-1-partial-dependence-plot-pdp-349441901a3d?gi=150cefa737b',
  'https://www.pwc.com/gx/en/services/sustainability/publications/state-of-climate-tech.html',
  'https://stratechery.com/2021/the-great-bifurcation/',
  'https://www.lapresse.ca/cinema/2021-12-20/fermeture-des-cinemas/comme-un-coup-de-massue.php',
  'https://philbeaudoin.com/2021/06/05/dear-troll-and-3-other-stories/',
  'https://philbeaudoin.com/2021/06/27/healthy-social-media-secrets-of-pascals-triangle-and-venus-tectonics/',
  'https://www.forbes.com/sites/luisromero/2021/12/18/the-universal-solution-to-every-problem-already-exists/',
  'https://www.nytimes.com/2021/12/16/opinion/factory-farming-animals.html',
  'https://medium.com/@gwkj1/analysing-the-fia-rulebook-after-the-abu-dhabi-grand-prix-a-lawyers-perspective-571ca3810060',
  'https://andrewzimmern.substack.com/p/recipe-of-the-week',
  'https://www.somethinginteresting.news/p/corporate-america-discovers-nfts',
  'https://apricitas.substack.com/p/industrial-america-is-fighting-back',
  'https://www.vice.com/en/article/qj4kab/activists-cover-statue-of-canadas-first-prime-minister-in-paint-call-for-its-removal',
  'https://www.gmpuzzles.com/blog/2021/12/sudoku-by-r-kumaresan-4/',
  'https://www.nytimes.com/interactive/2021/12/23/us/omicron-case-count.html',
  'https://www.newyorker.com/humor/daily-shouts/all-i-want-for-christmas-is-you-and-five-other-things-im-sick-of-hearing',
  'https://www.angelinvestmentnetwork.net/tips-from-the-top-transitioning-from-founder-to-leader-how-to-be-the-one-in-five/',
  'https://gizmodo.com/surreal-deep-sea-discoveries-include-glitter-worms-and-1848083073',
  'https://steveblank.com/2021/12/14/i-cant-see-you-but-im-not-blind/',
  'https://spencerauthor.com/learning-loss/',
  'https://thewholestory.solutionsjournalism.org/how-competing-new-hampshire-news-outlets-started-and-stayed-working-together-36f0f98b2f08',
  'https://bas.codes/posts/yaml-lisp-number-guessing',
  'http://www.lkozma.net/game.html',
  'https://www.nytimes.com/2022/01/26/business/the-federal-reserve-could-offer-hints-about-the-outlook-for-interest-rates.html',
  'https://www.newyorker.com/magazine/2011/05/16/creation-myth',
]

const OPTIONS: {option: Option; text: string}[] = [
  {option: 'reader', text: 'Reader'},
  {option: 'checkpoint', text: 'Checkpt'},
  {option: 'html', text: 'Html'},
  {option: 'dom', text: 'DOM'},
]

const styles = StyleSheet.create({
  scroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 5,
    gap: 2,
  },
  button: {
    flex: 1,
    padding: 2,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  urlInputContainer: {
    alignItems: 'stretch',
    paddingHorizontal: 30,
    paddingBottom: 10,
    flexDirection: 'row',
    width: '100%',
    gap: 5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goButton: {
    alignContent: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
})
