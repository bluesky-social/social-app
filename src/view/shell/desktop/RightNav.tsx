import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useSession} from '#/state/session'
import {DesktopFeeds} from '#/view/shell/desktop/Feeds'
import {DesktopSearch} from '#/view/shell/desktop/Search'
import {atoms as a, useGutters, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import {InlineLinkText} from '#/components/Link'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import * as Prompt from '#/components/Prompt'
import * as Trending from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const kawaii = useKawaiiMode()
  const gutters = useGutters(['base', 0, 'base', 'wide'])
  const isSearchScreen = routeName === 'Search'

  const {isTablet} = useWebMediaQueries()
  if (isTablet) {
    return null
  }

  return (
    <View
      style={[
        gutters,
        a.gap_lg,
        web({
          position: 'fixed',
          left: '50%',
          transform: [
            {
              translateX: 300,
            },
            ...a.scrollbar_offset.transform,
          ],
          width: 300 + gutters.paddingLeft,
          maxHeight: '100%',
          overflowY: 'auto',
        }),
      ]}>
      {!isSearchScreen && <DesktopSearch />}

      {hasSession && (
        <>
          <ProgressGuideList />
          <DesktopFeeds />
          <Divider />
        </>
      )}

      {!isSearchScreen && <TrendingTopics />}

      <Text style={[a.leading_snug, t.atoms.text_contrast_low]}>
        {hasSession && (
          <>
            <InlineLinkText
              to={FEEDBACK_FORM_URL({
                email: currentAccount?.email,
                handle: currentAccount?.handle,
              })}
              label={_(msg`Feedback`)}>
              {_(msg`Feedback`)}
            </InlineLinkText>
            {' • '}
          </>
        )}
        <InlineLinkText
          to="https://bsky.social/about/support/privacy-policy"
          label={_(msg`Privacy`)}>
          {_(msg`Privacy`)}
        </InlineLinkText>
        {' • '}
        <InlineLinkText
          to="https://bsky.social/about/support/tos"
          label={_(msg`Terms`)}>
          {_(msg`Terms`)}
        </InlineLinkText>
        {' • '}
        <InlineLinkText label={_(msg`Help`)} to={HELP_DESK_URL}>
          {_(msg`Help`)}
        </InlineLinkText>
      </Text>

      {kawaii && (
        <Text style={[t.atoms.text_contrast_medium, {marginTop: 12}]}>
          <Trans>
            Logo by{' '}
            <InlineLinkText
              label={_(msg`Logo by @sawaratsuki.bsky.social`)}
              to="/profile/sawaratsuki.bsky.social">
              @sawaratsuki.bsky.social
            </InlineLinkText>
          </Trans>
        </Text>
      )}
    </View>
  )
}

function TrendingTopics() {
  const t = useTheme()
  const {_} = useLingui()
  const trendingPrompt = Prompt.usePromptControl()

  const {trendingSidebarHidden} = useTrendingSettings()
  const {setTrendingSidebarHidden} = useTrendingSettingsApi()

  return trendingSidebarHidden ? null : (
    <>
      <View style={[a.gap_md]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <Graph size="sm" />
          <Text
            style={[
              a.flex_1,
              a.text_sm,
              a.font_bold,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>Trending</Trans>
          </Text>
          <Button
            label={_(msg`Hide trending topics from your sidebar`)}
            size="tiny"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={() => trendingPrompt.open()}>
            <ButtonIcon icon={X} />
          </Button>
        </View>

        <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
          {Trending.TOPICS.slice(0, 8).map(topic => (
            <Trending.Link key={topic} topic={topic}>
              {({hovered}) => (
                <Trending.TopicSmall
                  topic={topic}
                  style={[
                    hovered && [
                      t.atoms.border_contrast_high,
                      t.atoms.bg_contrast_25,
                    ],
                  ]}
                />
              )}
            </Trending.Link>
          ))}
        </View>
      </View>
      <Prompt.Basic
        control={trendingPrompt}
        title={_(msg`Hide trending topics?`)}
        description={_(
          msg`This is a device setting, and will apply to all accounts on this device. You can update this later from your settings.`,
        )}
        confirmButtonCta={_(msg`Hide`)}
        onConfirm={() => setTrendingSidebarHidden(true)}
      />
      <Divider />
    </>
  )
}
