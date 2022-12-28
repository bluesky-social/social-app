import React, {useState} from 'react'
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet'
import {Text} from '../util/text/Text'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'
import {
  LOCAL_DEV_SERVICE,
  STAGING_SERVICE,
  PROD_SERVICE,
} from '../../../state/index'
import {LOGIN_INCLUDE_DEV_SERVERS} from '../../../build-flags'

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
      <BottomSheetScrollView style={styles.inner}>
        <View style={styles.group}>
          {LOGIN_INCLUDE_DEV_SERVERS ? (
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
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="e.g. https://bsky.app"
              placeholderTextColor={colors.gray4}
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
                style={[s.black, styles.checkIcon]}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetScrollView>
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
    color: colors.black,
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
  checkIcon: {
    position: 'relative',
    ...Platform.select({
      android: {
        top: 8,
      },
      ios: {
        top: 2,
      },
    }),
  },
})
