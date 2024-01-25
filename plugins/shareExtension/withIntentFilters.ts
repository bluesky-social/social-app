import {ConfigPlugin, withAndroidManifest} from '@expo/config-plugins'

export const withIntentFilters: ConfigPlugin = config => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  return withAndroidManifest(config, config => {
    const intents = [
      {
        action: [
          {
            $: {
              'android:name': 'android.intent.action.SEND',
            },
          },
        ],
        category: [
          {
            $: {
              'android:name': 'android.intent.category.DEFAULT',
            },
          },
        ],
        data: [
          {
            $: {
              'android:mimeType': 'image/*',
            },
          },
        ],
      },
      {
        action: [
          {
            $: {
              'android:name': 'android.intent.action.SEND',
            },
          },
        ],
        category: [
          {
            $: {
              'android:name': 'android.intent.category.DEFAULT',
            },
          },
        ],
        data: [
          {
            $: {
              'android:mimeType': 'text/plain',
            },
          },
        ],
      },
      {
        action: [
          {
            $: {
              'android:name': 'android.intent.action.SEND_MULTIPLE',
            },
          },
        ],
        category: [
          {
            $: {
              'android:name': 'android.intent.category.DEFAULT',
            },
          },
        ],
        data: [
          {
            $: {
              'android:mimeType': 'image/*',
            },
          },
        ],
      },
    ]

    const intentFilter =
      config.modResults.manifest.application?.[0].activity?.[0]['intent-filter']

    if (intentFilter) {
      intentFilter.push(...intents)
    }

    return config
  })
}
