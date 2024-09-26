import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {colors, s} from '#/lib/styles'
import {
  usePreferencesQuery,
  useSetThreadViewPreferencesMutation,
} from '#/state/queries/preferences'
import {RadioGroup} from '#/view/com/util/forms/RadioGroup'
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'
import {SimpleViewHeader} from '#/view/com/util/SimpleViewHeader'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesThreads'>
export function PreferencesThreads({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isTabletOrMobile} = useWebMediaQueries()
  const {data: preferences} = usePreferencesQuery()
  const {mutate: setThreadViewPrefs, variables} =
    useSetThreadViewPreferencesMutation()

  const prioritizeFollowedUsers = Boolean(
    variables?.prioritizeFollowedUsers ??
      preferences?.threadViewPrefs?.prioritizeFollowedUsers,
  )
  const treeViewEnabled = Boolean(
    variables?.lab_treeViewEnabled ??
      preferences?.threadViewPrefs?.lab_treeViewEnabled,
  )

  return (
    <View testID="preferencesThreadsScreen" style={s.hContentRegion}>
      <ScrollView
        // @ts-ignore web only -prf
        dataSet={{'stable-gutters': 1}}
        contentContainerStyle={{paddingBottom: 75}}>
        <SimpleViewHeader
          showBackButton={isTabletOrMobile}
          style={[pal.border, a.border_b]}>
          <View style={a.flex_1}>
            <Text type="title-lg" style={[pal.text, {fontWeight: '600'}]}>
              <Trans>Thread Preferences</Trans>
            </Text>
            <Text style={pal.textLight}>
              <Trans>Fine-tune the discussion threads.</Trans>
            </Text>
          </View>
        </SimpleViewHeader>

        {preferences ? (
          <View style={styles.cardsContainer}>
            <View style={[pal.viewLight, styles.card]}>
              <Text type="title-sm" style={[pal.text, s.pb5]}>
                <Trans>Sort Replies</Trans>
              </Text>
              <Text style={[pal.text, s.pb10]}>
                <Trans>Sort replies to the same post by:</Trans>
              </Text>
              <View style={[pal.view, {borderRadius: 8, paddingVertical: 6}]}>
                <RadioGroup
                  type="default-light"
                  items={[
                    {key: 'oldest', label: _(msg`Oldest replies first`)},
                    {key: 'newest', label: _(msg`Newest replies first`)},
                    {
                      key: 'most-likes',
                      label: _(msg`Most-liked replies first`),
                    },
                    {
                      key: 'random',
                      label: _(msg`Random (aka "Poster's Roulette")`),
                    },
                  ]}
                  onSelect={key => setThreadViewPrefs({sort: key})}
                  initialSelection={preferences?.threadViewPrefs?.sort}
                />
              </View>
            </View>

            <View style={[pal.viewLight, styles.card]}>
              <Text type="title-sm" style={[pal.text, s.pb5]}>
                <Trans>Prioritize Your Follows</Trans>
              </Text>
              <Text style={[pal.text, s.pb10]}>
                <Trans>
                  Show replies by people you follow before all other replies.
                </Trans>
              </Text>
              <ToggleButton
                type="default-light"
                label={prioritizeFollowedUsers ? _(msg`Yes`) : _(msg`No`)}
                isSelected={prioritizeFollowedUsers}
                onPress={() =>
                  setThreadViewPrefs({
                    prioritizeFollowedUsers: !prioritizeFollowedUsers,
                  })
                }
              />
            </View>

            <View style={[pal.viewLight, styles.card]}>
              <Text type="title-sm" style={[pal.text, s.pb5]}>
                <FontAwesomeIcon icon="flask" color={pal.colors.text} />{' '}
                <Trans>Threaded Mode</Trans>
              </Text>
              <Text style={[pal.text, s.pb10]}>
                <Trans>
                  Set this setting to "Yes" to show replies in a threaded view.
                  This is an experimental feature.
                </Trans>
              </Text>
              <ToggleButton
                type="default-light"
                label={treeViewEnabled ? _(msg`Yes`) : _(msg`No`)}
                isSelected={treeViewEnabled}
                onPress={() =>
                  setThreadViewPrefs({
                    lab_treeViewEnabled: !treeViewEnabled,
                  })
                }
              />
            </View>
          </View>
        ) : (
          <ActivityIndicator style={a.flex_1} />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  titleSection: {
    paddingBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 5,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnDesktop: {
    marginHorizontal: 'auto',
    paddingHorizontal: 80,
  },
  btnContainer: {
    paddingTop: 20,
  },
  dimmed: {
    opacity: 0.3,
  },
})
