import React, {useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Slider} from '@miblanchard/react-native-slider'
import {Text} from '../com/util/text/Text'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isWeb} from 'platform/detection'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'

function RepliesThresholdInput({enabled}: {enabled: boolean}) {
  const store = useStores()
  const pal = usePalette('default')
  const [value, setValue] = useState(store.preferences.homeFeedRepliesThreshold)

  return (
    <View style={[!enabled && styles.dimmed]}>
      <Slider
        value={value}
        onValueChange={(v: number | number[]) => {
          const threshold = Math.floor(Array.isArray(v) ? v[0] : v)
          setValue(threshold)
          store.preferences.setHomeFeedRepliesThreshold(threshold)
        }}
        minimumValue={0}
        maximumValue={25}
        containerStyle={isWeb ? undefined : s.flex1}
        disabled={!enabled}
        thumbTintColor={colors.blue3}
      />
      <Text type="xs" style={pal.text}>
        {value === 0
          ? `Show all replies`
          : `Show replies with at least ${value} ${
              value > 1 ? `likes` : `like`
            }`}
      </Text>
    </View>
  )
}

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesHomeFeed'
>
export const PreferencesHomeFeed = observer(function PreferencesHomeFeedImpl({
  navigation,
}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const {isTabletOrDesktop} = useWebMediaQueries()

  return (
    <CenteredView
      testID="preferencesHomeFeedScreen"
      style={[
        pal.view,
        pal.border,
        styles.container,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title="Home Feed Preferences" showOnDesktop />
      <View
        style={[styles.titleSection, isTabletOrDesktop && {paddingTop: 20}]}>
        <Text type="xl" style={[pal.textLight, styles.description]}>
          Fine-tune the content you see on your home screen.
        </Text>
      </View>

      <ScrollView>
        <View style={styles.cardsContainer}>
          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Show Replies
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Set this setting to "No" to hide all replies from your feed.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedRepliesEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedRepliesEnabled}
              onPress={store.preferences.toggleHomeFeedRepliesEnabled}
            />
          </View>
          <View
            style={[
              pal.viewLight,
              styles.card,
              !store.preferences.homeFeedRepliesEnabled && styles.dimmed,
            ]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Reply Filters
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Enable this setting to only see replies between people you follow.
            </Text>
            <ToggleButton
              type="default-light"
              label="Followed users only"
              isSelected={
                store.preferences.homeFeedRepliesByFollowedOnlyEnabled
              }
              onPress={
                store.preferences.homeFeedRepliesEnabled
                  ? store.preferences.toggleHomeFeedRepliesByFollowedOnlyEnabled
                  : undefined
              }
              style={[s.mb10]}
            />
            <Text style={[pal.text]}>
              Adjust the number of likes a reply must have to be shown in your
              feed.
            </Text>
            <RepliesThresholdInput
              enabled={store.preferences.homeFeedRepliesEnabled}
            />
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Show Reposts
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Set this setting to "No" to hide all reposts from your feed.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedRepostsEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedRepostsEnabled}
              onPress={store.preferences.toggleHomeFeedRepostsEnabled}
            />
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Show Quote Posts
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Set this setting to "No" to hide all quote posts from your feed.
              Reposts will still be visible.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedQuotePostsEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedQuotePostsEnabled}
              onPress={store.preferences.toggleHomeFeedQuotePostsEnabled}
            />
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              Show Posts from My Feeds (Experimental)
            </Text>
            <Text style={[pal.text, s.pb10]}>
              Set this setting to "Yes" to show samples of your saved feeds in
              your following feed.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedMergeFeedEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedMergeFeedEnabled}
              onPress={store.preferences.toggleHomeFeedMergeFeedEnabled}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.btnContainer,
          !isTabletOrDesktop && {borderTopWidth: 1, paddingHorizontal: 20},
          pal.borderDark,
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
