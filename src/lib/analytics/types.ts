import {
  ClientMethods,
  GroupTraits,
  JsonMap,
  UserTraits,
} from '@segment/analytics-react-native'

export type IAnalyticsEvent = {
  name: keyof TrackPropertiesMap
  properties: TrackPropertiesMap[keyof TrackPropertiesMap]
}

export interface IAnalyticsProvider extends ClientMethods {
  screen: (name: string, properties?: JsonMap) => Promise<void>
  track: (event: string, properties?: JsonMap) => Promise<void>
  identify: (userId?: string, userTraits?: UserTraits) => Promise<void>
  flush: () => Promise<void>
  group: (groupId: string, groupTraits?: GroupTraits) => Promise<void>
  alias: (newUserId: string) => Promise<void>
  reset: (resetAnonymousId?: boolean) => Promise<void>
}

export interface TrackPropertiesMap {
  // LOGIN / SIGN UP events
  'Sing In': {resumedSession: boolean}
  'Create Account': {}
  'SignIn:ForgotPassowrd': {}
  'SignIn:PressedSelectService': {}
  // COMPOSER / CREATE POST events
  'Create Post': {imageCount: string}
  'Composer:PastedPhotos': {}
  'Composer:CameraOpened': {}
  'Composer:GalleryOpened': {}
  'HomeScreen:PressCompose': {}
  'ProfileScreen:PressCompose': {}
  // EDIT PROFILE events
  'EditHandle:ViewCustomForm': {}
  'EditHandle:ViewProvidedForm': {}
  'EditHandle:SetNewHandle': {}
  'EditProfile:AvatarSelected': {}
  'EditProfile:BannerSelected': {}
  'EditProfile:Save': {}
  // FEED events
  'Feed:onRefresh': {}
  'Feed:onEndReached': {}
  // FEED ITEM events
  'FeedItem:PostReply': {}
  'FeedItem:PostRepost': {}
  'FeedItem:PostLike': {}
  'FeedItem:PostDelete': {}
  // PROFILE HEADER events
  'ProfileHeaeder:EditProfileButtonClicked': {}
  'ProfileHeader:FollowersButtonClicked': {}
  'ProfileHeader:FollowsButtonClicked': {}
  'ProfileHeader:ShareButtonClicked': {}
  'ProfileHeader:MuteAccountButtonClicked': {}
  'ProfileHeader:UnmuteAccountButtonClicked': {}
  'ProfileHeader:ReportAccountButtonClicked': {}
  'ViewHeader:MenuButtonClicked': {}
  // SETTINGS events
  'Settings:SwitchAccountButtonCLicked': {}
  'Settings:AddAccountButtonClicked': {}
  'Settings:ChangeHandleButtonClicked': {}
  'Settings:InvitecodesButtonClicked': {}
  'Settings:ContentfilteringButtonClicked': {}
  'Settings:SignOutButtonClicked': {}
  // MENU events
  'Menu:ItemClicked': {url: string}
  'Menu:FeedbackClicked': {}
  // MOBILE SHELL events
  'MobileShell:ProfileButtonPressed': {}
  'MobileShell:FeedButtonPressed': {}
  'MobileShell:SearchButtonPressed': {}
  'MobileShell:NotificationsButtonPressed': {}
}

export interface ScreenPropertiesMap {
  Login: {}
  CreateAccount: {}
  'Choose Account': {}
  'Signin:ForgotPassword': {}
  'Signin:SetNewPasswordForm': {}
  'Signin:PasswordUpdatedForm': {}
  Feed: {}
  Notifications: {}
  Profile: {}
  Settings: {}
}
