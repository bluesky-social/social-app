import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/macro'

import {HELP_DESK_URL} from '#/lib/constants'
import {type Gate} from '#/lib/statsig/gates'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {Bell_Stroke2_Corner0_Rounded as NotificationIcon} from '#/components/icons/Bell'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Contacts_Stroke2_Corner2_Rounded as ContactsIcon} from '#/components/icons/Contacts'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Lock_Stroke2_Corner2_Rounded as LockIcon} from '#/components/icons/Lock'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'

export type SettingsSearchContext = {
  isNative: boolean
  findContactsEnabled: boolean
  gate: (name: Gate) => boolean
}

export type SettingsSearchItem = {
  id: string
  titleKey: MessageDescriptor
  icon: React.ComponentType<SVGIconProps>
  to?: string
  externalUrl?: string
  keywords?: MessageDescriptor[]
  condition?: (ctx: SettingsSearchContext) => boolean
}

export const SETTINGS_SEARCH_ITEMS: SettingsSearchItem[] = [
  {
    id: 'account',
    titleKey: msg`Account`,
    icon: PersonIcon,
    to: '/settings/account',
    keywords: [
      msg`Email`,
      msg`Verify your email`,
      msg`Password`,
      msg`Handle`,
      msg`Birthday`,
      msg`Export my data`,
      msg`Deactivate account`,
      msg`Delete account`,
    ],
  },
  {
    id: 'privacy-and-security',
    titleKey: msg`Privacy and security`,
    icon: LockIcon,
    to: '/settings/privacy-and-security',
    keywords: [
      msg`Two-factor authentication`,
      msg`Email 2FA`,
      msg`App passwords`,
      msg`Allow others to be notified of your posts`,
      msg`Logged-out visibility`,
    ],
  },
  {
    id: 'moderation',
    titleKey: msg`Moderation`,
    icon: HandIcon,
    to: '/moderation',
    keywords: [
      msg`Interaction settings`,
      msg`Muted words & tags`,
      msg`Moderation lists`,
      msg`Muted accounts`,
      msg`Blocked accounts`,
      msg`Verification settings`,
      msg`Content filters`,
      msg`Enable adult content`,
    ],
  },
  {
    id: 'notifications',
    titleKey: msg`Notifications`,
    icon: NotificationIcon,
    to: '/settings/notifications',
    keywords: [
      msg`Enable push notifications`,
      msg`Likes`,
      msg`New followers`,
      msg`Replies`,
      msg`Mentions`,
      msg`Quotes`,
      msg`Reposts`,
      msg`Activity from others`,
      msg`Likes of your reposts`,
      msg`Reposts of your reposts`,
    ],
  },
  {
    id: 'content-and-media',
    titleKey: msg`Content and media`,
    icon: WindowIcon,
    to: '/settings/content-and-media',
    keywords: [
      msg`Manage saved feeds`,
      msg`Thread preferences`,
      msg`Following feed preferences`,
      msg`External media`,
      msg`Your interests`,
      msg`Use in-app browser to open links`,
      msg`Autoplay videos and GIFs`,
      msg`Enable trending topics`,
      msg`Enable trending videos`,
    ],
  },
  {
    id: 'find-contacts',
    titleKey: msg`Find friends from contacts`,
    icon: ContactsIcon,
    to: '/settings/find-contacts',
    keywords: [msg`Phone contacts`, msg`Find friends`],
    condition: ctx =>
      ctx.isNative &&
      ctx.findContactsEnabled &&
      !ctx.gate('disable_settings_find_contacts'),
  },
  {
    id: 'appearance',
    titleKey: msg`Appearance`,
    icon: PaintRollerIcon,
    to: '/settings/appearance',
    keywords: [
      msg`Color mode`,
      msg`Dark theme`,
      msg`Font`,
      msg`Font size`,
    ],
  },
  {
    id: 'accessibility',
    titleKey: msg`Accessibility`,
    icon: AccessibilityIcon,
    to: '/settings/accessibility',
    keywords: [
      msg`Alt text`,
      msg`Require alt text before posting`,
      msg`Display larger alt text badges`,
      msg`Haptics`,
      msg`Disable haptic feedback`,
    ],
  },
  {
    id: 'language',
    titleKey: msg`Languages`,
    icon: EarthIcon,
    to: '/settings/language',
    keywords: [
      msg`App Language`,
      msg`Primary Language`,
      msg`Content Languages`,
    ],
  },
  {
    id: 'help',
    titleKey: msg`Help`,
    icon: CircleQuestionIcon,
    externalUrl: HELP_DESK_URL,
    keywords: [msg`Support`, msg`FAQ`, msg`Contact us`],
  },
  {
    id: 'about',
    titleKey: msg`About`,
    icon: BubbleInfoIcon,
    to: '/settings/about',
    keywords: [
      msg`Terms of Service`,
      msg`Privacy Policy`,
      msg`Status Page`,
      msg`System log`,
      msg`Clear image cache`,
      msg`Version`,
    ],
  },
]
