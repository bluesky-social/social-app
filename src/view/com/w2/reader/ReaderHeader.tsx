import React from 'react'
import {Text} from '../../util/text/Text'

import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'

interface Props {
  title: string
  host: string
}

export const ReaderHeader = ({title, host}: Props) => {
  const pal = usePalette('default')

  return (
    <View style={styles.container}>
      <Text type="3xl-bold" style={pal.text}>
        {title}
      </Text>
      <Text type="md" style={pal.text}>
        {host}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    gap: 2,
  },
})
