import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {type FeedDescriptor} from '#/state/queries/post-feed'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsGear} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {selectSources} from '../sources'
import {type NewsFeedPrefs} from '../state/prefs'

export function NewsFeedTab({
  prefs,
  onEdit,
}: {
  prefs: NewsFeedPrefs
  onEdit: () => void
}) {
  const {t: l} = useLingui()

  const dids = selectSources({
    topics: prefs.topics,
    regions: prefs.regions,
    excludedDids: prefs.excludedDids,
  }).map(source => source.did)
  const feed = `newsfeed|${dids.join(',')}` as FeedDescriptor

  return (
    <Layout.Screen testID="newsFeedScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>News</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <Button
            testID="newsFeedEditBtn"
            label={l`Customize news feed`}
            size="small"
            color="secondary"
            shape="round"
            onPress={onEdit}>
            <ButtonIcon icon={SettingsGear} size="md" />
          </Button>
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {dids.length === 0 ? (
        <NoSources onEdit={onEdit} />
      ) : (
        <PostFeed
          testID="newsFeed"
          feed={feed}
          renderEmptyState={renderEmpty}
        />
      )}
    </Layout.Screen>
  )
}

function renderEmpty() {
  return (
    <View style={[a.flex_1, a.align_center, a.justify_center, a.p_2xl]}>
      <Text style={[a.text_md, a.text_center]}>
        <Trans>No recent posts from your news sources.</Trans>
      </Text>
    </View>
  )
}

function NoSources({onEdit}: {onEdit: () => void}) {
  const t = useTheme()
  const {t: l} = useLingui()
  return (
    <Layout.Center
      style={[a.flex_1, a.align_center, a.justify_center, a.p_2xl, a.gap_lg]}>
      <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
        <Trans>None of your news sources match the topics you picked.</Trans>
      </Text>
      <Button
        label={l`Customize news feed`}
        size="small"
        color="secondary"
        onPress={onEdit}>
        <ButtonText>
          <Trans>Adjust topics</Trans>
        </ButtonText>
      </Button>
    </Layout.Center>
  )
}
