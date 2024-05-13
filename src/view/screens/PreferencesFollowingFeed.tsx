import React, {useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {Slider} from '@miblanchard/react-native-slider'
import debounce from 'lodash.debounce'

import {
  usePreferencesQuery,
  useSetFeedViewPreferencesMutation,
} from '#/state/queries/preferences'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {colors, s} from 'lib/styles'
import {isWeb} from 'platform/detection'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Text} from '../com/util/text/Text'

function RepliesThresholdInput({
  enabled,
  initialValue,
}: {
  enabled: boolean
  initialValue: number
}) {
  const pal = usePalette('default')
  const [value, setValue] = useState(initialValue)
  const {mutate: setFeedViewPref} = useSetFeedViewPreferencesMutation()
  const preValue = React.useRef(initialValue)
  const save = React.useMemo(
    () =>
      debounce(
        threshold =>
          setFeedViewPref({
            hideRepliesByLikeCount: threshold,
          }),
        500,
      ), // debouce for 500ms
    [setFeedViewPref],
  )

  return (
    <View style={[!enabled && styles.dimmed]}>
      <Slider
        value={value}
        onValueChange={(v: number | number[]) => {
          let threshold = Array.isArray(v) ? v[0] : v
          if (threshold > preValue.current) threshold = Math.floor(threshold)
          else threshold = Math.ceil(threshold)

          preValue.current = threshold

          setValue(threshold)
          save(threshold)
        }}
        minimumValue={0}
        maximumValue={25}
        containerStyle={isWeb ? undefined : s.flex1}
        disabled={!enabled}
        thumbTintColor={colors.blue3}
      />
      <Text type="xs" style={pal.text}>
        <Plural
          value={value}
          _0="Show all replies"
          one="Show replies with at least # like"
          other="Show replies with at least # likes"
        />
      </Text>
    </View>
  )
}

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesFollowingFeed'
>
export function PreferencesFollowingFeed({navigation}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {data: preferences} = usePreferencesQuery()
  const {mutate: setFeedViewPref, variables} =
    useSetFeedViewPreferencesMutation()

  const showReplies = !(
    variables?.hideReplies ?? preferences?.feedViewPrefs?.hideReplies
  )

  return (
    <CenteredView
      testID="preferencesHomeFeedScreen"
      style={[
        pal.view,
        pal.border,
        styles.container,
        isTabletOrDesktop && styles.desktopContainer,
      ]}>
      <ViewHeader title={_(msg`Following Feed Preferences`)} showOnDesktop />
      <View
        style={[
          styles.titleSection,
          isTabletOrDesktop && {paddingTop: 20, paddingBottom: 20},
        ]}>
        <Text type="xl" style={[pal.textLight, styles.description]}>
          <Trans>Fine-tune the content you see on your Following feed.</Trans>
        </Text>
      </View>

      <ScrollView>
        <View style={styles.cardsContainer}>
          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              <Trans>Show Replies</Trans>
            </Text>
            <Text style={[pal.text, s.pb10]}>
              <Trans>
                Set this setting to "No" to hide all replies from your feed.
              </Trans>
            </Text>
            <ToggleButton
              testID="toggleRepliesBtn"
              type="default-light"
              label={showReplies ? _(msg`Yes`) : _(msg`No`)}
              isSelected={showReplies}
              onPress={() =>
                setFeedViewPref({
                  hideReplies: !(
                    variables?.hideReplies ??
                    preferences?.feedViewPrefs?.hideReplies
                  ),
                })
              }
            />
          </View>
          <View
            style={[pal.viewLight, styles.card, !showReplies && styles.dimmed]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              <Trans>Reply Filters</Trans>
            </Text>
            <Text style={[pal.text, s.pb10]}>
              <Trans>
                Enable this setting to only see replies between people you
                follow.
              </Trans>
            </Text>
            <ToggleButton
              type="default-light"
              label={_(msg`Followed users only`)}
              isSelected={Boolean(
                variables?.hideRepliesByUnfollowed ??
                  preferences?.feedViewPrefs?.hideRepliesByUnfollowed,
              )}
              onPress={
                showReplies
                  ? () =>
                      setFeedViewPref({
                        hideRepliesByUnfollowed: !(
                          variables?.hideRepliesByUnfollowed ??
                          preferences?.feedViewPrefs?.hideRepliesByUnfollowed
                        ),
                      })
                  : undefined
              }
              style={[s.mb10]}
            />
            <Text style={[pal.text]}>
              <Trans>
                Adjust the number of likes a reply must have to be shown in your
                feed.
              </Trans>
            </Text>
            {preferences && (
              <RepliesThresholdInput
                enabled={showReplies}
                initialValue={preferences.feedViewPrefs.hideRepliesByLikeCount}
              />
            )}
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              <Trans>Show Reposts</Trans>
            </Text>
            <Text style={[pal.text, s.pb10]}>
              <Trans>
                Set this setting to "No" to hide all reposts from your feed.
              </Trans>
            </Text>
            <ToggleButton
              type="default-light"
              label={
                variables?.hideReposts ??
                preferences?.feedViewPrefs?.hideReposts
                  ? _(msg`No`)
                  : _(msg`Yes`)
              }
              isSelected={
                !(
                  variables?.hideReposts ??
                  preferences?.feedViewPrefs?.hideReposts
                )
              }
              onPress={() =>
                setFeedViewPref({
                  hideReposts: !(
                    variables?.hideReposts ??
                    preferences?.feedViewPrefs?.hideReposts
                  ),
                })
              }
            />
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              <Trans>Show Quote Posts</Trans>
            </Text>
            <Text style={[pal.text, s.pb10]}>
              <Trans>
                Set this setting to "No" to hide all quote posts from your feed.
                Reposts will still be visible.
              </Trans>
            </Text>
            <ToggleButton
              type="default-light"
              label={
                variables?.hideQuotePosts ??
                preferences?.feedViewPrefs?.hideQuotePosts
                  ? _(msg`No`)
                  : _(msg`Yes`)
              }
              isSelected={
                !(
                  variables?.hideQuotePosts ??
                  preferences?.feedViewPrefs?.hideQuotePosts
                )
              }
              onPress={() =>
                setFeedViewPref({
                  hideQuotePosts: !(
                    variables?.hideQuotePosts ??
                    preferences?.feedViewPrefs?.hideQuotePosts
                  ),
                })
              }
            />
          </View>

          <View style={[pal.viewLight, styles.card]}>
            <Text type="title-sm" style={[pal.text, s.pb5]}>
              <FontAwesomeIcon icon="flask" color={pal.colors.text} />
              <Trans>Show Posts from My Feeds</Trans>
            </Text>
            <Text style={[pal.text, s.pb10]}>
              <Trans>
                Set this setting to "Yes" to show samples of your saved feeds in
                your Following feed. This is an experimental feature.
              </Trans>
            </Text>
            <ToggleButton
              type="default-light"
              label={
                variables?.lab_mergeFeedEnabled ??
                preferences?.feedViewPrefs?.lab_mergeFeedEnabled
                  ? _(msg`Yes`)
                  : _(msg`No`)
              }
              isSelected={
                !!(
                  variables?.lab_mergeFeedEnabled ??
                  preferences?.feedViewPrefs?.lab_mergeFeedEnabled
                )
              }
              onPress={() =>
                setFeedViewPref({
                  lab_mergeFeedEnabled: !(
                    variables?.lab_mergeFeedEnabled ??
                    preferences?.feedViewPrefs?.lab_mergeFeedEnabled
                  ),
                })
              }
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
          accessibilityLabel={_(msg`Confirm`)}
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans>Done</Trans>
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
