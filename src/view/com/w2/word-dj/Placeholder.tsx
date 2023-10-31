import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native'
import {TextPlusIcon} from 'lib/icons-w2'
import {Text} from 'view/com/util/text/Text'

const TEXT = 'Add text'
const LOADING = 'Generating...'

interface Props {
  forBlock: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

export const Placeholder = ({forBlock, loading, style}: Props) => {
  const pal = usePalette('primary')

  return (
    <View style={[styles.container, pal.viewLight, pal.borderDark, style]}>
      {!forBlock && (
        <>
          <TextPlusIcon style={pal.textLight} />
          <Text type="lg-medium" style={[styles.text, pal.textLight]}>
            {loading ? LOADING : TEXT}
          </Text>
          {loading ? (
            <View style={styles.spinner}>
              <ActivityIndicator size="small" color={pal.textLight.color} />
            </View>
          ) : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
    borderWidth: 2,
    borderStyle: `dashed`,
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
  spinner: {
    paddingHorizontal: 10,
  },
})
