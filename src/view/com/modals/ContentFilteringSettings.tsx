import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {LabelPreference} from 'state/models/ui/preferences'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {CONFIGURABLE_LABEL_GROUPS} from 'lib/labeling/const'

export const snapPoints = [500]

export function Component({}: {}) {
  const store = useStores()
  const pal = usePalette('default')
  const onPressDone = React.useCallback(() => {
    store.shell.closeModal()
  }, [store])

  return (
    <View testID="reportPostModal" style={[pal.view, styles.container]}>
      <Text style={[pal.text, styles.title]}>Content Filtering</Text>
      <ContentLabelPref group="nsfw" />
      <ContentLabelPref group="gore" />
      <ContentLabelPref group="hate" />
      <ContentLabelPref group="spam" />
      <ContentLabelPref group="impersonation" />
      <View style={s.flex1} />
      <TouchableOpacity testID="sendReportBtn" onPress={onPressDone}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>Done</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const ContentLabelPref = observer(
  ({group}: {group: keyof typeof CONFIGURABLE_LABEL_GROUPS}) => {
    const store = useStores()
    const pal = usePalette('default')
    return (
      <View style={[styles.contentLabelPref, pal.border]}>
        <Text type="md-medium" style={[pal.text]}>
          {CONFIGURABLE_LABEL_GROUPS[group].title}
        </Text>
        <SelectGroup
          current={store.preferences.contentLabels[group]}
          onChange={v => store.preferences.setContentLabelPref(group, v)}
        />
      </View>
    )
  },
)

function SelectGroup({
  current,
  onChange,
}: {
  current: LabelPreference
  onChange: (v: LabelPreference) => void
}) {
  return (
    <View style={styles.selectableBtns}>
      <SelectableBtn
        current={current}
        value="hide"
        label="Hide"
        left
        onChange={onChange}
      />
      <SelectableBtn
        current={current}
        value="warn"
        label="Warn"
        onChange={onChange}
      />
      <SelectableBtn
        current={current}
        value="show"
        label="Show"
        right
        onChange={onChange}
      />
    </View>
  )
}

function SelectableBtn({
  current,
  value,
  label,
  left,
  right,
  onChange,
}: {
  current: string
  value: LabelPreference
  label: string
  left?: boolean
  right?: boolean
  onChange: (v: LabelPreference) => void
}) {
  const pal = usePalette('default')
  const palPrimary = usePalette('inverted')
  return (
    <TouchableOpacity
      style={[
        styles.selectableBtn,
        left && styles.selectableBtnLeft,
        right && styles.selectableBtnRight,
        pal.border,
        current === value ? palPrimary.view : pal.view,
      ]}
      onPress={() => onChange(value)}>
      <Text style={current === value ? palPrimary.text : pal.text}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 40,
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

  contentLabelPref: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingLeft: 4,
    marginBottom: 10,
    borderTopWidth: 1,
  },

  selectableBtns: {
    flexDirection: 'row',
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
})
