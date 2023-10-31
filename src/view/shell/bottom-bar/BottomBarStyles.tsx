import {StyleSheet} from 'react-native'
import {colors} from 'lib/styles'

export const styles = StyleSheet.create({
  stack: {
    //position: 'absolute',
    // top: 0,
    // bottom: 0,
    // left: 0,
    // right: 0,
    flexDirection: 'column',
    // gap: 0,
    // borderTopWidth: 0,
    // paddingTop: 0,
    // paddingLeft: 5,
    // paddingRight: 10,
    // marginBottom: -4,
  },
  thumb: {
    flex: 1,
    height: 6,
    top: -1,
    backgroundColor: colors.waverly1,
    marginBottom: 9,
  },
  thumbBlank: {
    flex: 1,
    height: 6,
    marginBottom: 9,
  },
  labelView: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 2,
    flex: 1,
  },
  labelTextActive: {
    fontSize: 11,
    color: colors.waverly1,
  },
  labelTextInactive: {
    fontSize: 11,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    // paddingLeft: 5, // Removed so the thumb goes right to left screen edge.
    paddingRight: 10,
  },
  ctrl: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 15,
  },
  ctrlNoTopPadding: {
    flex: 1,
    paddingBottom: 15,
  },
  notificationCount: {
    position: 'absolute',
    left: '52%',
    top: 8,
    backgroundColor: colors.blue3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
    zIndex: 1,
  },
  notificationCountLight: {
    borderColor: colors.white,
  },
  notificationCountDark: {
    borderColor: colors.gray8,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctrlIconSizingWrapper: {
    height: 27,
  },
  homeIcon: {
    top: 0,
  },
  feedsIcon: {
    top: -2,
  },
  searchIcon: {
    top: -1.5,
    left: -2,
  },
  bellIcon: {
    top: -2.5,
  },
  createIcon: {
    top: -3.5,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  profileIcon: {
    top: -4,
  },
  onProfile: {
    borderWidth: 1,
    borderRadius: 100,
  },
  disabled: {
    pointerEvents: 'none',
  },
})
