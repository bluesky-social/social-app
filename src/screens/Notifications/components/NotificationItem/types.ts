import {
  type NotificationView,
  type NotificationViewType,
} from '#/state/queries/notifications/grouped/types'

/**
 * The notification view for a single kind, e.g. `NotificationOf<'like'>`.
 */
export type NotificationOf<T extends NotificationViewType> = Extract<
  NotificationView,
  {type: T}
>
