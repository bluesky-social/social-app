import {Text as RNText, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {
  Admonition,
  Button as AdmonitionButton,
  Content as AdmonitionContent,
  Icon as AdmonitionIcon,
  Outer as AdmonitionOuter,
  Row as AdmonitionRow,
  Text as AdmonitionText,
} from '#/components/Admonition'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Retry} from '#/components/icons/ArrowRotateCounterClockwise'
import {BellRinging_Filled_Corner0_Rounded as BellRingingFilledIcon} from '#/components/icons/BellRinging'
import {InlineLinkText} from '#/components/Link'
import {H1} from '#/components/Typography'

export function Admonitions() {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <View style={[a.gap_md]}>
      <H1>Admonitions</H1>

      <Admonition>The quick brown fox jumps over the lazy dog.</Admonition>
      <Admonition type="info">
        How happy the blameless vestal's lot, the world forgetting by the world
        forgot.{' '}
        <InlineLinkText
          label="test"
          to="https://letterboxd.com/film/eternal-sunshine-of-the-spotless-mind/">
          Eternal sunshine of the spotless mind
        </InlineLinkText>
        ! Each pray'r accepted, and each wish resign'd.
      </Admonition>
      <Admonition type="tip">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
      <Admonition type="warning">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
      <Admonition type="error">
        The quick brown fox jumps over the lazy dog.
      </Admonition>

      <AdmonitionOuter type="error">
        <AdmonitionRow>
          <AdmonitionIcon />
          <AdmonitionContent>
            <AdmonitionText>
              <Trans>Something went wrong, please try again</Trans>
            </AdmonitionText>
          </AdmonitionContent>
          <AdmonitionButton
            color="negative_subtle"
            label={_(msg`Retry loading report options`)}
            onPress={() => {}}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
            <ButtonIcon icon={Retry} />
          </AdmonitionButton>
        </AdmonitionRow>
      </AdmonitionOuter>

      <AdmonitionOuter type="tip">
        <AdmonitionRow>
          <AdmonitionIcon />
          <AdmonitionContent>
            <AdmonitionText>
              <Trans>
                Enable notifications for an account by visiting their profile
                and pressing the{' '}
                <RNText style={[a.font_bold, t.atoms.text_contrast_high]}>
                  bell icon
                </RNText>{' '}
                <BellRingingFilledIcon
                  size="xs"
                  style={t.atoms.text_contrast_high}
                />
                .
              </Trans>
            </AdmonitionText>
            <AdmonitionText>
              <Trans>
                If you want to restrict who can receive notifications for your
                account's activity, you can change this in{' '}
                <InlineLinkText
                  label={_(msg`Privacy and Security settings`)}
                  to={{screen: 'ActivityPrivacySettings'}}
                  style={[a.font_bold]}>
                  Settings &rarr; Privacy and Security
                </InlineLinkText>
                .
              </Trans>
            </AdmonitionText>
          </AdmonitionContent>
        </AdmonitionRow>
      </AdmonitionOuter>
    </View>
  )
}
