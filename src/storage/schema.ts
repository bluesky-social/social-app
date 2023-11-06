/**
 * The shape of the object we store in local storage.
 */
export type Schema = {
  shell: {
    colorMode: 'system' | 'light' | 'dark'
  }
}

/**
 * The default values for the schema. This is used to initialize the store, and
 * is used in case AsyncStorage is unavailable. This should be kept in sync
 * with the Schema type above.
 */
export const defaultData: Schema = {
  shell: {
    colorMode: 'system',
  },
}
