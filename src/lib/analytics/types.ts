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
  'Try Create Account': {}
  'Create Account Successfully': {}
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
  // POST events
  'Post:Like': {} // CAN BE SERVER
  'Post:Unlike': {} // CAN BE SERVER
  'Post:Repost': {} // CAN BE SERVER
  'Post:Unrepost': {} // CAN BE SERVER
  'Post:Delete': {} // CAN BE SERVER
  'Post:ThreadMute': {} // CAN BE SERVER
  'Post:ThreadUnmute': {} // CAN BE SERVER
  'Post:Reply': {} // CAN BE SERVER
  // FEED ITEM events
  'FeedItem:PostReply': {} // CAN BE SERVER
  'FeedItem:PostRepost': {} // CAN BE SERVER
  'FeedItem:PostLike': {} // CAN BE SERVER
  'FeedItem:PostDelete': {} // CAN BE SERVER
  'FeedItem:ThreadMute': {} // CAN BE SERVER
  // PROFILE events
  'Profile:Follow': {
    username: string
  }
  'Profile:Unfollow': {
    username: string
  }
  // PROFILE HEADER events
  'ProfileHeader:EditProfileButtonClicked': {}
  'ProfileHeader:FollowersButtonClicked': {
    handle: string
  }
  'ProfileHeader:FollowsButtonClicked': {
    handle: string
  }
  'ProfileHeader:ShareButtonClicked': {}
  'ProfileHeader:MuteAccountButtonClicked': {}
  'ProfileHeader:UnmuteAccountButtonClicked': {}
  'ProfileHeader:ReportAccountButtonClicked': {}
  'ProfileHeader:AddToListsButtonClicked': {}
  'ProfileHeader:BlockAccountButtonClicked': {}
  'ProfileHeader:UnblockAccountButtonClicked': {}
  'ProfileHeader:FollowButtonClicked': {}
  'ProfileHeader:UnfollowButtonClicked': {}
  'ProfileHeader:SuggestedFollowsOpened': {}
  'ProfileHeader:SuggestedFollowFollowed': {}
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
  'Menu:HelpClicked': {}
  // MOBILE SHELL events
  'MobileShell:MyProfileButtonPressed': {}
  'MobileShell:HomeButtonPressed': {}
  'MobileShell:SearchButtonPressed': {}
  'MobileShell:NotificationsButtonPressed': {}
  'MobileShell:FeedsButtonPressed': {}
  // NOTIFICATIONS events
  'Notificatons:OpenApp': {}
  // LISTS events
  'Lists:onRefresh': {}
  'Lists:onEndReached': {}
  'CreateMuteList:AvatarSelected': {}
  'CreateMuteList:Save': {} // CAN BE SERVER
  'Lists:Subscribe': {} // CAN BE SERVER
  'Lists:Unsubscribe': {} // CAN BE SERVER
  // CUSTOM FEED events
  'CustomFeed:Save': {}
  'CustomFeed:Unsave': {}
  'CustomFeed:Like': {}
  'CustomFeed:Unlike': {}
  'CustomFeed:Share': {}
  'CustomFeed:Pin': {
    uri: string
    name: string
  }
  'CustomFeed:Unpin': {
    uri: string
    name: string
  }
  'CustomFeed:Reorder': {
    uri: string
    name: string
    index: number
  }
  'CustomFeed:LoadMore': {}
  'MultiFeed:onEndReached': {}
  'MultiFeed:onRefresh': {}
  // MODERATION events
  'Moderation:ContentfilteringButtonClicked': {}
  // ONBOARDING events
  'Onboarding:Begin': {}
  'Onboarding:Complete': {}
  'Onboarding:Skipped': {}
  'Onboarding:Reset': {}
  'Onboarding:SuggestedFollowFollowed': {}
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
  'Profile:Preview': {}
  Settings: {}
  AppPasswords: {}
  Moderation: {}
  BlockedAccounts: {}
  MutedAccounts: {}
  SavedFeeds: {}
}
