import React from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../com/util/text/Text'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {RadioGroup} from 'view/com/util/forms/RadioGroup'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  usePreferencesQuery,
  useSetThreadViewPreferencesMutation,
} from '#/state/queries/preferences'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesThreads'>
export function PreferencesThreads({navigation}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isTabletOrDesktop} = useWebMediaQueries()
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
    <CenteredView
      testID="preferencesThreadsScreen"
      style={[
        pal.view,
        pal.border,
        styles.container,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title={_(msg`Thread Preferences`)} showOnDesktop />
      <View
        style={[
          styles.titleSection,
          isTabletOrDesktop && {paddingTop: 20, paddingBottom: 20},
        ]}>
        <Text type="xl" style={[pal.textLight, styles.description]}>
          <Trans>Fine-tune the discussion threads.</Trans>
        </Text>
      </View>

      {preferences ? (
        <ScrollView>
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
        </ScrollView>
      ) : (
        <ActivityIndicator />
      )}

      <View
        style={[
          styles.btnContainer,
          !isTabletOrDesktop && {borderTopWidth: 1, paddingHorizontal: 20},
          pal.border,
        ]}>
        <TouchableOpacity
          testID="confirmBtn"
          onPress={() => {
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate('Settings')
          }}
          style={[styles.btn, isTabletOrDesktop && styles.btnDesktop]}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Confirm`)}
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans context="action">Done</Trans>
          </Text>
        </TouchableOpacity>
      </View>
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 90,
  },
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 40,
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
