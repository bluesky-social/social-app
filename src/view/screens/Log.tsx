import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {getEntries} from '#/logger/logDump'
import {useTickEveryMinute} from '#/state/shell'
import {useSetMinimalShellMode} from '#/state/shell'
import {Text} from '#/view/com/util/text/Text'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'

export function LogScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Log'
>) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const [expanded, setExpanded] = React.useState<string[]>([])
  const timeAgo = useGetTimeAgo()
  const tick = useTickEveryMinute()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const toggler = (id: string) => () => {
    if (expanded.includes(id)) {
      setExpanded(expanded.filter(v => v !== id))
    } else {
      setExpanded([...expanded, id])
    }
  }

  return (
    <Layout.Screen>
      <ViewHeader title="Log" />
      <ScrollView style={s.flex1}>
        {getEntries()
          .slice(0)
          .map(entry => {
            return (
              <View key={`entry-${entry.id}`}>
                <TouchableOpacity
                  style={[styles.entry, pal.border, pal.view]}
                  onPress={toggler(entry.id)}
                  accessibilityLabel={_(msg`View debug entry`)}
                  accessibilityHint={_(
                    msg`Opens additional details for a debug entry`,
                  )}>
                  {entry.level === 'debug' ? (
                    <FontAwesomeIcon icon="info" />
                  ) : (
                    <FontAwesomeIcon icon="exclamation" style={s.red3} />
                  )}
                  <Text type="sm" style={[styles.summary, pal.text]}>
                    {String(entry.message)}
                  </Text>
                  {entry.metadata && Object.keys(entry.metadata).length ? (
                    <FontAwesomeIcon
                      icon={
                        expanded.includes(entry.id) ? 'angle-up' : 'angle-down'
                      }
                      style={s.mr5}
                    />
                  ) : undefined}
                  <Text type="sm" style={[styles.ts, pal.textLight]}>
                    {timeAgo(entry.timestamp, tick)}
                  </Text>
                </TouchableOpacity>
                {expanded.includes(entry.id) ? (
                  <View style={[pal.view, s.pl10, s.pr10, s.pb10]}>
                    <View style={[pal.btn, styles.details]}>
                      <Text type="mono" style={pal.text}>
                        {JSON.stringify(entry.metadata, null, 2)}
                      </Text>
                    </View>
                  </View>
                ) : undefined}
              </View>
            )
          })}
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  summary: {
    flex: 1,
  },
  ts: {
    width: 40,
  },
  details: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
})
