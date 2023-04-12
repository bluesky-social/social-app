import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {getLabelValueGroup} from 'lib/labeling/helpers'

export function ProfileHeaderLabels({
  labels,
}: {
  labels: ComAtprotoLabelDefs.Label[] | undefined
}) {
  const palErr = usePalette('error')
  if (!labels?.length) {
    return null
  }
  return (
    <>
      {labels.map((label, i) => {
        const labelGroup = getLabelValueGroup(label?.val || '')
        return (
          <View
            key={`${label.val}-${i}`}
            style={[styles.container, palErr.border, palErr.view]}>
            <FontAwesomeIcon
              icon="circle-exclamation"
              style={palErr.text as FontAwesomeIconStyle}
              size={20}
            />
            <Text style={palErr.text}>
              This account has been flagged for{' '}
              {labelGroup.title.toLocaleLowerCase()}.
            </Text>
          </View>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
})
