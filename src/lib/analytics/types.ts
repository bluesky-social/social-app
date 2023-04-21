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
  'Sign In': {resumedSession: boolean} // SERVER
  'Create Account': {} // SERVER
  'Signin:PressedForgotPassword': {}
  'Signin:PressedSelectService': {}
  // COMPOSER / CREATE POST events
  'Create Post': {imageCount: string} // SERVER
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
  'EditProfile:Save': {} // SERVER
  // FEED events
  'Feed:onRefresh': {}
  'Feed:onEndReached': {}
  // FEED ITEM events
  'FeedItem:PostReply': {} // SERVER
  'FeedItem:PostRepost': {} // SERVER
  'FeedItem:PostLike': {} // SERVER
  'FeedItem:PostDelete': {} // SERVER
  // PROFILE HEADER events
  'ProfileHeader:EditProfileButtonClicked': {}
  'ProfileHeader:FollowersButtonClicked': {}
  'ProfileHeader:FollowsButtonClicked': {}
  'ProfileHeader:ShareButtonClicked': {}
  'ProfileHeader:MuteAccountButtonClicked': {}
  'ProfileHeader:UnmuteAccountButtonClicked': {}
  'ProfileHeader:ReportAccountButtonClicked': {}
  'ViewHeader:MenuButtonClicked': {}
  // SETTINGS events
  'Settings:SwitchAccountButtonClicked': {}
  'Settings:AddAccountButtonClicked': {}
  'Settings:ChangeHandleButtonClicked': {}
  'Settings:InvitecodesButtonClicked': {}
  'Settings:ContentfilteringButtonClicked': {}
  'Settings:SignOutButtonClicked': {}
  // MENU events
  'Menu:ItemClicked': {url: string}
  'Menu:FeedbackClicked': {}
  // MOBILE SHELL events
  'MobileShell:MyProfileButtonPressed': {}
  'MobileShell:HomeButtonPressed': {}
  'MobileShell:SearchButtonPressed': {}
  'MobileShell:NotificationsButtonPressed': {}
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
}
