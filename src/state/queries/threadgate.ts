export type ThreadgateSetting =
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: string}
