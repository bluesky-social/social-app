import type {StackScreenProps} from '@react-navigation/stack'

export type ScreensParamList = {
  Home: undefined
  Search: undefined
  Notifications: undefined
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
export type ScreensProps<T extends keyof ScreensParamList> = StackScreenProps<
  ScreensParamList,
  T
>

export type OnNavigateContent = (
  screen: string,
  params: Record<string, string>,
) => void
