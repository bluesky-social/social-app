import React, {useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Slider} from '@miblanchard/react-native-slider'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb, isDesktopWeb} from 'platform/detection'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {ScrollView} from 'view/com/modals/util'

export const snapPoints = ['90%']

function RepliesThresholdInput({enabled}: {enabled: boolean}) {
  const store = useStores()
  const [value, setValue] = useState(store.preferences.homeFeedRepliesThreshold)

  return (
    <View style={[s.mt10, !enabled && styles.dimmed]}>
      <Text type="xs">
        {value === 0
          ? `Show all replies`
          : `Show replies with greater than ${value} ${
              value > 1 ? `likes` : `like`
            }`}
      </Text>
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
    </View>
  )
}

export const Component = observer(function Component() {
  const pal = usePalette('default')
  const store = useStores()

  return (
    <View
      testID="preferencesHomeFeedModal"
      style={[pal.view, styles.container]}>
      <View style={styles.titleSection}>
        <Text type="title-lg" style={[pal.text, styles.title]}>
          Home Feed Preferences
        </Text>
        <Text type="xl" style={[pal.textLight, styles.description]}>
          Fine-tune the content you see on your home screen.
        </Text>
      </View>

      <ScrollView>
        <View style={styles.cardsContainer}>
          <View style={[styles.card]}>
            <Text type="title-sm" style={[s.pb5]}>
              Show Replies
            </Text>
            <Text style={[s.pb10]}>
              Adjust the number of likes a reply must have to be shown in your
              feed.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedRepliesEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedRepliesEnabled}
              onPress={store.preferences.toggleHomeFeedRepliesEnabled}
            />

            <RepliesThresholdInput
              enabled={store.preferences.homeFeedRepliesEnabled}
            />
          </View>

          <View style={[styles.card]}>
            <Text type="title-sm" style={[s.pb5]}>
              Show Reposts
            </Text>
            <Text style={[s.pb10]}>
              Disable this setting to hide all reposts from your feed.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedRepostsEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedRepostsEnabled}
              onPress={store.preferences.toggleHomeFeedRepostsEnabled}
            />
          </View>

          <View style={[styles.card]}>
            <Text type="title-sm" style={[s.pb5]}>
              Show Quote Posts
            </Text>
            <Text style={[s.pb10]}>
              Disable this setting to hide all quote posts from your feed.
              Reposts will still be visible.
            </Text>
            <ToggleButton
              type="default-light"
              label={store.preferences.homeFeedQuotePostsEnabled ? 'Yes' : 'No'}
              isSelected={store.preferences.homeFeedQuotePostsEnabled}
              onPress={store.preferences.toggleHomeFeedQuotePostsEnabled}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.btnContainer, pal.borderDark]}>
        <TouchableOpacity
          testID="confirmBtn"
          onPress={() => {
            store.shell.closeModal()
          }}
          style={[styles.btn]}
          accessibilityRole="button"
          accessibilityLabel="Confirm"
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 60,
  },
  titleSection: {
    padding: 20,
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
    backgroundColor: s.gray1.color,
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
  btnContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    borderTopWidth: isDesktopWeb ? 0 : 1,
  },
  dimmed: {
    opacity: 0.3,
  },
})
