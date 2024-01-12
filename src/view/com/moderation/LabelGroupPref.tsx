import React from 'react'
import {LabelPreference} from '@atproto/api'
import {StyleSheet, Pressable, View} from 'react-native'
import {s} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  usePreferencesSetContentLabelMutation,
  ConfigurableLabelGroup,
  CONFIGURABLE_LABEL_GROUPS,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'

export function LabelGroupPref({
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
    <View style={[styles.labelGroupPref, pal.border]}>
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
  labelGroupPref: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
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
})
