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

const SECTIONS = ['Posts', 'Users']

export const SearchResults = observer(({model}: {model: SearchUIModel}) => {
  const pal = usePalette('default')

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <CenteredView style={[pal.border, styles.tabBar]}>
          <TabBar {...props} items={SECTIONS} />
        </CenteredView>
      )
    },
    [pal],
  )

  return (
    <Pager renderTabBar={renderTabBar} tabBarPosition="top" initialPage={0}>
      <PostResults key="0" model={model} />
      <Profiles key="1" model={model} />
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

  if (model.postUris.length === 0) {
    return (
      <CenteredView>
        <Text type="xl" style={[styles.empty, pal.text]}>
          No posts found for "{model.query}"
        </Text>
      </CenteredView>
    )
  }

  return (
    <ScrollView style={pal.view}>
      {model.postUris.map(uri => (
        <Post key={uri} uri={uri} hideError />
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
        <ProfileCardWithFollowBtn
          key={item.did}
          did={item.did}
          handle={item.handle}
          displayName={item.displayName}
          avatar={item.avatar}
          description={item.description}
          labels={item.labels}
        />
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
  },
  empty: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
})
