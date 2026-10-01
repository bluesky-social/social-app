import {useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostQuery} from '#/state/queries/post'
import {type QuotesSort} from '#/state/queries/post-quotes'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import {atoms as a, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {AnalyticsContext, useAnalytics, utils} from '#/analytics'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>
export const PostQuotesScreen = ({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostQuery(uri)

  const header = (
    <Layout.Header.Outer noBottomBorder>
      <Layout.Header.BackButton />
      <Layout.Header.Content>
        <Layout.Header.TitleText>
          <Trans>Quotes</Trans>
        </Layout.Header.TitleText>
        {post && (
          <Layout.Header.SubtitleText>
            <Plural
              value={post.quoteCount ?? 0}
              one="# quote"
              other="# quotes"
            />
          </Layout.Header.SubtitleText>
        )}
      </Layout.Header.Content>
      <Layout.Header.Slot />
    </Layout.Header.Outer>
  )

  return (
    <Layout.Screen>
      <SortedPostQuotes uri={uri} header={header} />
    </Layout.Screen>
  )
}

/**
 * Top / Latest tabs, following the hashtag screen. Each tab only fetches once
 * it has been selected.
 */
function SortedPostQuotes({
  uri,
  header,
}: {
  uri: string
  header: React.ReactNode
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const [activeTab, setActiveTab] = useState(0)

  const trackTabView = useNonReactiveCallback(() => {
    ax.metric('post:quotes:view', {
      uri,
      quoteSort: activeTab === 0 ? 'top' : 'latest',
    })
  })
  useEffect(() => {
    trackTabView()
  }, [activeTab, trackTabView, uri])

  const sections = useMemo(
    () => [
      {
        title: l`Top`,
        component: (
          <PostQuotesTab uri={uri} quoteSort="top" active={activeTab === 0} />
        ),
      },
      {
        title: l`Latest`,
        component: (
          <PostQuotesTab
            uri={uri}
            quoteSort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ],
    [l, uri, activeTab],
  )

  return (
    <Pager
      onPageSelected={setActiveTab}
      renderTabBar={props => (
        <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
          {header}
          <TabBar items={sections.map(section => section.title)} {...props} />
        </Layout.Center>
      )}
      initialPage={0}>
      {sections.map((section, i) => (
        <View key={i}>{section.component}</View>
      ))}
    </Pager>
  )
}

function PostQuotesTab({
  uri,
  quoteSort,
  active,
}: {
  uri: string
  quoteSort: QuotesSort
  active: boolean
}) {
  const metadata = utils.useMeta({postQuotes: {uri, quoteSort}})

  return (
    <AnalyticsContext metadata={metadata}>
      <PostQuotesComponent uri={uri} quoteSort={quoteSort} active={active} />
    </AnalyticsContext>
  )
}
