export type ThreadgateAllowUISetting =
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: unknown}
