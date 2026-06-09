import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useSession} from '#/state/session'
import {DesktopSearch} from '#/view/shell/desktop/Search'
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
import {Text} from '#/components/Typography'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const kawaii = useKawaiiMode()
  const gutters = useGutters(['base', 0, 'base', 'wide'])
  const isSearchScreen = routeName === 'Search'
  const isMessagesRelatedScreen = routeName.startsWith('Messages')
  const {rightNavVisible, centerColumnOffset, leftNavMinimal} =
    useLayoutBreakpoints()

  if (!rightNavVisible || isMessagesRelatedScreen) {
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
