export type TrackEvent = (
  event: keyof TrackPropertiesMap,
  properties?: TrackPropertiesMap[keyof TrackPropertiesMap],
) => Promise<void>

export type ScreenEvent = (
  name: keyof ScreenPropertiesMap,
  properties?: ScreenPropertiesMap[keyof ScreenPropertiesMap],
) => Promise<void>
interface TrackPropertiesMap {
  // LOGIN / SIGN UP events
  'Sign In': {resumedSession: boolean} // CAN BE SERVER
  'Create Account': {} // CAN BE SERVER
  'Signin:PressedForgotPassword': {}
  'Signin:PressedSelectService': {}
  // COMPOSER / CREATE POST events
  'Create Post': {imageCount: string} // CAN BE SERVER
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
  'EditProfile:Save': {} // CAN BE SERVER
  // FEED events
  'Feed:onRefresh': {}
  'Feed:onEndReached': {}
  // FEED ITEM events
  'FeedItem:PostReply': {} // CAN BE SERVER
  'FeedItem:PostRepost': {} // CAN BE SERVER
  'FeedItem:PostLike': {} // CAN BE SERVER
  'FeedItem:PostDelete': {} // CAN BE SERVER
  'FeedItem:ThreadMute': {} // CAN BE SERVER
  // PROFILE HEADER events
  'ProfileHeader:EditProfileButtonClicked': {}
  'ProfileHeader:FollowersButtonClicked': {}
  'ProfileHeader:FollowsButtonClicked': {}
  'ProfileHeader:ShareButtonClicked': {}
  'ProfileHeader:MuteAccountButtonClicked': {}
  'ProfileHeader:UnmuteAccountButtonClicked': {}
  'ProfileHeader:ReportAccountButtonClicked': {}
  'ProfileHeader:AddToListsButtonClicked': {}
  'ProfileHeader:BlockAccountButtonClicked': {}
  'ProfileHeader:UnblockAccountButtonClicked': {}
  'ProfileHeader:FollowButtonClicked': {}
  'ProfileHeader:UnfollowButtonClicked': {}
  'ViewHeader:MenuButtonClicked': {}
  // SETTINGS events
  'Settings:SwitchAccountButtonClicked': {}
  'Settings:AddAccountButtonClicked': {}
  'Settings:ChangeHandleButtonClicked': {}
  'Settings:InvitecodesButtonClicked': {}
  'Settings:ContentfilteringButtonClicked': {}
  'Settings:SignOutButtonClicked': {}
  'Settings:ContentlanguagesButtonClicked': {}
  // MENU events
  'Menu:ItemClicked': {url: string}
  'Menu:FeedbackClicked': {}
  // MOBILE SHELL events
  'MobileShell:MyProfileButtonPressed': {}
  'MobileShell:HomeButtonPressed': {}
  'MobileShell:SearchButtonPressed': {}
  'MobileShell:NotificationsButtonPressed': {}
  'MobileShell:FeedsButtonPressed': {}
  // LISTS events
  'Lists:onRefresh': {}
  'Lists:onEndReached': {}
  'CreateMuteList:AvatarSelected': {}
  'CreateMuteList:Save': {} // CAN BE SERVER
  // CUSTOM FEED events
  'MultiFeed:onEndReached': {}
  'MultiFeed:onRefresh': {}
  // MODERATION events
  'Moderation:ContentfilteringButtonClicked': {}
}

interface ScreenPropertiesMap {
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
  AppPasswords: {}
  Moderation: {}
  BlockedAccounts: {}
  MutedAccounts: {}
  SavedFeeds: {}
}
