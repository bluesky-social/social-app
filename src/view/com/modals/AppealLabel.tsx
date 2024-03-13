import React, {useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {ComAtprotoModerationDefs} from '@atproto/api'
import {ScrollView, TextInput} from './util'
import {Text} from '../util/text/Text'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {CharProgress} from '../composer/char-progress/CharProgress'
import {getAgent} from '#/state/session'
import * as Toast from '../util/Toast'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export const snapPoints = ['40%']

type ReportComponentProps =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export function Component(props: ReportComponentProps) {
  const pal = usePalette('default')
  const [details, setDetails] = useState<string>('')
  const {_} = useLingui()
  const {closeModal} = useModalControls()
  const {isMobile} = useWebMediaQueries()
  const isAccountReport = 'did' in props

  const submit = async () => {
    try {
      const $type = !isAccountReport
        ? 'com.atproto.repo.strongRef'
        : 'com.atproto.admin.defs#repoRef'
      await getAgent().createModerationReport({
        reasonType: ComAtprotoModerationDefs.REASONAPPEAL,
        subject: {
          $type,
          ...props,
        },
        reason: details,
      })
      Toast.show(_(msg`We'll look into your appeal promptly.`))
    } finally {
      closeModal()
    }
  }

  return (
    <View
      style={[
        pal.view,
        s.flex1,
        isMobile ? {paddingHorizontal: 12} : undefined,
      ]}
      testID="appealLabelModal">
      <Text
        type="2xl-bold"
        style={[pal.text, s.textCenter, {paddingBottom: 8}]}>
        <Trans>Appeal Content Warning</Trans>
      </Text>
      <ScrollView>
        <View style={[pal.btn, styles.detailsInputContainer]}>
          <TextInput
            accessibilityLabel={_(msg`Text input field`)}
            accessibilityHint={_(
              msg`Please tell us why you think this content warning was incorrectly applied!`,
            )}
            placeholder={_(
              msg`Please tell us why you think this content warning was incorrectly applied!`,
            )}
            placeholderTextColor={pal.textLight.color}
            value={details}
            onChangeText={setDetails}
            autoFocus={true}
            numberOfLines={3}
            multiline={true}
            textAlignVertical="top"
            maxLength={300}
            style={[styles.detailsInput, pal.text]}
          />
          <View style={styles.detailsInputBottomBar}>
            <View style={styles.charCounter}>
              <CharProgress count={details?.length || 0} />
            </View>
          </View>
        </View>
        <TouchableOpacity
          testID="confirmBtn"
          onPress={submit}
          style={styles.btn}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Confirm`)}
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans>Submit</Trans>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  detailsInputContainer: {
    borderRadius: 8,
    marginBottom: 8,
  },
  detailsInput: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 8,
    minHeight: 100,
    fontSize: 16,
  },
  detailsInputBottomBar: {
    alignSelf: 'flex-end',
  },
  charCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    paddingBottom: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
})
