import {useCallback, useState} from 'react'
import {LayoutAnimation, View} from 'react-native'
import {Pressable} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {getEntries} from '#/logger/logDump'
import {useTickEveryMinute} from '#/state/shell'
import {useSetMinimalShellMode} from '#/state/shell'
import {atoms as a, useTheme} from '#/alf'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function LogScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Log'
>) {
  const t = useTheme()
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [expanded, setExpanded] = useState<string[]>([])
  const timeAgo = useGetTimeAgo()
  const tick = useTickEveryMinute()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const toggler = (id: string) => () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (expanded.includes(id)) {
      setExpanded(expanded.filter(v => v !== id))
    } else {
      setExpanded([...expanded, id])
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>System log</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        {getEntries()
          .slice(0)
          .map(entry => {
            return (
              <View key={`entry-${entry.id}`}>
                <Pressable
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.py_md,
                    a.px_sm,
                    a.border_b,
                    t.atoms.border_contrast_low,
                    t.atoms.bg,
                    a.gap_sm,
                  ]}
                  onPress={toggler(entry.id)}
                  accessibilityLabel={_(msg`View debug entry`)}
                  accessibilityHint={_(
                    msg`Opens additional details for a debug entry`,
                  )}>
                  {entry.level === 'warn' || entry.level === 'error' ? (
                    <WarningIcon size="sm" fill={t.palette.negative_500} />
                  ) : (
                    <CircleInfoIcon size="sm" />
                  )}
                  <Text style={[a.flex_1]}>{String(entry.message)}</Text>
                  {entry.metadata &&
                    Object.keys(entry.metadata).length > 0 &&
                    (expanded.includes(entry.id) ? (
                      <ChevronTopIcon
                        size="sm"
                        style={[t.atoms.text_contrast_low]}
                      />
                    ) : (
                      <ChevronBottomIcon
                        size="sm"
                        style={[t.atoms.text_contrast_low]}
                      />
                    ))}
                  <Text style={[{minWidth: 40}, t.atoms.text_contrast_medium]}>
                    {timeAgo(entry.timestamp, tick)}
                  </Text>
                </Pressable>
                {expanded.includes(entry.id) && (
                  <View
                    style={[
                      t.atoms.bg_contrast_25,
                      a.rounded_xs,
                      a.p_sm,
                      a.border_b,
                      t.atoms.border_contrast_low,
                    ]}>
                    <View style={[a.px_sm, a.py_xs]}>
                      <Text>{JSON.stringify(entry.metadata, null, 2)}</Text>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
      </Layout.Content>
    </Layout.Screen>
  )
}
