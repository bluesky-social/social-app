import {colors} from 'lib/styles'
import {StyleSheet} from 'react-native'

import {isWeb} from '#/platform/detection'

export const styles = StyleSheet.create({
  screenTitle: {
    marginBottom: 10,
    marginHorizontal: 20,
  },
  instructions: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  group: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  groupLabel: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  groupContent: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noTopBorder: {
    borderTopWidth: 0,
  },
  groupContentIcon: {
    marginLeft: 10,
  },
  account: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  accountLast: {
    borderBottomWidth: 1,
    marginBottom: 20,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    letterSpacing: 0.25,
    fontWeight: '400',
    borderRadius: 10,
  },
  textInputInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  textBtn: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  textBtnLabel: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textBtnFakeInnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 6,
  },
  accountText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
  },
  accountTextOther: {
    paddingLeft: 12,
  },
  error: {
    backgroundColor: colors.red4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.white,
    color: colors.white,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  dimmed: {opacity: 0.5},

  maxHeight: {
    // @ts-ignore web only -prf
    maxHeight: isWeb ? '100vh' : undefined,
    height: !isWeb ? '100%' : undefined,
  },
})
