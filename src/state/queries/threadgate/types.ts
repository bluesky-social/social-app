export type ThreadgateAllowUISetting =
  | {type: 'everybody'}
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'list'; list: unknown}
