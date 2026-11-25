import {StyleSheet} from 'react-native'

import {extractPadding} from './flatten'

describe('extractPadding', () => {
  it('defaults missing styles to zero', () => {
    expect(extractPadding()).toEqual({
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    })
  })

  it('resolves nested style arrays with edge, axis, then shorthand precedence', () => {
    const styles = StyleSheet.create({
      base: {padding: 12},
      axes: {paddingVertical: 8, paddingHorizontal: 10},
      edges: {paddingTop: 4, paddingRight: 6},
    })

    expect(
      extractPadding([styles.base, false, [styles.axes, styles.edges]]),
    ).toEqual({
      paddingTop: 4,
      paddingBottom: 8,
      paddingLeft: 10,
      paddingRight: 6,
    })
  })

  it('preserves explicit zero axis padding over shorthand padding', () => {
    expect(
      extractPadding({padding: 12, paddingVertical: 0, paddingHorizontal: 0}),
    ).toEqual({
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    })
  })

  it('preserves explicit zero edges over axis and shorthand padding', () => {
    expect(
      extractPadding({
        padding: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        paddingTop: 0,
        paddingRight: 0,
      }),
    ).toEqual({
      paddingTop: 0,
      paddingBottom: 8,
      paddingLeft: 10,
      paddingRight: 0,
    })
  })
})
