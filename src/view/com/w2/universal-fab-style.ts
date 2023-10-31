import {StyleSheet} from 'react-native'

const SIZE = 72

const styles = StyleSheet.create({
  fabRound: {
    position: 'absolute',
    right: 10,
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZE / 2,
  },
  fabSquare: {
    position: 'absolute',
    right: 10,
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZE / 6,
  },
})

export const fabStyleRound = styles.fabRound
export const fabStyleSquare = styles.fabSquare
