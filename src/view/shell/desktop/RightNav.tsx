import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/core'

import {HELP_DESK_URL} from '#/lib/constants'
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
import {Divider} from '#/components/Divider'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {Text} from '#/components/Typography'

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
  const {hasSession} = useSession()
  const gutters = useGutters(['base', 0, 'base', 'wide'])
  const isSearchScreen = routeName === 'Search'
  const webqueryParams = useWebQueryParams()
  const searchQuery = webqueryParams?.q
  const showTrending = !isSearchScreen || (isSearchScreen && !!searchQuery)
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
          <ProgressGuideList />
          <DesktopFeeds />
          <Divider />
        </>
      )}

      {showTrending && <SidebarTrendingTopics />}

      <Text style={[a.leading_snug, t.atoms.text_contrast_low]}>
        <InlineLinkText
          to="https://opencollective.com/blacksky/contribute/backer-59760/checkout"
          label={_(msg`Support Us`)}>
          {_(msg`Support Us`)}
        </InlineLinkText>
        {' • '}
        {hasSession && (
          <>
            <InlineLinkText
              to="https://assembly.blacksky.community/8bbfunvvau"
              label={_(msg`Discussion`)}>
              {_(msg`Discussion`)}
            </InlineLinkText>
            {' • '}
          </>
        )}
        <InlineLinkText
          to="https://www.blackskyweb.xyz/about/support/privacy-policy"
          label={_(msg`Privacy`)}>
          {_(msg`Privacy`)}
        </InlineLinkText>
        {' • '}
        <InlineLinkText
          to="https://www.blackskyweb.xyz/about/support/tos"
          label={_(msg`Terms`)}>
          {_(msg`Terms`)}
        </InlineLinkText>
        {' • '}
        <InlineLinkText label={_(msg`Help`)} to={HELP_DESK_URL}>
          {_(msg`Help`)}
        </InlineLinkText>
      </Text>

      {!hasSession && leftNavMinimal && (
        <View style={[a.w_full, {height: 32}]}>
          <AppLanguageDropdown />
        </View>
      )}
    </View>
  )
}
