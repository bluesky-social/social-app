import {
  DimensionValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {s} from '#/lib/styles'
import {useTheme} from '#/lib/ThemeContext'
import {atoms as a, useTheme as useTheme_NEW} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as Bubble} from '#/components/icons/Bubble'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2'
import {PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'

export function LoadingPlaceholder({
  width,
  height,
  style,
}: {
  width: DimensionValue
  height: DimensionValue
  style?: StyleProp<ViewStyle>
}) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.loadingPlaceholder,
        {
          width,
          height,
          backgroundColor: theme.palette.default.backgroundLight,
        },
        style,
      ]}
    />
  )
}

export function PostLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme_NEW()
  const pal = usePalette('default')

  const buttonIconStyle = [
    {
      color: t.palette.contrast_500,
    },
    styles.postBtnIcon,
  ]

  return (
    <View style={[styles.post, pal.view, style]}>
      <LoadingPlaceholder
        width={42}
        height={42}
        style={[
          styles.avatar,
          {
            position: 'relative',
            top: -6,
          },
        ]}
      />
      <View style={[s.flex1]}>
        <View style={[s.flexRow, a.gap_sm, {marginBottom: 10}]}>
          <LoadingPlaceholder
            width={`${Math.floor(Math.random() * 10 + 15)}%`}
            height={8}
          />
          <LoadingPlaceholder
            width={`${Math.floor(Math.random() * 15 + 25)}%`}
            height={8}
          />
        </View>
        <LoadingPlaceholder
          width={`${Math.floor(Math.random() * 7 + 90)}%`}
          height={6}
          style={{marginBottom: 8}}
        />
        <LoadingPlaceholder
          width={`${Math.floor(Math.random() * 7 + 90)}%`}
          height={6}
          style={{marginBottom: 8}}
        />
        <LoadingPlaceholder
          width={`${Math.floor(Math.random() * 30 + 50)}%`}
          height={6}
          style={{marginBottom: 11}}
        />
        {Math.random() <= 0.4 && (
          <LoadingPlaceholder
            width="99%"
            height={Math.floor(Math.random() * 100 + 120)}
            style={[a.rounded_md, {marginBottom: 8}]}
          />
        )}
        <View style={styles.postCtrls}>
          <View style={[styles.postCtrl, {marginLeft: -6}]}>
            <View style={styles.postBtn}>
              <Bubble style={buttonIconStyle} width={18} />
              <LoadingPlaceholder width={18} height={10} />
            </View>
          </View>
          <View style={styles.postCtrl}>
            <View style={styles.postBtn}>
              <Repost style={buttonIconStyle} width={18} />
              <LoadingPlaceholder width={18} height={10} />
            </View>
          </View>
          <View style={styles.postCtrl}>
            <View style={styles.postBtn}>
              <HeartIconOutline style={buttonIconStyle} width={18} />
              <LoadingPlaceholder width={18} height={10} />
            </View>
          </View>
          <View style={styles.postCtrl}>
            <View style={styles.postBtn}>
              <DotsHorizontal style={buttonIconStyle} width={18} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export function PostFeedLoadingPlaceholder() {
  return (
    <View>
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
      <PostLoadingPlaceholder />
    </View>
  )
}

export function NotificationLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')

  const isFollow = Math.random() <= 0.33
  const Icon = isFollow ? PersonPlusIcon : HeartIconFilled

  return (
    <View style={[styles.notification, pal.view, style]}>
      <View style={[{width: 60}, a.align_end, a.pr_sm, a.pt_2xs]}>
        <Icon size="xl" style={{color: pal.colors.backgroundLight}} />
      </View>
      <View style={{flex: 1}}>
        <View style={[a.flex_row, s.mb10]}>
          {Array.from({length: Math.floor(Math.random() * 4 + 1)}, (_, i) => (
            <LoadingPlaceholder
              key={i}
              width={35}
              height={35}
              style={styles.smallAvatar}
            />
          ))}
        </View>
        <LoadingPlaceholder width="90%" height={8} style={[s.mb5]} />
        {!isFollow && (
          <LoadingPlaceholder
            width={`${Math.floor(Math.random() * 50 + 30)}%`}
            height={8}
            style={[s.mb5]}
          />
        )}
      </View>
    </View>
  )
}

export function NotificationFeedLoadingPlaceholder() {
  return (
    <>
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
      <NotificationLoadingPlaceholder />
    </>
  )
}

export function ProfileCardLoadingPlaceholder({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  return (
    <View style={[styles.profileCard, pal.view, style]}>
      <LoadingPlaceholder
        width={40}
        height={40}
        style={styles.profileCardAvi}
      />
      <View>
        <LoadingPlaceholder width={140} height={8} style={[s.mb5]} />
        <LoadingPlaceholder width={120} height={8} style={[s.mb10]} />
        <LoadingPlaceholder width={220} height={8} style={[s.mb5]} />
      </View>
    </View>
  )
}

export function ProfileCardFeedLoadingPlaceholder() {
  return (
    <>
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
      <ProfileCardLoadingPlaceholder />
    </>
  )
}

export function FeedLoadingPlaceholder({
  style,
  showLowerPlaceholder = true,
  showTopBorder = true,
}: {
  style?: StyleProp<ViewStyle>
  showTopBorder?: boolean
  showLowerPlaceholder?: boolean
}) {
  const pal = usePalette('default')
  return (
    <View
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 18,
          borderTopWidth: showTopBorder ? StyleSheet.hairlineWidth : 0,
        },
        pal.border,
        style,
      ]}>
      <View style={[pal.view, {flexDirection: 'row'}]}>
        <LoadingPlaceholder
          width={36}
          height={36}
          style={[styles.avatar, {borderRadius: 6}]}
        />
        <View style={[s.flex1]}>
          <LoadingPlaceholder width={100} height={8} style={[s.mt5, s.mb10]} />
          <LoadingPlaceholder width={120} height={8} />
        </View>
      </View>
      {showLowerPlaceholder && (
        <View style={{paddingHorizontal: 5, marginTop: 10}}>
          <LoadingPlaceholder
            width={260}
            height={8}
            style={{marginVertical: 12}}
          />
          <LoadingPlaceholder width={120} height={8} />
        </View>
      )}
    </View>
  )
}

export function FeedFeedLoadingPlaceholder() {
  return (
    <>
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
      <FeedLoadingPlaceholder />
    </>
  )
}

const styles = StyleSheet.create({
  loadingPlaceholder: {
    borderRadius: 6,
  },
  post: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 10,
    paddingTop: 20,
    paddingBottom: 5,
    paddingRight: 15,
  },
  postCtrls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postCtrl: {
    flex: 1,
  },
  postBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    gap: 4,
  },
  postBtnIcon: {
    opacity: 0.4,
    pointerEvents: 'none',
  },
  avatar: {
    borderRadius: 999,
    marginRight: 10,
    marginLeft: 8,
  },
  notification: {
    flexDirection: 'row',
    padding: 10,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 10,
    margin: 1,
  },
  profileCardAvi: {
    borderRadius: 999,
    marginRight: 10,
  },
  smallAvatar: {
    borderRadius: 999,
    marginRight: 10,
  },
})
