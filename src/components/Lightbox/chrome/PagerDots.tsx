import {StyleSheet, View} from 'react-native'
import {BlurView} from 'expo-blur'

type Props = {
  count: number
  activeIndex: number
}

const ACTIVE = 6
const INACTIVE = 4
const GAP = 5

export function PagerDots({count, activeIndex}: Props) {
  if (count <= 1) return null
  return (
    <View style={styles.root}>
      <BlurView intensity={20} tint="dark" style={styles.inner}>
        {Array.from({length: count}).map((_, i) => {
          const isActive = i === activeIndex
          return (
            <View
              key={i}
              style={[
                isActive ? styles.active : styles.inactive,
                isActive ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          )
        })}
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  activeDot: {
    width: ACTIVE,
    height: ACTIVE,
    borderRadius: ACTIVE / 2,
  },
  inactiveDot: {
    width: INACTIVE,
    height: INACTIVE,
    borderRadius: INACTIVE / 2,
  },
  active: {
    backgroundColor: '#fff',
  },
  inactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
})
