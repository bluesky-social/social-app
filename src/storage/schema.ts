import {Result} from '#/view/com/composer/text-input/tagsAutocompleteState'

/**
 * Device data that's specific to the device and does not vary based account
 */
export type Device = {
  fontScale: '-2' | '-1' | '0' | '1' | '2'
  fontFamily: 'system' | 'theme'
  lastNuxDialog: string | undefined
  geolocation?: {
    countryCode: string | undefined
  }
}

/**
 * Account data that's specific to the current account
 */
export type Account = {
  recentTags: Result[] | undefined
}
