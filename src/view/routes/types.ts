import type {StackScreenProps} from '@react-navigation/stack'

export type RootTabsParamList = {
  HomeTab: undefined
  SearchTab: undefined
  NotificationsTab: undefined
  MenuTab: undefined
  Profile: {name: string}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  PostThread: {name: string; recordKey: string}
  PostLikedBy: {name: string; recordKey: string}
  PostRepostedBy: {name: string; recordKey: string}
  Composer: {replyTo?: string}
  Login: undefined
  Signup: undefined
  NotFound: undefined
}
export type RootTabsScreenProps<T extends keyof RootTabsParamList> =
  StackScreenProps<RootTabsParamList, T>

export type OnNavigateContent = (
  screen: string,
  params: Record<string, string>,
) => void

/*
NOTE
this is leftover from a nested nav implementation
keeping it around for future reference
-prf

import type {NavigatorScreenParams} from '@react-navigation/native'
import type {CompositeScreenProps} from '@react-navigation/native'
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs'

Container: NavigatorScreenParams<PrimaryStacksParamList>
export type PrimaryStacksParamList = {
  Home: undefined
  Profile: {name: string}
}
export type PrimaryStacksScreenProps<T extends keyof PrimaryStacksParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<PrimaryStacksParamList, T>,
    RootTabsScreenProps<keyof RootTabsParamList>
  >
*/
