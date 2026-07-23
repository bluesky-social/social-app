/**
 * If a feature is in the beta program, be sure to add a localized description
 * for it via getFeatureDescription().
 */
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
  PostThreadKnownLikersEnable = 'post_thread:known_likers:enable',
  PostThreadKnownLikersFetchEnable = 'post_thread:known_likers:fetch:enable',
  CustomLogoJapanEnable = 'custom_logo:japan:enable',
  VideoMultipartUploadEnable = 'video:multipart_upload:enable',
  SearchStarterPacksV2Enable = 'search_starter_packs_v2:enable',

  AATest = 'aa-test',
}
