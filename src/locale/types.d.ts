import 'i18next'
import resources from './resources'

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)[keyof typeof resources]
  }
}
