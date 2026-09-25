import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Plural, Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostQuery} from '#/state/queries/post'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import {atoms as a, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>
export const PostQuotesScreen = ({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostQuery(uri)
  const ax = useAnalytics()
  const isSortEnabled = ax.features.enabled(ax.features.QuoteSortEnable)

  const header = (
    <Layout.Header.Outer noBottomBorder={isSortEnabled}>
      <Layout.Header.BackButton />
      <Layout.Header.Content>
        {post && (
          <>
            <Layout.Header.TitleText>
              <Trans>Quotes</Trans>
            </Layout.Header.TitleText>
            <Layout.Header.SubtitleText>
              <Plural
                value={post.quoteCount ?? 0}
                one="# quote"
                other="# quotes"
              />
            </Layout.Header.SubtitleText>
          </>
        )}
      </Layout.Header.Content>
      <Layout.Header.Slot />
    </Layout.Header.Outer>
  )

  if (!isSortEnabled) {
    return (
      <Layout.Screen>
        {header}
        <PostQuotesComponent uri={uri} />
      </Layout.Screen>
    )
  }

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
  const {_} = useLingui()
  const [activeTab, setActiveTab] = useState(0)

  const sections = useMemo(
    () => [
      {
        title: _(msg`Top`),
        component: (
          <PostQuotesComponent uri={uri} sort="top" active={activeTab === 0} />
        ),
      },
      {
        title: _(msg`Latest`),
        component: (
          <PostQuotesComponent
            uri={uri}
            sort="latest"
            active={activeTab === 1}
          />
        ),
      },
    ],
    [_, uri, activeTab],
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
