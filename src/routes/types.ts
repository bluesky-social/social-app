import type {NavigatorScreenParams} from '@react-navigation/native'
import type {CompositeScreenProps} from '@react-navigation/native'
import type {StackScreenProps} from '@react-navigation/stack'
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs'

export type RootStackParamList = {
  Primary: undefined
  Profile: {name: string}
  Login: undefined
  Signup: undefined
  NotFound: undefined
}
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>

export type PrimaryTabParamList = {
  Home: NavigatorScreenParams<RootStackParamList>
  Search: undefined
  Notifications: undefined
  Menu: undefined
}
export type PrimaryTabScreenProps<T extends keyof PrimaryTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<PrimaryTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >
