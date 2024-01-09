import React from 'react'
import {LabelPreference} from '@atproto/api'
import {StyleSheet, Pressable, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {ScrollView} from './util'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {ToggleButton} from '../util/forms/ToggleButton'
import {Button} from '../util/forms/Button'
import {usePalette} from 'lib/hooks/usePalette'
import {isIOS} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import * as Toast from '../util/Toast'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
  usePreferencesSetAdultContentMutation,
  ConfigurableLabelGroup,
  CONFIGURABLE_LABEL_GROUPS,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'

export const snapPoints = ['90%']

export function Component({}: {}) {
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const {data: preferences} = usePreferencesQuery()

  const onPressDone = React.useCallback(() => {
    closeModal()
  }, [closeModal])

  return (
    <View testID="contentFilteringModal" style={[pal.view, styles.container]}>
      <Text style={[pal.text, styles.title]}>
        <Trans>Content Filtering</Trans>
      </Text>

      <ScrollView style={styles.scrollContainer}>
        <AdultContentEnabledPref />
        <ContentLabelPref
          preferences={preferences}
          labelGroup="nsfw"
          disabled={!preferences?.adultContentEnabled}
        />
        <ContentLabelPref
          preferences={preferences}
          labelGroup="nudity"
          disabled={!preferences?.adultContentEnabled}
        />
        <ContentLabelPref
          preferences={preferences}
          labelGroup="suggestive"
          disabled={!preferences?.adultContentEnabled}
        />
        <ContentLabelPref
          preferences={preferences}
          labelGroup="gore"
          disabled={!preferences?.adultContentEnabled}
        />
        <ContentLabelPref preferences={preferences} labelGroup="hate" />
        <ContentLabelPref preferences={preferences} labelGroup="spam" />
        <ContentLabelPref
          preferences={preferences}
          labelGroup="impersonation"
        />
        <View style={{height: isMobile ? 60 : 0}} />
      </ScrollView>

      <View
        style={[
          styles.btnContainer,
          isMobile && styles.btnContainerMobile,
          pal.borderDark,
        ]}>
        <Pressable
          testID="sendReportBtn"
          onPress={onPressDone}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Done`)}
          accessibilityHint="">
          <LinearGradient
            colors={[gradients.blueLight.start, gradients.blueLight.end]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.btn]}>
            <Text style={[s.white, s.bold, s.f18]}>
              <Trans>Done</Trans>
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

function AdultContentEnabledPref() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetAdultContentMutation()
  const {openModal} = useModalControls()

  const onSetAge = React.useCallback(
    () => openModal({name: 'birth-date-settings'}),
    [openModal],
  )

  const onToggleAdultContent = React.useCallback(async () => {
    if (isIOS) return

    try {
      mutate({
        enabled: !(variables?.enabled ?? preferences?.adultContentEnabled),
      })
    } catch (e) {
      Toast.show(
        _(msg`There was an issue syncing your preferences with the server`),
      )
      logger.error('Failed to update preferences with server', {error: e})
    }
  }, [variables, preferences, mutate, _])

  return (
    <View style={s.mb10}>
      {isIOS ? (
        preferences?.adultContentEnabled ? null : (
          <Text type="md" style={pal.textLight}>
            <Trans>
              Adult content can only be enabled via the Web at{' '}
              <TextLink
                style={pal.link}
                href="https://bsky.app"
                text="bsky.app"
              />
              .
            </Trans>
          </Text>
        )
      ) : typeof preferences?.birthDate === 'undefined' ? (
        <View style={[pal.viewLight, styles.agePrompt]}>
          <Text type="md" style={[pal.text, {flex: 1}]}>
            <Trans>Confirm your age to enable adult content.</Trans>
          </Text>
          <Button
            type="primary"
            label={_(msg({message: 'Set Age', context: 'action'}))}
            onPress={onSetAge}
          />
        </View>
      ) : (preferences.userAge || 0) >= 18 ? (
        <ToggleButton
          type="default-light"
          label={_(msg`Enable Adult Content`)}
          isSelected={variables?.enabled ?? preferences?.adultContentEnabled}
          onPress={onToggleAdultContent}
          style={styles.toggleBtn}
        />
      ) : (
        <View style={[pal.viewLight, styles.agePrompt]}>
          <Text type="md" style={[pal.text, {flex: 1}]}>
            <Trans>You must be 18 or older to enable adult content.</Trans>
          </Text>
          <Button
            type="primary"
            label={_(msg({message: 'Set Age', context: 'action'}))}
            onPress={onSetAge}
          />
        </View>
      )}
    </View>
  )
}

// TODO: Refactor this component to pass labels down to each tab
function ContentLabelPref({
  preferences,
  labelGroup,
  disabled,
}: {
  preferences?: UsePreferencesQueryResponse
  labelGroup: ConfigurableLabelGroup
  disabled?: boolean
}) {
  const pal = usePalette('default')
  const visibility = preferences?.contentLabels?.[labelGroup]
  const {mutate, variables} = usePreferencesSetContentLabelMutation()

  const onChange = React.useCallback(
    (vis: LabelPreference) => {
      mutate({labelGroup, visibility: vis})
    },
    [mutate, labelGroup],
  )

  return (
    <View style={[styles.contentLabelPref, pal.border]}>
      <View style={s.flex1}>
        <Text type="md-medium" style={[pal.text]}>
          {CONFIGURABLE_LABEL_GROUPS[labelGroup].title}
        </Text>
        {typeof CONFIGURABLE_LABEL_GROUPS[labelGroup].subtitle === 'string' && (
          <Text type="sm" style={[pal.textLight]}>
            {CONFIGURABLE_LABEL_GROUPS[labelGroup].subtitle}
          </Text>
        )}
      </View>

      {disabled || !visibility ? (
        <Text type="sm-bold" style={pal.textLight}>
          <Trans context="action">Hide</Trans>
        </Text>
      ) : (
        <SelectGroup
          current={variables?.visibility || visibility}
          onChange={onChange}
          labelGroup={labelGroup}
        />
      )}
    </View>
  )
}

interface SelectGroupProps {
  current: LabelPreference
  onChange: (v: LabelPreference) => void
  labelGroup: ConfigurableLabelGroup
}

function SelectGroup({current, onChange, labelGroup}: SelectGroupProps) {
  const {_} = useLingui()

  return (
    <View style={styles.selectableBtns}>
      <SelectableBtn
        current={current}
        value="hide"
        label={_(msg`Hide`)}
        left
        onChange={onChange}
        labelGroup={labelGroup}
      />
      <SelectableBtn
        current={current}
        value="warn"
        label={_(msg`Warn`)}
        onChange={onChange}
        labelGroup={labelGroup}
      />
      <SelectableBtn
        current={current}
        value="ignore"
        label={_(msg`Show`)}
        right
        onChange={onChange}
        labelGroup={labelGroup}
      />
    </View>
  )
}

interface SelectableBtnProps {
  current: string
  value: LabelPreference
  label: string
  left?: boolean
  right?: boolean
  onChange: (v: LabelPreference) => void
  labelGroup: ConfigurableLabelGroup
}

function SelectableBtn({
  current,
  value,
  label,
  left,
  right,
  onChange,
  labelGroup,
}: SelectableBtnProps) {
  const pal = usePalette('default')
  const palPrimary = usePalette('inverted')
  const {_} = useLingui()

  return (
    <Pressable
      style={[
        styles.selectableBtn,
        left && styles.selectableBtnLeft,
        right && styles.selectableBtnRight,
        pal.border,
        current === value ? palPrimary.view : pal.view,
      ]}
      onPress={() => onChange(value)}
      accessibilityRole="button"
      accessibilityLabel={value}
      accessibilityHint={_(
        msg`Set ${value} for ${labelGroup} content moderation policy`,
      )}>
      <Text style={current === value ? palPrimary.text : pal.text}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  btnContainer: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  btnContainerMobile: {
    paddingBottom: 40,
    borderTopWidth: 1,
  },

  agePrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  contentLabelPref: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingLeft: 4,
    marginBottom: 14,
    borderTopWidth: 1,
  },

  selectableBtns: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  selectableBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  selectableBtnLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderLeftWidth: 1,
  },
  selectableBtnRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
  toggleBtn: {
    paddingHorizontal: 0,
  },
})
