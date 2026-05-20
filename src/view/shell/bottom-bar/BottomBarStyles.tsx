import {StyleSheet} from 'react-native'

import {atoms as a, tokens} from '#/alf'

export const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingLeft: tokens.space.sm,
    paddingRight: tokens.space.sm,
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
    paddingHorizontal: 5,
    paddingTop: 1,
    paddingBottom: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  notificationCountWeb: {
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 12,
  },
  notificationCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  hasNewBadge: {
    position: 'absolute',
    left: '54%',
    marginLeft: 4,
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
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
