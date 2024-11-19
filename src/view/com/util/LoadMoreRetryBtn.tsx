import {StyleSheet} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import {usePalette} from '#/lib/hooks/usePalette'
import {Button} from './forms/Button'
import {Text} from './text/Text'

export function LoadMoreRetryBtn({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  const pal = usePalette('default')
  return (
    <Button type="default-light" onPress={onPress} style={styles.loadMoreRetry}>
      <FontAwesomeIcon
        icon="arrow-rotate-left"
        style={pal.textLight as FontAwesomeIconStyle}
        size={18}
      />
      <Text style={[pal.textLight, styles.label]}>{label}</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  loadMoreRetry: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderRadius: 0,
    marginTop: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  label: {
    flex: 1,
  },
})
