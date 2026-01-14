import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/core'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useSession} from '#/state/session'
import {DesktopFeeds} from '#/view/shell/desktop/Feeds'
import {DesktopSearch} from '#/view/shell/desktop/Search'
import {SidebarTrendingTopics} from '#/view/shell/desktop/SidebarTrendingTopics'
import {
  atoms as a,
  useGutters,
  useLayoutBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {Text} from '#/components/Typography'
import {SidebarLiveEventFeedsBanner} from '#/features/liveEvents/components/SidebarLiveEventFeedsBanner'

function useWebQueryParams() {
  const navigation = useNavigation()
  const [params, setParams] = useState<Record<string, string>>({})

  useEffect(() => {
    return navigation.addListener('state', e => {
      try {
        const {state} = e.data
        const lastRoute = state.routes[state.routes.length - 1]
        setParams(lastRoute.params)
      } catch (err) {}
    })
  }, [navigation, setParams])

  return params
}

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const kawaii = useKawaiiMode()
  const gutters = useGutters(['base', 0, 'base', 'wide'])
  const isSearchScreen = routeName === 'Search'
  const webqueryParams = useWebQueryParams()
  const searchQuery = webqueryParams?.q
  const showExploreScreenDuplicatedContent =
    !isSearchScreen || (isSearchScreen && !!searchQuery)
  const {rightNavVisible, centerColumnOffset, leftNavMinimal} =
    useLayoutBreakpoints()

  if (!rightNavVisible) {
    return null
  }

  const width = centerColumnOffset ? 250 : 300

  return (
    <View
      style={[
        gutters,
        a.gap_lg,
        a.pr_2xs,
        web({
          position: 'fixed',
          left: '50%',
          transform: [
            {
              translateX: 300 + (centerColumnOffset ? CENTER_COLUMN_OFFSET : 0),
            },
            ...a.scrollbar_offset.transform,
          ],
          /**
           * Compensate for the right padding above (2px) to retain intended width.
           */
          width: width + gutters.paddingLeft + 2,
          maxHeight: '100vh',
        }),
      ]}>
      {!isSearchScreen && <DesktopSearch />}

      {hasSession && (
        <>
          <DesktopFeeds />
          <ProgressGuideList />
        </>
      )}

      {showExploreScreenDuplicatedContent && <SidebarLiveEventFeedsBanner />}
      {showExploreScreenDuplicatedContent && <SidebarTrendingTopics />}

      <Text style={[a.leading_snug, t.atoms.text_contrast_low]}>
        {hasSession && (
          <>
            <InlineLinkText
              to={FEEDBACK_FORM_URL({
                email: currentAccount?.email,
                handle: currentAccount?.handle,
              })}
              style={[t.atoms.text_contrast_medium]}
              label={_(msg`Feedback`)}>
              {_(msg`Feedback`)}
            </InlineLinkText>
            <Text style={[t.atoms.text_contrast_low]}>{' ∙ '}</Text>
          </>
        )}
        <InlineLinkText
          to="https://bsky.social/about/support/privacy-policy"
          style={[t.atoms.text_contrast_medium]}
          label={_(msg`Privacy`)}>
          {_(msg`Privacy`)}
        </InlineLinkText>
        <Text style={[t.atoms.text_contrast_low]}>{' ∙ '}</Text>
        <InlineLinkText
          to="https://bsky.social/about/support/tos"
          style={[t.atoms.text_contrast_medium]}
          label={_(msg`Terms`)}>
          {_(msg`Terms`)}
        </InlineLinkText>
        <Text style={[t.atoms.text_contrast_low]}>{' ∙ '}</Text>
        <InlineLinkText
          label={_(msg`Help`)}
          to={HELP_DESK_URL}
          style={[t.atoms.text_contrast_medium]}>
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

      {!hasSession && leftNavMinimal && (
        <View style={[a.w_full, {height: 32}]}>
          <AppLanguageDropdown />
        </View>
      )}
    </View>
  )
}
