import {SiftItem} from '@bsky.app/sift'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'
import {type AutocompleteItemProps} from './types'

export function AutocompleteItemProfile({
  active,
  isFirst,
  isLast,
  props,
  item,
}: AutocompleteItemProps) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  if (item.type !== 'profile' || !moderationOpts) return null

  return (
    <SiftItem
      {...props}
      style={s => [
        a.py_sm,
        a.px_md,
        active || s.hovered || s.pressed ? [t.atoms.bg_contrast_25] : [],
        isFirst && {
          paddingTop: a.py_sm.paddingTop * 1.2,
        },
        isLast && {
          paddingBottom: a.py_sm.paddingTop * 1.2,
        },
      ]}>
      <ProfileCard.Header>
        <ProfileCard.Avatar
          disabledPreview
          profile={item.profile}
          moderationOpts={moderationOpts}
        />
        <ProfileCard.NameAndHandle
          profile={item.profile}
          moderationOpts={moderationOpts}
        />
      </ProfileCard.Header>
    </SiftItem>
  )
}
