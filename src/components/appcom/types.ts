export interface AppComNode {
  type: string
  key?: string
  props?: Record<string, any>
  children?: Array<AppComNode>
}
