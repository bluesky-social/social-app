import React, {useCallback} from 'react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {View, StyleSheet, Alert} from 'react-native'
import {ThemeProvider} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Text} from '../../com/util/text/Text'
import {Link} from 'view/com/util/Link'
//import {DevUniversalChat} from 'view/com/dev/DevUniversalChat'
import {observer} from 'mobx-react-lite'
//import {WingmanChat} from '../WingmanChat'
import {DevCardBrowser} from 'view/com/w2/dev/DevCardBrowser'
import {DevCardTester} from 'view/com/w2/dev/DevCardTester'
import {DevComposeWaverlyBlog} from 'view/com/w2/dev/DevComposeWaverlyBlog'
import {DevDemoFeed} from 'view/com/w2/dev/DevDemoFeed'
import {DevWordDj} from 'view/com/w2/dev/DevWordDj'
import {useStores} from 'state/index'
import {DevGroupBot} from 'view/com/w2/dev/DevGroupBot'
import {DevWipeData} from 'view/com/w2/dev/DevWipeData'
import {DevWebReaderView} from 'view/com/w2/dev/DevWebReaderView'
import {LOCAL_ALLOWED} from 'state/models/waverly-agent/waverly-agent'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {useFocusEffect} from '@react-navigation/native'
import {WaverlyScreenPadding} from 'view/com/w2/WaverlyScreenPadding'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DevScreen'>
export const DevScreen = withAuthRequired(
  observer<Props>(function DevScreen({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const [currentPage, setCurrentPage] = React.useState<string>(DEFAULT_PAGE)

    const wipePosts = useCallback(async () => {
      try {
        store.me.waverlyFeed.setGroupToHide('')
        const didRes = await store.agent.resolveHandle({
          handle: 'aiglamsquad.group',
        })
        await store.waverlyAgent.api.wipePostsFromGroup({
          groupDid: didRes.data.did,
        })
        await store.me.waverlyFeed.refresh()
      } catch (err: any) {
        store.log.error(`Error in wipePosts`, err.toString())
      }
    }, [store.agent, store.log, store.me.waverlyFeed, store.waverlyAgent.api])

    const onWipeDemoPostsPress = useCallback(() => {
      Alert.alert(
        'Are you sure?',
        `This action will delete phil.test's post in aimagiceveryday.group`,
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Proceed', onPress: wipePosts, style: 'default'},
        ],
      )
    }, [wipePosts])

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(true)
      }, [store]),
    )

    const onPagePress = (page: string) => {
      setCurrentPage(page)
    }

    const loggedIn = store.session.hasSession && store.session.currentSession

    const user = loggedIn
      ? store.session.currentSession!.handle
      : '[logged out]'
    let service = loggedIn ? store.agent.service.hostname.toString() : 'N/A'
    service = service.replace(/^(https?|ftp):\/\//i, '')
    const currBackend = store.waverlyAgent.endpoint

    const renderPage = () => {
      const Page = PAGES[currentPage]
      if (Page) return <Page onClose={() => onPagePress(DEFAULT_PAGE)} />
      return (
        <View style={[s.hContentRegion]} testID="devScreen">
          <ViewHeader title="Dev" showOnDesktop />
          <View style={styles.pages}>
            <View style={[s.flex1, s.g10]}>
              <ListPages onPagePress={onPagePress} />
            </View>
            <View style={s.g5}>
              <Text style={[pal.text]}>User: {user}</Text>
              <Text style={pal.text}>Service: {service}</Text>
              <View style={[s.flexRow, s.g10]}>
                <Text style={pal.text}>w2-server:</Text>
                <Text
                  style={[
                    currBackend === 'local' && styles.underline,
                    !LOCAL_ALLOWED && styles.strikethrough,
                    pal.text,
                  ]}
                  onPress={() => store.waverlyAgent.setEndpoint('local')}>
                  local
                </Text>
                <Text
                  style={[currBackend === 'test' && styles.underline, pal.text]}
                  onPress={() => store.waverlyAgent.setEndpoint('test')}>
                  test
                </Text>
              </View>
              <View style={[s.p10]} />
              <View style={[s.flexRow, s.g5, s.alignCenter]}>
                <Text style={pal.text}>Phil's Demo Posts:</Text>
                <Text
                  style={[styles.underline, pal.text]}
                  onPress={onWipeDemoPostsPress}>
                  Wipe it!
                </Text>
              </View>
            </View>
          </View>
        </View>
      )
    }

    return (
      <WaverlyScreenPadding>
        <ThemeProvider theme={'system'}>
          <CenteredView style={[s.hContentRegion, pal.view]}>
            <View style={s.flex1}>
              <View style={styles.height86}>{renderPage()}</View>
              {currentPage !== DEFAULT_PAGE && (
                <Link onPress={() => onPagePress(DEFAULT_PAGE)}>
                  <Text style={[s.pl10, pal.link]}>Back to Dev Screen</Text>
                </Link>
              )}
            </View>
          </CenteredView>
        </ThemeProvider>
      </WaverlyScreenPadding>
    )
  }),
)

function ListPages({onPagePress}: {onPagePress: (page: string) => void}) {
  const pal = usePalette('default')

  return (
    <>
      {/* <ViewHeader title="Dev" showOnDesktop={true} /> */}
      <Text style={pal.text}>Dev components:</Text>
      {Object.keys(PAGES).map(page => (
        <Link onPress={() => onPagePress(page)} key={page}>
          <Text style={pal.link}>{page}</Text>
        </Link>
      ))}
    </>
  )
}

const DEFAULT_PAGE = 'Default'

interface OnCloseProps {
  onClose?: () => void
}

type renderPage = ({onClose}: OnCloseProps) => JSX.Element

const PAGES: {[page: string]: renderPage} = {
  // UniversalChatBar: () => <DevUniversalChat />,
  CardTester: () => <DevCardTester />,
  // WingmanChat: () => <WingmanChat />,
  CardBrowser: () => <DevCardBrowser />,
  WordDJ: () => <DevWordDj />,
  CreatePost: () => <DevComposeWaverlyBlog />,
  AddGroup: () => <DevGroupBot />,
  ReaderView: () => <DevWebReaderView />,
  DemoFeed: () => <DevDemoFeed />,
  WipeStuff: () => <DevWipeData />,
}

const styles = StyleSheet.create({
  pages: {
    paddingHorizontal: 16,
    paddingBottom: 50,
    gap: 10,
    flex: 1,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  height86: {
    height: '81.5%',
  },
})
