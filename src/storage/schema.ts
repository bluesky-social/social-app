/**
 * Device data that's specific to the device and does not vary based account
 */
export type Device = {
  fontScale: number
  fontFamily: 'system' | 'theme'
  lastNuxDialog: string | undefined
}
