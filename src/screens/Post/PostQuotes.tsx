import {useState} from 'react'
import {Plural, Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {usePostQuery} from '#/state/queries/post'
import {type QuotesSort} from '#/state/queries/post-quotes'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import {PostQuotesSortDropdown} from '#/view/com/post-thread/PostQuotesSortDropdown'
import * as Layout from '#/components/Layout'
import {useAnalytics} from '#/analytics'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>
export const PostQuotesScreen = ({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {data: post} = usePostQuery(uri)
  const ax = useAnalytics()
  const isSortEnabled = ax.features.enabled(ax.features.QuoteSortEnable)
  const [sort, setSort] = useState<QuotesSort>('latest')

  let quoteCount
  if (post) {
    quoteCount = post.quoteCount
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          {post && (
            <>
              <Layout.Header.TitleText>
                <Trans>Quotes</Trans>
              </Layout.Header.TitleText>
              <Layout.Header.SubtitleText>
                <Plural
                  value={quoteCount ?? 0}
                  one="# quote"
                  other="# quotes"
                />
              </Layout.Header.SubtitleText>
            </>
          )}
        </Layout.Header.Content>
        <Layout.Header.Slot>
          {isSortEnabled && (
            <PostQuotesSortDropdown sort={sort} setSort={setSort} />
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      <PostQuotesComponent uri={uri} sort={sort} />
    </Layout.Screen>
  )
}
