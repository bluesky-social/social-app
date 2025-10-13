import {useCallback} from 'react'
import {LayoutAnimationConfig} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  useMerticDisabledPref,
  useSetMetricDisabledPref,
} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Bookmark as SaveIcon} from '#/components/icons/Bookmark'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {CloseQuote_Stroke2_Corner0_Rounded as QuotePostIcon} from '#/components/icons/Quote'
import {Reply as RepliesIcon} from '#/components/icons/Reply'
import {Repost_Stroke2_Corner0_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MetricVisibilitySettings'
>
export function MetricVisibilitySettingsScreen({}: Props) {
  const {_} = useLingui()

  const {
    likeMetrics,
    repostMetrics,
    quoteMetrics,
    bookmarkMetrics,
    replyMetrics,
  } = useMerticDisabledPref()

  const {
    setLikeMetrics,
    setRepostMetrics,
    setQuoteMetrics,
    setBookmarkMetrics,
    setReplyMetrics,
  } = useSetMetricDisabledPref()

  const onChangeLikeMetrics = useCallback(
    (keys: string[]) => {
      const likeMetric = keys.find(key => key !== likeMetrics) as
        | 'show'
        | 'hide-own'
        | 'hide-all'
        | undefined
      if (!likeMetric) return
      setLikeMetrics(likeMetric)
    },
    [setLikeMetrics, likeMetrics],
  )

  const onChangeRepostMetrics = useCallback(
    (keys: string[]) => {
      const repostMetric = keys.find(key => key !== repostMetrics) as
        | 'show'
        | 'hide-own'
        | 'hide-all'
        | undefined
      if (!repostMetric) return
      setRepostMetrics(repostMetric)
    },
    [setRepostMetrics, repostMetrics],
  )

  const onChangeQuotePostMetrics = useCallback(
    (keys: string[]) => {
      const quoteMetric = keys.find(key => key !== quoteMetrics) as
        | 'show'
        | 'hide-own'
        | 'hide-all'
        | undefined
      if (!quoteMetric) return
      setQuoteMetrics(quoteMetric)
    },
    [setQuoteMetrics, quoteMetrics],
  )

  const onChangeBookmarkMetrics = useCallback(
    (keys: string[]) => {
      const bookmarkMetric = keys.find(key => key !== bookmarkMetrics) as
        | 'show'
        | 'hide-own'
        | 'hide-all'
        | undefined
      if (!bookmarkMetric) return
      setBookmarkMetrics(bookmarkMetric)
    },
    [setBookmarkMetrics, bookmarkMetrics],
  )

  const onChangeReplyMetrics = useCallback(
    (keys: string[]) => {
      const replyMetric = keys.find(key => key !== replyMetrics) as
        | 'show'
        | 'hide-own'
        | 'hide-all'
        | undefined
      if (!replyMetric) return
      setReplyMetrics(replyMetric)
    },
    [setReplyMetrics, replyMetrics],
  )

  return (
    <LayoutAnimationConfig skipExiting skipEntering>
      <Layout.Screen testID="preferencesThreadsScreen">
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Metric Visibility</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content>
          <SettingsList.Container>
            <AppearanceToggleButtonGroup
              title={_(msg`Like Count (Posts Only)`)}
              icon={HeartIcon}
              items={[
                {
                  label: _(msg`Show`),
                  name: 'show',
                },
                {
                  label: _(msg`Hide Own`),
                  name: 'hide-own',
                },
                {
                  label: _(msg`Hide All`),
                  name: 'hide-all',
                },
              ]}
              values={[likeMetrics]}
              onChange={onChangeLikeMetrics}
            />
            <SettingsList.Divider />
            <AppearanceToggleButtonGroup
              title={_(msg`Repost Count`)}
              icon={RepostIcon}
              items={[
                {
                  label: _(msg`Show`),
                  name: 'show',
                },
                {
                  label: _(msg`Hide Own`),
                  name: 'hide-own',
                },
                {
                  label: _(msg`Hide All`),
                  name: 'hide-all',
                },
              ]}
              values={[repostMetrics]}
              onChange={onChangeRepostMetrics}
            />
            <SettingsList.Divider />
            <AppearanceToggleButtonGroup
              title={_(msg`Quote Post Count`)}
              icon={QuotePostIcon}
              items={[
                {
                  label: _(msg`Show`),
                  name: 'show',
                },
                {
                  label: _(msg`Hide Own`),
                  name: 'hide-own',
                },
                {
                  label: _(msg`Hide All`),
                  name: 'hide-all',
                },
              ]}
              values={[quoteMetrics]}
              onChange={onChangeQuotePostMetrics}
            />
            <SettingsList.Divider />
            <AppearanceToggleButtonGroup
              title={_(msg`Save Count`)}
              icon={SaveIcon}
              items={[
                {
                  label: _(msg`Show`),
                  name: 'show',
                },
                {
                  label: _(msg`Hide Own`),
                  name: 'hide-own',
                },
                {
                  label: _(msg`Hide All`),
                  name: 'hide-all',
                },
              ]}
              values={[bookmarkMetrics]}
              onChange={onChangeBookmarkMetrics}
            />
            <SettingsList.Divider />
            <AppearanceToggleButtonGroup
              title={_(msg`Reply Count`)}
              icon={RepliesIcon}
              items={[
                {
                  label: _(msg`Show`),
                  name: 'show',
                },
                {
                  label: _(msg`Hide Own`),
                  name: 'hide-own',
                },
                {
                  label: _(msg`Hide All`),
                  name: 'hide-all',
                },
              ]}
              values={[replyMetrics]}
              onChange={onChangeReplyMetrics}
            />
          </SettingsList.Container>
        </Layout.Content>
      </Layout.Screen>
    </LayoutAnimationConfig>
  )
}

export function AppearanceToggleButtonGroup({
  title,
  description,
  icon: Icon,
  items,
  values,
  onChange,
}: {
  title: string
  description?: string
  icon: React.ComponentType<SVGIconProps>
  items: {
    label: string
    name: string
  }[]
  values: string[]
  onChange: (values: string[]) => void
}) {
  const t = useTheme()
  return (
    <>
      <SettingsList.Group contentContainerStyle={[a.gap_sm]} iconInset={false}>
        <SettingsList.ItemIcon icon={Icon} />
        <SettingsList.ItemText>{title}</SettingsList.ItemText>
        {description && (
          <Text
            style={[
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.w_full,
            ]}>
            {description}
          </Text>
        )}
        <ToggleButton.Group label={title} values={values} onChange={onChange}>
          {items.map(item => (
            <ToggleButton.Button
              key={item.name}
              label={item.label}
              name={item.name}>
              <ToggleButton.ButtonText>{item.label}</ToggleButton.ButtonText>
            </ToggleButton.Button>
          ))}
        </ToggleButton.Group>
      </SettingsList.Group>
    </>
  )
}
