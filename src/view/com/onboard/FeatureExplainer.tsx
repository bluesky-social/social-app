import React, {useState} from 'react'
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import {TabView, SceneMap, Route, TabBarProps} from 'react-native-tab-view'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserGroupIcon} from '../../lib/icons'
import {useStores} from '../../../state'
import {s} from '../../lib/styles'
import {SCENE_EXPLAINER, TABS_EXPLAINER} from '../../lib/assets'

const Intro = () => (
  <View style={styles.explainer}>
    <Text
      style={[
        styles.explainerHeading,
        s.normal,
        {lineHeight: 60, paddingTop: 50, paddingBottom: 50},
      ]}>
      Welcome to <Text style={[s.bold, s.blue3, {fontSize: 56}]}>Bluesky</Text>
    </Text>
    <Text style={[styles.explainerDesc, {fontSize: 24}]}>
      Let's do a quick tour through the new features.
    </Text>
  </View>
)

const Scenes = () => (
  <View style={styles.explainer}>
    <View style={styles.explainerIcon}>
      <View style={s.flex1} />
      <UserGroupIcon style={s.black} size="48" />
      <View style={s.flex1} />
    </View>
    <Text style={styles.explainerHeading}>Scenes</Text>
    <Text style={styles.explainerDesc}>
      Scenes are invite-only groups of users. Follow them to see what's trending
      with the scene's members.
    </Text>
    <Text style={styles.explainerDesc}>
      <Image source={SCENE_EXPLAINER} style={styles.explainerImg} />
    </Text>
  </View>
)

const Tabs = () => (
  <View style={styles.explainer}>
    <View style={styles.explainerIcon}>
      <View style={s.flex1} />
      <FontAwesomeIcon
        icon={['far', 'clone']}
        style={[s.black, s.mb5]}
        size={36}
      />
      <View style={s.flex1} />
    </View>
    <Text style={styles.explainerHeading}>Tabs</Text>
    <Text style={styles.explainerDesc}>
      Never lose your place! Long-press on posts and links to open them in a new
      tab.
    </Text>
    <Text style={styles.explainerDesc}>
      <Image source={TABS_EXPLAINER} style={styles.explainerImg} />
    </Text>
  </View>
)

const SCENE_MAP = {
  intro: Intro,
  scenes: Scenes,
  tabs: Tabs,
}
const renderScene = SceneMap(SCENE_MAP)

export const FeatureExplainer = () => {
  const layout = useWindowDimensions()
  const store = useStores()
  const [index, setIndex] = useState(0)
  const routes = [
    {key: 'intro', title: 'Intro'},
    {key: 'scenes', title: 'Scenes'},
    {key: 'tabs', title: 'Tabs'},
  ]

  const onPressSkip = () => store.onboard.next()
  const onPressNext = () => {
    if (index >= routes.length - 1) {
      store.onboard.next()
    } else {
      setIndex(index + 1)
    }
  }

  const renderTabBar = (props: TabBarProps<Route>) => {
    const inputRange = props.navigationState.routes.map((x, i) => i)
    return (
      <View style={styles.tabBar}>
        <View style={s.flex1} />
        {props.navigationState.routes.map((route, i) => {
          const opacity = props.position.interpolate({
            inputRange,
            outputRange: inputRange.map(inputIndex =>
              inputIndex === i ? 1 : 0.5,
            ),
          })

          return (
            <TouchableOpacity
              key={i}
              style={styles.tabItem}
              onPress={() => setIndex(i)}>
              <Animated.Text style={{opacity}}>&deg;</Animated.Text>
            </TouchableOpacity>
          )
        })}
        <View style={s.flex1} />
      </View>
    )
  }

  const FirstExplainer = SCENE_MAP[routes[0]?.key as keyof typeof SCENE_MAP]
  return (
    <SafeAreaView style={styles.container}>
      {routes.length > 1 ? (
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={setIndex}
          initialLayout={{width: layout.width}}
          tabBarPosition="bottom"
        />
      ) : FirstExplainer ? (
        <FirstExplainer />
      ) : (
        <View />
      )}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onPressSkip}>
          <Text style={[s.blue3, s.f18]}>Skip</Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressNext}>
          <Text style={[s.blue3, s.f18]}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    alignItems: 'center',
    padding: 16,
  },

  explainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 80,
  },
  explainerIcon: {
    flexDirection: 'row',
  },
  explainerHeading: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  explainerDesc: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  explainerImg: {
    resizeMode: 'contain',
    maxWidth: '100%',
    maxHeight: 330,
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
})
