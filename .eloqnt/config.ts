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
    },
    overrides: [
      {
        // The {name} argument is omitted on purpose
        keys: "Before you can get notifications for {name}'s posts, you must first verify your email.",
        locales: ['hu'],
        rules: {'inconsistent-args': 'off'},
      },
    ],
  },
})
