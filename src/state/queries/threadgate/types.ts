export type ThreadgateAllowUISetting =
  | {type: 'everybody'}
  | {type: 'nobody'}
  | {type: 'mention'}
  | {type: 'following'}
  | {type: 'followers'}
  | {type: 'list'; list: string}
