/**
 * The shape of the object we store in local storage
 */
export type Schema = {
  shell: {
    colorMode: 'system' | 'light' | 'dark'
  }
}

export const defaultData: Schema = {
  shell: {
    colorMode: 'system',
  },
}
