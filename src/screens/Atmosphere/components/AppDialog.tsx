import {type GestureResponderEvent, View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {type AppMetric} from '#/screens/Atmosphere/metrics/apps'
import {
  AtmosphereMetricsRestore,
  useAtmosphereMetricContext,
  useAtmosphereMetricsSnapshot,
} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme, web} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ArrowIcon} from '#/components/icons/Square'
import {isClickEventWithMetaKey, Link} from '#/components/Link'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {useAtmosphereAppCategories} from './appCategories'

const LOGO_SIZE = 56

export function AppDialog({
  control,
  app,
  metric,
}: {
  control: Dialog.DialogOuterProps['control']
  app: app.bsky.unspecced.getAtmosphereApps.AppCard
  metric: AppMetric
}) {
  const {t: l} = useLingui()
  const metricsSnapshot = useAtmosphereMetricsSnapshot()
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`${app.title} details`}
        style={[web({maxWidth: 400})]}>
        <AtmosphereMetricsRestore
          snapshot={metricsSnapshot}
          surface="appDialog">
          <AppDialogInner app={app} metric={metric} />
        </AtmosphereMetricsRestore>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function AppDialogInner({
  app,
  metric,
}: {
  app: app.bsky.unspecced.getAtmosphereApps.AppCard
  metric: AppMetric
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const logPress = (
    event: 'atmosphere:app:websitePressed' | 'atmosphere:app:profilePressed',
  ) => {
    if (!metricContext) return
    ax.metric(event, {...metricContext, ...metric, source: 'appDialog'})
  }
  const {close} = Dialog.useDialogContext()
  const openLink = useOpenLink()
  const navigation = useNavigation<NavigationProp>()
  const categories = useAtmosphereAppCategories()
  const categoryLabel = categories.find(c => c.key === app.category)?.label
  const profile = app.profile
  const url = app.url

  /*
   * Links keep real hrefs for semantics, but navigation must wait for the
   * dialog to finish closing, so we take over the press from Link.
   */
  const closeThen = (e: GestureResponderEvent, action: () => void) => {
    // Modified clicks open a new tab via Link; keep the dialog open.
    if (isClickEventWithMetaKey(e)) return
    e.preventDefault()
    close(action)
    return false as const
  }

  return (
    <View style={[a.gap_md]}>
      {app.banner ? (
        <Image
          source={app.banner}
          contentFit="cover"
          style={[
            a.w_full,
            IS_NATIVE ? a.rounded_lg : a.rounded_md,
            {aspectRatio: 3},
          ]}
          accessible={false}
        />
      ) : undefined}
      <View style={[a.flex_row, a.gap_md, a.pt_xs]}>
        {app.logo ? (
          <View style={[a.relative, a.rounded_md, {width: LOGO_SIZE}]}>
            <Image
              source={app.logo}
              contentFit="cover"
              style={[a.rounded_md, {width: LOGO_SIZE, height: LOGO_SIZE}]}
              accessible={false}
            />
            <MediaInsetBorder style={[a.rounded_md]} />
          </View>
        ) : undefined}
        <View style={[a.flex_1, a.gap_xs, a.align_start]}>
          <Text numberOfLines={1}>
            <Text emoji style={[a.text_xl, a.font_semi_bold, t.atoms.text]}>
              {app.title}
            </Text>
            {url ? (
              <Text emoji style={[a.text_md, t.atoms.text_contrast_medium]}>
                {' · '}
                {toNiceDomain(url)}
              </Text>
            ) : undefined}
          </Text>
          {categoryLabel ? (
            <View
              style={[
                a.px_sm,
                a.py_2xs,
                a.rounded_sm,
                {backgroundColor: t.palette.primary_50},
              ]}>
              <Text style={[a.text_sm, {color: t.palette.primary_600}]}>
                {categoryLabel}
              </Text>
            </View>
          ) : undefined}
        </View>
      </View>
      {app.description ? (
        <Text emoji style={[a.text_md, a.leading_snug]}>
          {app.description}
        </Text>
      ) : undefined}
      <View style={[a.gap_sm]}>
        {url ? (
          <Link
            testID="appDialogVisit"
            to={url}
            label={l`Visit the ${app.title} website`}
            color="secondary"
            size="large"
            style={[a.justify_center]}
            onPress={e => {
              logPress('atmosphere:app:websitePressed')
              return closeThen(e, () => openLink(url))
            }}>
            <ButtonText>{l`Website`}</ButtonText>
            <ButtonIcon icon={ArrowIcon} position="right" />
          </Link>
        ) : undefined}
        {profile ? (
          <Link
            testID="appDialogProfile"
            to={makeProfileLink(profile)}
            label={l`View profile`}
            color="primary"
            size="large"
            style={[a.justify_center]}
            onPress={e => {
              logPress('atmosphere:app:profilePressed')
              return closeThen(e, () =>
                navigation.navigate('Profile', {name: profile.did}),
              )
            }}>
            <ButtonText>{l`View profile`}</ButtonText>
          </Link>
        ) : undefined}
      </View>
    </View>
  )
}
