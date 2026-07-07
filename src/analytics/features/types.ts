export enum Features {
  // core flags
  IsBskyTeam = 'is_bsky_team',

  // debug flags
  DebugFeedContext = 'debug_feed_context',

  // feature flags
  ImportContactsOnboardingDisable = 'import_contacts:onboarding:disable',
  ImportContactsSettingsDisable = 'import_contacts:settings:disable',
  LiveNowBetaDisable = 'live_now_beta:disable',
  GroupChatsDisable = 'group_chats:disable',
  ComposerLanguageDetectionEnable = 'composer:language_detection:enable',
  PostGalleryEmbedEnable = 'post_gallery_embed:enable',
  SearchV2Enable = 'search_v2:enable',
  AdvancedSearchV2Enable = 'advanced_search_v2:enable',

  AATest = 'aa-test',
}
