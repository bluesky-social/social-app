import React, {useState} from 'react'
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import {TabView, SceneMap, Route, TabBarProps} from 'react-native-tab-view'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {TABS_EXPLAINER} from 'lib/assets'
import {TABS_ENABLED} from 'lib/build-flags'

const ROUTES = TABS_ENABLED
  ? [
      {key: 'intro', title: 'Intro'},
      {key: 'tabs', title: 'Tabs'},
    ]
  : [{key: 'intro', title: 'Intro'}]

const Intro = () => (
  <View style={styles.explainer}>
    <Text
      style={[styles.explainerHeading, s.normal, styles.explainerHeadingIntro]}>
      Welcome to{' '}
      <Text style={[s.bold, s.blue3, styles.explainerHeadingBrand]}>
        Bluesky
      </Text>
    </Text>
    <Text style={[styles.explainerDesc, styles.explainerDescIntro]}>
      This is an early beta. Your feedback is appreciated!
    </Text>
  </View>
)

const Tabs = () => (
  <View style={styles.explainer}>
    <View style={styles.explainerIcon}>
      <View style={s.flex1} />
      <FontAwesomeIcon
        icon={['far', 'clone']}
        style={[s.black as FontAwesomeIconStyle, s.mb5]}
        size={36}
      />
      <View style={s.flex1} />
    </View>
    <Text style={styles.explainerHeading}>Tabs</Text>
    <Text style={styles.explainerDesc}>
      Never lose your place! Long-press to open posts and profiles in a new tab.
    </Text>
    <Text style={styles.explainerDesc}>
      <Image source={TABS_EXPLAINER} style={styles.explainerImg} />
    </Text>
  </View>
)

const SCENE_MAP = {
  intro: Intro,
  tabs: Tabs,
}
const renderScene = SceneMap(SCENE_MAP)

export const FeatureExplainer = () => {
  const layout = useWindowDimensions()
  const store = useStores()
  const [index, setIndex] = useState(0)

  const onPressSkip = () => store.onboard.next()
  const onPressNext = () => {
    if (index >= ROUTES.length - 1) {
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

  const FirstExplainer = SCENE_MAP[ROUTES[0]?.key as keyof typeof SCENE_MAP]
  return (
    <SafeAreaView style={styles.container}>
      {ROUTES.length > 1 ? (
        <TabView
          navigationState={{index, routes: ROUTES}}
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
        <TouchableOpacity
          onPress={onPressSkip}
          testID="onboardFeatureExplainerSkipBtn">
          <Text style={[s.blue3, s.f18]}>Skip</Text>
        </TouchableOpacity>
        <View style={s.flex1} />
        <TouchableOpacity
          onPress={onPressNext}
          testID="onboardFeatureExplainerNextBtn">
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
  explainerHeadingIntro: {
    lineHeight: 60,
    paddingTop: 50,
    paddingBottom: 50,
  },
  explainerHeadingBrand: {fontSize: 56},
  explainerDesc: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  explainerDescIntro: {fontSize: 24},
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
