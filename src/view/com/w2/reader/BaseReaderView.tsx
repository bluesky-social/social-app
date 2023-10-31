import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {DotDotDotIcon, ShareIcon} from 'lib/icons-w2'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {Text} from '../../util/text/Text'
import {WebHtmlView} from '../web-reader/WebHtmlView'
import {
  extractReadableDocFromHTML,
  extractReadableDocFromUrl,
} from './ExtractReadableDoc'
import {ReaderMode, ReaderState, ReaderToggle} from './ReaderToggle'
import {StackedView} from '../util/StackedView'
import {s} from 'lib/styles'
import {WebReaderView} from '../web-reader/WebReaderView'
import {ReaderHeader} from './ReaderHeader'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useStores} from 'state/index'
import {GroupSearchItem} from 'w2-api/waverly_sdk'
import {useExternalLinkFetch} from 'view/com/composer/useExternalLinkFetch'
import {WaverlyScreenPadding} from '../WaverlyScreenPadding'
import {NavigationProp} from 'lib/routes/types'

// We are more tolerant on the minimum length of documents extracted from the
// full HTML
const FULL_HTML_TOLERANCE = 2

const BUTTONS_WIDTH = 70

type Props = {
  link?: EmbedInfo['link']
  groupDid?: string
  groupHandle?: string
}

export const BaseReaderView = ({link, groupDid, groupHandle}: Props) => {
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  const [mode, setMode] = useState<ReaderMode>('html')
  const [state, setState] = useState<ReaderState>(link ? 'loading' : 'error')
  const [dom, setDom] = useState<Document | undefined>()
  const [quote, setQuote] = useState<string | undefined>()
  const [articleBody, setArticleBody] = useState<string | undefined>()
  const {extLink, setExtLink} = useExternalLinkFetch({setQuote: () => {}})
  const wordDjModel = store.wordDJModel

  useFocusEffect(
    useCallback(() => {
      store.shell.setMinimalShellMode(true)
      // Reset WordDJ.
      store.wordDJModel.clear()
      store.wordDJModel.setGroup({
        did: groupDid,
        handle: groupHandle,
      } as GroupSearchItem)
    }, [groupDid, groupHandle, store.shell, store.wordDJModel]),
  )

  useEffect(() => {
    if (!link) {
      setState('error')
      return
    } else setState(curr => (curr === 'error' ? 'loading' : curr))

    let mounted = true
    setExtLink({uri: link.originalUri, isLoading: true})
    extractReadableDocFromUrl(link.originalUri).then(document => {
      if (!mounted) return
      if (document) {
        setMode('reader')
        setState('reader_available')
        setDom(document)
      }
    })
    return () => {
      mounted = false
    }
  }, [link, link?.originalUri, setExtLink])

  useEffect(() => {
    if (extLink?.isLoading === true || !extLink?.meta) return
    wordDjModel.setExtEmbed(extLink)
  }, [extLink, wordDjModel])

  useEffect(() => {
    if (!quote) return
    if (!articleBody) return
    if (wordDjModel.blocks.length === 0) {
      wordDjModel.setArticlePayload(articleBody)
      wordDjModel.setQuotePayload(quote)
      wordDjModel.createBlock('""' + quote)
      navigation.navigate('WordDJScreen')
    }
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

  // This is called when the HTML view has completely loaded its HTML.
  // If we were not able to extract a reader view from the raw HTML of the page,
  // we try again using the HTML of full HTML view. This takes more time, but
  // sometimes work better when the website creates some content using JS calls.
  const onDocumentLoaded = useCallback(
    (url: string, html: string) => {
      // Use the full HTML if the raw one didn't work
      if (dom === undefined) {
        // Huge tolerance here, we want everything
        const document = extractReadableDocFromHTML(
          `<html>${html}</html>`,
          url,
          FULL_HTML_TOLERANCE,
        )
        if (document) {
          setMode('reader')
          setState('reader_available')
          setDom(document)
        } else {
          setMode('html')
          setState('reader_unavailable')
        }
      }
    },
    [dom],
  )

  const toggleButton = useCallback(
    () => (
      <ReaderToggle
        state="reader_available"
        mode={mode}
        onChangeMode={setMode}
      />
    ),
    [mode],
  )

  const selection: Selection = useMemo(
    () => (state === 'loading' || state === 'error' ? state : mode),
    [mode, state],
  )

  return (
    <WaverlyScreenPadding>
      <ViewHeader
        showOnDesktop={true}
        buttonWidth={BUTTONS_WIDTH}
        renderTitle={toggleButton}
        renderButton={() => <HeaderButtons />}
      />
      <WebViews
        link={link}
        dom={dom}
        selection={selection}
        onDocumentLoaded={onDocumentLoaded}
        onQuoteChosen={onQuoteChosen}
        onArticleChosen={onArticleChosen}
      />
    </WaverlyScreenPadding>
  )
}

const HeaderButtons = () => {
  const pal = usePalette('default')

  return (
    <View style={styles.headerButtons}>
      <TouchableOpacity accessibilityRole="button" style={styles.button}>
        <ShareIcon size={24} style={[pal.text]} />
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.button}>
        <DotDotDotIcon size={24} style={pal.text} />
      </TouchableOpacity>
    </View>
  )
}

type Selection = ReaderMode | 'loading' | 'error'

interface WebViewsProps {
  selection: Selection
  link: EmbedInfo['link']
  dom?: Document
  onDocumentLoaded: (url: string, html: string) => void
  onQuoteChosen: (quote: string) => void
  onArticleChosen: (article: string) => void
}

const WebViews = ({
  selection,
  link,
  dom,
  onDocumentLoaded,
  onQuoteChosen,
  onArticleChosen,
}: WebViewsProps) => {
  const store = useStores()
  const pal = usePalette('default')
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
      store.shell.setFabMode('create', 'round')
      //store.shell.disableFab() // Disable FAB until content is ready.
    }, [onFabMoved, onFabReleased, store.shell]),
  )
  // When content is ready, enable the FAB.
  // const onContentReady = useCallback(() => {
  //   store.shell.showFab()
  // }, [store.shell])

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
    <StackedView<Selection> selection={selection} style={[s.flex1, s.w100pct]}>
      <View key="reader" style={styles.scroll}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.readerBottomPadding}
          onScroll={onScrollReader}
          scrollEventThrottle={64}>
          <ReaderHeader title={link?.title ?? ''} host={link?.host ?? ''} />
          <WebReaderView
            document={dom}
            scrollY={scrollY}
            pointer={pointer}
            onScrollTo={(y: number) => console.log(`Scroll to ${y}`)}
            onContentReady={() => {}} //onContentReady}
            onQuoteChanged={onQuoteChanged}
            onTextChanged={onTextChanged}
            containerStyle={[s.w100pct]}
          />
        </ScrollView>
      </View>
      <ScrollView key="html" style={styles.scroll}>
        <WebHtmlView
          url={link?.originalUri ?? ''}
          onDocumentLoaded={onDocumentLoaded}
          containerStyle={[s.w100pct]}
        />
      </ScrollView>
      <View key="loading" style={[s.flex1, s.w100pct, pal.view]} />
      <View key="error" style={[s.flex1, s.w100pct, s.alignCenter, pal.view]}>
        <Text style={pal.text}>Error, post has no link.</Text>
      </View>
    </StackedView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 200,
    gap: 16,
    alignItems: 'stretch',
  },
  hMargins: {
    marginHorizontal: 16,
  },
  paragraphs: {
    gap: 28,
  },
  headerButtons: {
    width: BUTTONS_WIDTH,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 24,
    heigh: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  readerBottomPadding: {
    paddingBottom: 100,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
