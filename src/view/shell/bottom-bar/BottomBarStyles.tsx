import {StyleSheet} from 'react-native'

import {colors} from '#/lib/styles'
import {atoms as a} from '#/alf'

export const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingLeft: 5,
    paddingRight: 10,
  },
  bottomBarWeb: a.fixed,
  ctrl: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 4,
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
  notificationCountWeb: {
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 12,
  },
  notificationCountLight: {
    borderColor: colors.white,
  },
  notificationCountDark: {
    borderColor: colors.gray8,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  hasNewBadge: {
    position: 'absolute',
    left: '54%',
    marginLeft: 4,
    top: 10,
    width: 8,
    height: 8,
    backgroundColor: colors.blue3,
    borderRadius: 6,
    zIndex: 1,
  },
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ctrlIconSizingWrapper: {},
  homeIcon: {},
  feedsIcon: {},
  searchIcon: {
    top: -1,
  },
  bellIcon: {},
  profileIcon: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  messagesIcon: {},
  onProfile: {
    borderWidth: 1,
    borderRadius: 100,
  },
})
