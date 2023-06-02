import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {SearchUIModel} from 'state/models/ui/search'
import {CenteredView, ScrollView} from '../util/Views'
import {Pager, RenderTabBarFnProps} from 'view/com/pager/Pager'
import {TabBar} from 'view/com/pager/TabBar'
import {Post} from 'view/com/post/Post'
import {ProfileCardWithFollowBtn} from 'view/com/profile/ProfileCard'
import {
  PostFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {isDesktopWeb} from 'platform/detection'

const SECTIONS = ['Posts', 'Users']

export const SearchResults = observer(({model}: {model: SearchUIModel}) => {
  const pal = usePalette('default')

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <CenteredView style={[pal.border, pal.view, styles.tabBar]}>
          <TabBar
            items={SECTIONS}
            {...props}
            key={SECTIONS.join()}
            indicatorColor={pal.colors.link}
          />
        </CenteredView>
      )
    },
    [pal],
  )

  return (
    <Pager renderTabBar={renderTabBar} tabBarPosition="top" initialPage={0}>
      <View style={[styles.results]}>
        <PostResults key="0" model={model} />
      </View>
      <View style={[styles.results]}>
        <Profiles key="1" model={model} />
      </View>
    </Pager>
  )
})

const PostResults = observer(({model}: {model: SearchUIModel}) => {
  const pal = usePalette('default')
  if (model.isPostsLoading) {
    return (
      <CenteredView>
        <PostFeedLoadingPlaceholder />
      </CenteredView>
    )
  }

  if (model.posts.length === 0) {
    return (
      <CenteredView>
        <Text type="xl" style={[styles.empty, pal.text]}>
          No posts found for "{model.query}"
        </Text>
      </CenteredView>
    )
  }

  return (
    <ScrollView style={[pal.view]}>
      {model.posts.map(post => (
        <Post
          key={post.resolvedUri}
          uri={post.resolvedUri}
          initView={post}
          hideError
        />
      ))}
      <View style={s.footerSpacer} />
      <View style={s.footerSpacer} />
      <View style={s.footerSpacer} />
    </ScrollView>
  )
})

const Profiles = observer(({model}: {model: SearchUIModel}) => {
  const pal = usePalette('default')
  if (model.isProfilesLoading) {
    return (
      <CenteredView>
        <ProfileCardFeedLoadingPlaceholder />
      </CenteredView>
    )
  }

  if (model.profiles.length === 0) {
    return (
      <CenteredView>
        <Text type="xl" style={[styles.empty, pal.text]}>
          No users found for "{model.query}"
        </Text>
      </CenteredView>
    )
  }

  return (
    <ScrollView style={pal.view}>
      {model.profiles.map(item => (
        <ProfileCardWithFollowBtn key={item.did} profile={item} />
      ))}
      <View style={s.footerSpacer} />
      <View style={s.footerSpacer} />
      <View style={s.footerSpacer} />
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  tabBar: {
    borderBottomWidth: 1,
    position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'column',
    alignItems: 'center',
  },
  empty: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  results: {
    paddingTop: isDesktopWeb ? 50 : 42,
  },
})
