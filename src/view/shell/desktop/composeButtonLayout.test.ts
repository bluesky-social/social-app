import {StyleSheet} from 'react-native'

import {getComposeButtonLayout} from './composeButtonLayout'

jest.mock('#/alf', () => ({
  atoms: {
    flex_row: {flexDirection: 'row'},
    pl_md: {paddingLeft: 12},
    pt_lg: {paddingTop: 16},
    px_sm: {paddingHorizontal: 8},
    rounded_full: {borderRadius: 999},
  },
}))

describe('getComposeButtonLayout', () => {
  it('fits the native compact button into the minimal rail viewport', () => {
    const styles = getComposeButtonLayout({minimal: true, isNative: true})

    expect(StyleSheet.flatten(styles.container)).toEqual({paddingTop: 16})
    expect(StyleSheet.flatten(styles.button)).toMatchObject({
      width: 48,
      height: 48,
      paddingHorizontal: 0,
      paddingVertical: 0,
    })
  })

  it('preserves the web compact and full-width layouts', () => {
    const compactWeb = getComposeButtonLayout({minimal: true, isNative: false})
    const fullWidth = getComposeButtonLayout({minimal: false, isNative: true})

    expect(StyleSheet.flatten(compactWeb.container)).toEqual({
      paddingHorizontal: 8,
      paddingTop: 16,
    })
    expect(StyleSheet.flatten(compactWeb.button)).toEqual({
      borderRadius: 999,
      width: 48,
      height: 48,
    })
    expect(StyleSheet.flatten(fullWidth.container)).toEqual({
      flexDirection: 'row',
      paddingLeft: 12,
      paddingTop: 16,
    })
    expect(StyleSheet.flatten(fullWidth.button)).toEqual({borderRadius: 999})
  })
})
