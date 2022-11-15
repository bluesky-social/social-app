import React, {useState} from 'react'
import Toast from '../util/Toast'
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import LinearGradient from 'react-native-linear-gradient'
import {ErrorMessage} from '../util/ErrorMessage'
import {useStores} from '../../../state'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {s, colors, gradients} from '../../lib/styles'
import {enforceLen, MAX_DISPLAY_NAME, MAX_DESCRIPTION} from '../../lib/strings'
import {
  IS_PROD_BUILD,
  LOCAL_DEV_SERVICE,
  STAGING_SERVICE,
  PROD_SERVICE,
} from '../../../state/index'

export const snapPoints = ['80%']

export function Component({
  initialService,
  onSelect,
}: {
  initialService: string
  onSelect: (url: string) => void
}) {
  const store = useStores()
  const [customUrl, setCustomUrl] = useState<string>('')

  const doSelect = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    store.shell.closeModal()
    onSelect(url)
  }

  return (
    <View style={s.flex1}>
      <Text style={[s.textCenter, s.bold, s.f18]}>Choose Service</Text>
      <View style={styles.inner}>
        <View style={styles.group}>
          {!IS_PROD_BUILD ? (
            <>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => doSelect(LOCAL_DEV_SERVICE)}>
                <Text style={styles.btnText}>Local dev server</Text>
                <FontAwesomeIcon icon="arrow-right" style={s.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => doSelect(STAGING_SERVICE)}>
                <Text style={styles.btnText}>Staging</Text>
                <FontAwesomeIcon icon="arrow-right" style={s.white} />
              </TouchableOpacity>
            </>
          ) : undefined}
          <TouchableOpacity
            style={styles.btn}
            onPress={() => doSelect(PROD_SERVICE)}>
            <Text style={styles.btnText}>Bluesky.Social</Text>
            <FontAwesomeIcon icon="arrow-right" style={s.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.group}>
          <Text style={styles.label}>Other service</Text>
          <View style={{flexDirection: 'row'}}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. https://bsky.app"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              value={customUrl}
              onChangeText={setCustomUrl}
            />
            <TouchableOpacity
              style={styles.textInputBtn}
              onPress={() => doSelect(customUrl)}>
              <FontAwesomeIcon
                icon="check"
                style={[s.black, {position: 'relative', top: 2}]}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inner: {
    padding: 14,
  },
  group: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray3,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textInputBtn: {
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.gray3,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blue3,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  btnText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: colors.white,
  },
})
