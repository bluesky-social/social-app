export type TrackPropertiesMap = {
  // LOGIN / SIGN UP events
  'Sign In': {resumedSession: boolean} // CAN BE SERVER
  'Create Account': {} // CAN BE SERVER
  'Try Create Account': {}
  'Signin:PressedForgotPassword': {}
  'Signin:PressedSelectService': {}
  // COMPOSER / CREATE POST events
  'Create Post': {imageCount: string | number} // CAN BE SERVER
  'Composer:PastedPhotos': {}
  'Composer:CameraOpened': {}
  'Composer:GalleryOpened': {}
  'Composer:ThreadgateOpened': {}
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
  'Post:EditThreadgateOpened': {}
  'Post:ThreadgateEdited': {}
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
  'MobileShell:MessagesButtonPressed': {}
  // NOTIFICATIONS events
  'Notificatons:OpenApp': {}
  // LISTS events
  'Lists:onRefresh': {}
  'Lists:onEndReached': {}
  'CreateList:AvatarSelected': {}
  'CreateList:SaveCurateList': {} // CAN BE SERVER
  'CreateList:SaveModList': {} // CAN BE SERVER
  'Lists:Mute': {} // CAN BE SERVER
  'Lists:Unmute': {} // CAN BE SERVER
  'Lists:Block': {} // CAN BE SERVER
  'Lists:Unblock': {} // CAN BE SERVER
  'Lists:Delete': {} // CAN BE SERVER
  'Lists:Share': {} // CAN BE SERVER
  // CUSTOM FEED events
  'CustomFeed:Save': {}
  'CustomFeed:Unsave': {}
  'CustomFeed:Like': {}
  'CustomFeed:Unlike': {}
  'CustomFeed:Share': {}
  'CustomFeed:Pin': {
    uri: string
    name?: string
  }
  'CustomFeed:Unpin': {
    uri: string
    name?: string
  }
  'CustomFeed:Reorder': {
    uri: string
    name?: string
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
  'Onboarding:CustomFeedAdded': {}
  // Onboarding v2
  'OnboardingV2:Begin': {}
  'OnboardingV2:StepInterests:Start': {}
  'OnboardingV2:StepInterests:End': {
    selectedInterests: string[]
    selectedInterestsLength: number
  }
  'OnboardingV2:StepInterests:Error': {}
  'OnboardingV2:StepSuggestedAccounts:Start': {}
  'OnboardingV2:StepSuggestedAccounts:End': {
    selectedAccountsLength: number
  }
  'OnboardingV2:StepFollowingFeed:Start': {}
  'OnboardingV2:StepFollowingFeed:End': {}
  'OnboardingV2:StepAlgoFeeds:Start': {}
  'OnboardingV2:StepAlgoFeeds:End': {
    selectedPrimaryFeeds: string[]
    selectedPrimaryFeedsLength: number
    selectedSecondaryFeeds: string[]
    selectedSecondaryFeedsLength: number
  }
  'OnboardingV2:StepTopicalFeeds:Start': {}
  'OnboardingV2:StepTopicalFeeds:End': {
    selectedFeeds: string[]
    selectedFeedsLength: number
  }
  'OnboardingV2:StepModeration:Start': {}
  'OnboardingV2:StepModeration:End': {}
  'OnboardingV2:StepProfile:Start': {}
  'OnboardingV2:StepProfile:End': {}
  'OnboardingV2:StepFinished:Start': {}
  'OnboardingV2:StepFinished:End': {}
  'OnboardingV2:Complete': {}
  'OnboardingV2:Skip': {}
}

export type ScreenPropertiesMap = {
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
  PreferencesExternalEmbeds: {}
  BlockedAccounts: {}
  MutedAccounts: {}
  SavedFeeds: {}
}
