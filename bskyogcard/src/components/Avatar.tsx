import {AppBskyActorDefs, moderateProfile} from '@atproto/api'

import {ModeratorData} from '../data/getModeratorData.js'
import {Image as ImageSource} from '../data/getPostData.js'
import {atoms as a, theme as t} from '../theme/index.js'
import {Box} from './Box.js'
import {DefaultUser} from './icons/avatars/DefaultUser.js'
import {Image} from './Image.js'

export function Avatar({
  size,
  image,
  profile,
  moderatorData,
}: {
  size: number
  image: ImageSource
  profile: AppBskyActorDefs.ProfileViewBasic
  moderatorData: ModeratorData
}) {
  const moderation = moderateProfile(profile, moderatorData.moderationOptions)
  const modui = moderation.ui('avatar')
  const blur = !!modui?.blurs[0]
  const isLabeller = !!profile.associated?.labeler
  return (
    <Box
      cx={[
        isLabeller ? a.rounded_xs : a.rounded_full,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
        {
          width: size + 'px',
          height: size + 'px',
        },
        blur && {
          filter: 'blur(2.5px)',
        },
      ]}>
      {image ? (
        <Image height="100%" width="100%" image={image} />
      ) : (
        <DefaultUser size={size} />
      )}
    </Box>
  )
}
