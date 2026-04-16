export enum Features {
  // core flags
  IsBskyTeam = 'is_bsky_team',

  // debug flags
  DebugFeedContext = 'debug_feed_context',

  // feature flags
  ImportContactsOnboardingDisable = 'import_contacts:onboarding:disable',
  ImportContactsSettingsDisable = 'import_contacts:settings:disable',
  LiveNowBetaDisable = 'live_now_beta:disable',
  ImageUploadsHighResolution = 'image_uploads:high_resolution',
  ImageUploadsBlobSize2mbEnabled = 'image_uploads:blob_size_2mb:enabled',
  GroupChatsEnable = 'group_chats:enable',
  DmsNewMessageComposerEnable = 'dms:new_message_composer:enable',

  AATest = 'aa-test',

  // owner: @growth, remove by: 2026-10-01 (post-KPI readout) — ticket i9KLo7kw
  StreaksAndRecapEnable = 'streaks_and_recap:enable',
}
