import React, {useState, useEffect} from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  Button,
  useColorScheme,
  View,
} from 'react-native'
import {NavigationContainer} from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import {RootStore, setupState, RootStoreProvider} from './state'

type RootStackParamList = {
  Home: undefined
  Profile: {name: string}
}
const Stack = createNativeStackNavigator()

const HomeScreen = ({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Home'>) => {
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text>Web</Text>
          <Button
            title="Go to Jane's profile"
            onPress={() => navigation.navigate('Profile', {name: 'Jane'})}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const ProfileScreen = ({
  route,
}: NativeStackScreenProps<RootStackParamList, 'Profile'>) => {
  return <Text>This is {route.params.name}'s profile</Text>
}

function App() {
  const [rootStore, setRootStore] = useState<RootStore | undefined>(undefined)

  // init
  useEffect(() => {
    setupState().then(setRootStore)
  }, [])

  // show nothing prior to init
  if (!rootStore) {
    return null
  }

  return (
    <RootStoreProvider value={rootStore}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'Welcome'}}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </RootStoreProvider>
  )
}

export default App
