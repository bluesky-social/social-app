import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {SearchUIModel} from 'state/models/ui/search'
import {Pager, RenderTabBarFnProps} from 'view/com/util/pager/Pager'
import {TabBar} from 'view/com/util/TabBar'
import {Post} from 'view/com/post/Post'
import {ProfileCardWithFollowBtn} from 'view/com/profile/ProfileCard'
import {
  PostFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'

const SECTIONS = ['Posts', 'Users']

export const SearchResults = observer(({model}: {model: SearchUIModel}) => {
  const pal = usePalette('default')

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <View style={[pal.border, styles.tabBar]}>
          <TabBar {...props} items={SECTIONS} />
        </View>
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
    return <PostFeedLoadingPlaceholder />
  }

  if (model.postUris.length === 0) {
    return (
      <Text type="xl" style={[styles.empty, pal.text]}>
        No posts found for "{model.query}"
      </Text>
    )
  }

  return (
    <ScrollView style={pal.view}>
      {model.postUris.map(uri => (
        <Post key={uri} uri={uri} hideError />
      ))}
    </ScrollView>
  )
})

const Profiles = observer(({model}: {model: SearchUIModel}) => {
  const pal = usePalette('default')
  if (model.isProfilesLoading) {
    return <ProfileCardFeedLoadingPlaceholder />
  }

  if (model.profiles.length === 0) {
    return (
      <Text type="xl" style={[styles.empty, pal.text]}>
        No users found for "{model.query}"
      </Text>
    )
  }

  return (
    <ScrollView style={pal.view}>
      {model.profiles.map(item => (
        <ProfileCardWithFollowBtn
          did={item.did}
          declarationCid={item.declaration.cid}
          handle={item.handle}
          displayName={item.displayName}
          avatar={item.avatar}
          description={item.description}
        />
      ))}
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
