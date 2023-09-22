import React from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../com/util/text/Text'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {RadioGroup} from 'view/com/util/forms/RadioGroup'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesThreads'>
export const PreferencesThreads = observer(function PreferencesThreadsImpl({
  navigation,
}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const {isTabletOrDesktop} = useWebMediaQueries()

  return (
    <CenteredView
      testID="preferencesThreadsScreen"
      style={[
        pal.view,
        pal.border,
        styles.container,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title="Thread Preferences" showOnDesktop />
      <View
        style={[
          styles.titleSection,
          isTabletOrDesktop && {paddingTop: 20, paddingBottom: 20},
        ]}>
        <Text type="xl" style={[pal.textLight, styles.description]}>
          Fine-tune the discussion threads.
        </Text>
      </View>

      <ScrollView>
        <View style={styles.cardsContainer}>
          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Sort Replies
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Sort replies to the same post by:
            </Text>
            <View style={[pal.view, {borderRadius: 8, paddingVertical: 6}]}>
              <RadioGroup
                type="default-light"
                items={[
                  {key: 'oldest', label: 'Oldest replies first'},
                  {key: 'newest', label: 'Newest replies first'},
                  {key: 'most-likes', label: 'Most-liked replies first'},
                  {key: 'random', label: 'Random (aka "Poster\'s Roulette")'},
                ]}
                onSelect={store.preferences.setThreadSort}
                initialSelection={store.preferences.thread.sort}
              />
            </View>
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Prioritize Your Follows
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Show replies by people you follow before all other replies.
            </Text>
            <ToggleButton
              type="default-light"
              label={
                store.preferences.thread.prioritizeFollowedUsers ? 'Yes' : 'No'
              }
              isSelected={store.preferences.thread.prioritizeFollowedUsers}
              onPress={store.preferences.togglePrioritizedFollowedUsers}
            />
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              <FontAwesomeIcon icon="flask" color={pal.colors.text} /> Threaded
              Mode
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Set this setting to "Yes" to show replies in a threaded view. This
              is an experimental feature.
            </Text>
            <ToggleButton
              type="default-light"
              label={
                store.preferences.thread.lab_treeViewEnabled ? 'Yes' : 'No'
              }
              isSelected={!!store.preferences.thread.lab_treeViewEnabled}
              onPress={store.preferences.toggleThreadTreeViewEnabled}
            />
          </View>
        </View>
      </ScrollView>

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
          accessibilityLabel="Confirm"
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>Done</Text>
        </TouchableOpacity>
      </View>
    </CenteredView>
  )
})

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
