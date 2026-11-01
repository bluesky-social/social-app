import {defineConfig} from '@eloqnt/cli'

export default defineConfig({
  messages: {
    path: './src/locale/locales/{locale}/messages',
    locales: 'infer',
    sourceLocale: 'en',
    format: 'po',
  },
  lint: {
    rules: {
      // The nightly `lingui extract --clean --locale en` prunes removed
      // strings from the English catalog while the other locales are only
      // pruned on release (`intl:release`), so stale keys in translations
      // are routine mid-cycle.
      'superfluous-key': 'warn',
      // Many translations predate Crowdin and carry a `one` case in locales
      // that only use `other` (e.g. zh, ja). It's harmless, but could be removed.
      'unreachable-plural-case': 'off',
    },
    overrides: [
      {
        // Arguments are omitted on purpose
        keys: [
          "Before you can get notifications for {name}'s posts, you must first verify your email.",
          '{formattedPostCount} {postCount, plural, one {post} other {posts}}',
          'Only {0} of {1} {2, plural, one {image} other {images}} added; limit is {MAX_GALLERY_IMAGES}',
        ],
        locales: ['hu'],
        rules: {'inconsistent-args': 'off'},
      },
    ],
  },
})
