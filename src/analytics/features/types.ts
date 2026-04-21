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
  GroupChatsHasBeenReleased = 'group_chats:has_been_released',
  DmsNewMessageComposerEnable = 'dms:new_message_composer:enable',
  KlipyGifProviderEnable = 'klipy_gif_provider:enable',
  PostGalleryEmbedEnable = 'post_gallery_embed:enable',
  AATest = 'aa-test',
}
