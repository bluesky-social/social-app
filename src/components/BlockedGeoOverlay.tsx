import {useEffect} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Full as Logo, Mark} from '#/components/icons/Logo'
import {SimpleInlineLinkText as InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function BlockedGeoOverlay() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    // just counting overall hits here
    logger.metric(`blockedGeoOverlay:shown`, {})
  }, [])

  const textStyles = [a.text_md, a.leading_normal]
  const links = {
    blog: {
      to: `https://bsky.social/about/blog/08-22-2025-mississippi-hb1126`,
      label: _(msg`Read our blog post`),
      overridePresentation: false,
      disableMismatchWarning: true,
      style: textStyles,
    },
  }

  const blocks = [
    _(msg`Unfortunately, Bluesky is unavailable in Mississippi right now.`),
    _(
      msg`A new Mississippi law requires us to implement age verification for all users before they can access Bluesky. We think this law creates challenges that go beyond its child safety goals, and creates significant barriers that limit free speech and disproportionately harm smaller platforms and emerging technologies.`,
    ),
    _(
      msg`As a small team, we cannot justify building the expensive infrastructure this requirement demands while legal challenges to this law are pending.`,
    ),
    _(
      msg`For now, we have made the difficult decision to block access to Bluesky in the state of Mississippi.`,
    ),
    <>
      To learn more, read our{' '}
      <InlineLinkText {...links.blog}>blog post</InlineLinkText>.
    </>,
  ]

  return (
    <ScrollView
      contentContainerStyle={[
        a.px_2xl,
        {
          paddingTop: isWeb ? a.p_5xl.padding : insets.top + a.p_2xl.padding,
          paddingBottom: 100,
        },
      ]}>
      <View
        style={[
          a.mx_auto,
          web({
            maxWidth: 440,
            paddingTop: gtPhone ? '8vh' : undefined,
          }),
        ]}>
        <View style={[a.align_start]}>
          <View
            style={[
              a.pl_md,
              a.pr_lg,
              a.py_sm,
              a.rounded_full,
              a.flex_row,
              a.align_center,
              a.gap_xs,
              {
                backgroundColor: t.palette.primary_25,
              },
            ]}>
            <Mark fill={t.palette.primary_600} width={14} />
            <Text
              style={[
                a.font_bold,
                {
                  color: t.palette.primary_600,
                },
              ]}>
              <Trans>Announcement</Trans>
            </Text>
          </View>
        </View>

        <View style={[a.gap_lg, {paddingTop: 32, paddingBottom: 48}]}>
          {blocks.map((block, index) => (
            <Text key={index} style={[textStyles]}>
              {block}
            </Text>
          ))}
        </View>

        <Logo width={120} textFill={t.atoms.text.color} />
      </View>
    </ScrollView>
  )
}
