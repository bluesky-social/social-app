import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {
  usePreferencesQuery,
  useSetFeedViewPreferencesMutation,
} from '#/state/queries/preferences'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Layout from '#/components/Layout'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesFollowingFeed'
>
export function FollowingFeedPreferencesScreen({}: Props) {
  const {_} = useLingui()

  const {data: preferences} = usePreferencesQuery()
  const {mutate: setFeedViewPref, variables} =
    useSetFeedViewPreferencesMutation()

  const showReplies = !(
    variables?.hideReplies ?? preferences?.feedViewPrefs?.hideReplies
  )

  const showReposts = !(
    variables?.hideReposts ?? preferences?.feedViewPrefs?.hideReposts
  )

  const showQuotePosts = !(
    variables?.hideQuotePosts ?? preferences?.feedViewPrefs?.hideQuotePosts
  )

  const mergeFeedEnabled = Boolean(
    variables?.lab_mergeFeedEnabled ??
      preferences?.feedViewPrefs?.lab_mergeFeedEnabled,
  )

  return (
    <Layout.Screen testID="followingFeedPreferencesScreen">
      <Layout.Header title={_(msg`Following Feed Preferences`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Admonition type="tip" style={[a.flex_1]}>
              <Trans>These settings only apply to the Following feed.</Trans>
            </Admonition>
          </SettingsList.Item>
          <Toggle.Item
            type="checkbox"
            name="show-replies"
            label={_(msg`Show replies`)}
            value={showReplies}
            onChange={value =>
              setFeedViewPref({
                hideReplies: !value,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={BubblesIcon} />
              <SettingsList.ItemText>
                <Trans>Show replies</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <Toggle.Item
            type="checkbox"
            name="show-reposts"
            label={_(msg`Show reposts`)}
            value={showReposts}
            onChange={value =>
              setFeedViewPref({
                hideReposts: !value,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={RepostIcon} />
              <SettingsList.ItemText>
                <Trans>Show reposts</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <Toggle.Item
            type="checkbox"
            name="show-quotes"
            label={_(msg`Show quote posts`)}
            value={showQuotePosts}
            onChange={value =>
              setFeedViewPref({
                hideQuotePosts: !value,
              })
            }>
            <SettingsList.Item>
              <SettingsList.ItemIcon icon={QuoteIcon} />
              <SettingsList.ItemText>
                <Trans>Show quote posts</Trans>
              </SettingsList.ItemText>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>
          <SettingsList.Divider />
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <SettingsList.ItemText>
              <Trans>Experimental</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              type="checkbox"
              name="merge-feed"
              label={_(
                msg`Show samples of your saved feeds in your Following feed`,
              )}
              value={mergeFeedEnabled}
              onChange={value =>
                setFeedViewPref({
                  lab_mergeFeedEnabled: value,
                })
              }
              style={[a.w_full, a.gap_md]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  Show samples of your saved feeds in your Following feed
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
