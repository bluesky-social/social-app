import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {shouldShowKnownFollowers} from '#/components/KnownFollowers'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {AppDialog} from './AppDialog'
import {AppKnownFollowers} from './AppKnownFollowers'

const LOGO_SIZE = 40

export function AppCard({
  app,
}: {
  app: app.bsky.unspecced.getAtmosphereApps.AppCard
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const control = useDialogControl()

  if (!app.title) return null

  const showFollowers =
    app.profile && shouldShowKnownFollowers(app.profile.viewer?.knownFollowers)

  return (
    <>
      <Button
        label={l`View details for ${app.title}`}
        accessibilityHint=""
        onPress={() => control.open()}
        style={[
          a.w_full,
          a.rounded_xl,
          a.overflow_hidden,
          a.border,
          t.atoms.border_contrast_low,
        ]}>
        {({hovered, pressed}) => (
          <View
            style={[a.w_full, (hovered || pressed) && t.atoms.bg_contrast_25]}>
            <View
              style={[
                a.flex_row,
                a.align_start,
                a.w_full,
                a.gap_md,
                a.p_md,
                showFollowers && a.pb_sm,
              ]}>
              {app.logo ? (
                <View style={[a.relative, a.rounded_md, {width: LOGO_SIZE}]}>
                  <Image
                    source={app.logo}
                    contentFit="cover"
                    style={[
                      a.rounded_md,
                      {width: LOGO_SIZE, height: LOGO_SIZE},
                    ]}
                    accessible={false}
                  />
                  <MediaInsetBorder style={[a.rounded_md]} />
                </View>
              ) : undefined}
              <View style={[a.flex_1, a.gap_xs]}>
                <Text numberOfLines={1}>
                  <Text emoji style={[a.text_md, a.font_medium, t.atoms.text]}>
                    {app.title}
                  </Text>
                  {app.url ? (
                    <Text
                      emoji
                      style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {' · '}
                      {toNiceDomain(app.url)}
                    </Text>
                  ) : undefined}
                </Text>
                {app.description ? (
                  <Text
                    emoji
                    style={[a.text_sm, a.leading_snug]}
                    numberOfLines={2}>
                    {app.description}
                  </Text>
                ) : undefined}

                {showFollowers && app.profile ? (
                  <View style={[a.pt_xs, a.pb_sm]}>
                    <AppKnownFollowers profile={app.profile} />
                  </View>
                ) : undefined}
              </View>
            </View>
          </View>
        )}
      </Button>
      <AppDialog control={control} app={app} />
    </>
  )
}
